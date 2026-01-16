import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import type { TranscriptData, Fact, ExtractionResponse } from "@/lib/types";

const THEMES = [
    "User Behavior",
    "Needs",
    "Painpoint",
    "Visual Design",
    "Expectation",
    "Routine",
    "Security",
    "Motivation",
    "Frustration",
    "Accessibility",
    "Mental Models",
    "Workaround",
    "Language and Terminology",
    "Technical Limitation",
    "Suggestions",
    "Retention Drivers",
    "Decision Making Process",
    "Satisfaction",
    "Preference",
    "Comparative Feedback",
    "Usability",
] as const;

function formatTimeToHHMMSS(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function buildSystemPrompt(
    dataType: string,
    product: string,
    feature: string
): string {
    return `# ROLE

You are a Senior UX Research Operations Bot. Your sole purpose is to "shred" interview transcripts into "Atomic Nuggets" (Facts).

# CONTEXT

- Data Type: ${dataType}
- Product: ${product}
- Feature: ${feature}

# TASK

Analyze the provided JSON transcript. Extract every significant observation, friction point, or insight.

# EXTRACTION RULES (STRICT ACCURACY)

1. NO PARAPHRASING: The \`verbatim_quote\` must be a direct word-for-word string from the transcript.
2. TIMESTAMPS: Use the exact start time provided in the ElevenLabs JSON, formatted as HH:MM:SS.
3. SINGLE THEME: Choose exactly ONE theme per fact from the provided list.
4. ATOMICITY: Each fact must represent only ONE idea. If a user mentions two pain points, create two separate facts.

# THEME LIST (STRICT ENUM)

${THEMES.join(", ")}

# OUTPUT FORMAT

Return ONLY a valid JSON object matching the provided schema. Do not include any narrative text or explanations.`;
}

function buildResponseSchema(): Schema {
    return {
        type: SchemaType.OBJECT,
        properties: {
            facts: {
                type: SchemaType.ARRAY,
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        fact_id: {
                            type: SchemaType.STRING,
                            description:
                                "Unique ID for this nugget (e.g., FACT_01)",
                        },
                        verbatim_quote: {
                            type: SchemaType.STRING,
                            description: "Direct quote from transcript.",
                        },
                        timestamp: {
                            type: SchemaType.STRING,
                            description: "HH:MM:SS format.",
                        },
                        speaker_label: {
                            type: SchemaType.STRING,
                            description: "e.g., Speaker 1 or Participant",
                        },
                        sentiment: {
                            type: SchemaType.STRING,
                            enum: ["Positive", "Neutral", "Negative"],
                        },
                        theme: {
                            type: SchemaType.STRING,
                            enum: [...THEMES],
                        },
                        summary_of_observation: {
                            type: SchemaType.STRING,
                            description:
                                "Short, objective summary of the fact.",
                        },
                    },
                    required: [
                        "verbatim_quote",
                        "timestamp",
                        "speaker_label",
                        "sentiment",
                        "theme",
                        "summary_of_observation",
                    ],
                },
            },
        },
    } as unknown as Schema;
}

function validateFact(fact: Fact, transcriptText: string): boolean {
    // Check if verbatim quote exists in transcript (case-insensitive, allow for minor whitespace differences)
    const normalizedQuote = fact.verbatim_quote.trim().toLowerCase();
    const normalizedTranscript = transcriptText.toLowerCase();

    // Try exact match first
    if (normalizedTranscript.includes(normalizedQuote)) {
        return true;
    }

    // Try matching with normalized whitespace (multiple spaces -> single space)
    const normalizedQuoteSpaces = normalizedQuote.replace(/\s+/g, " ");
    const normalizedTranscriptSpaces = normalizedTranscript.replace(
        /\s+/g,
        " "
    );
    if (normalizedTranscriptSpaces.includes(normalizedQuoteSpaces)) {
        return true;
    }

    // If quote is very short, be more lenient
    if (normalizedQuote.length < 10) {
        // Check if key words from quote exist in transcript
        const words = normalizedQuote.split(/\s+/).filter((w) => w.length > 2);
        return words.every((word) => normalizedTranscript.includes(word));
    }

    return false;
}

function formatTranscriptForPrompt(transcriptData: TranscriptData): string {
    // Format the transcript with segments and timestamps for better context
    const segments: Array<{
        start: number;
        end: number;
        text: string;
        speaker_id: string;
    }> = [];
    let currentSegment: {
        start: number;
        end: number;
        text: string;
        speaker_id: string;
    } | null = null;

    for (const word of transcriptData.words) {
        if (word.type === "spacing") continue;

        if (!currentSegment || currentSegment.speaker_id !== word.speaker_id) {
            if (currentSegment) {
                segments.push(currentSegment);
            }
            currentSegment = {
                start: word.start,
                end: word.end,
                text: word.text,
                speaker_id: word.speaker_id,
            };
        } else {
            currentSegment.end = word.end;
            currentSegment.text += " " + word.text;
        }
    }
    if (currentSegment) {
        segments.push(currentSegment);
    }

    // Format as JSON-like structure for the prompt
    return JSON.stringify(
        {
            text: transcriptData.text,
            language_code: transcriptData.language_code,
            segments: segments.map((seg) => ({
                start_time: formatTimeToHHMMSS(seg.start),
                end_time: formatTimeToHHMMSS(seg.end),
                speaker_id: seg.speaker_id,
                text: seg.text,
            })),
        },
        null,
        2
    );
}

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("GEMINI_API_KEY is not configured");
            return NextResponse.json(
                {
                    error: "Server configuration error: Gemini API key is not set. Please configure GEMINI_API_KEY in your environment variables.",
                },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { transcriptData, dataType, product, feature } = body;

        if (!transcriptData) {
            return NextResponse.json(
                { error: "Transcript data is required" },
                { status: 400 }
            );
        }

        if (!dataType || !product || !feature) {
            return NextResponse.json(
                { error: "Data Type, Product, and Feature are required" },
                { status: 400 }
            );
        }

        // Initialize Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: buildResponseSchema(),
            },
        });

        // Build prompt
        const systemPrompt = buildSystemPrompt(dataType, product, feature);
        const transcriptFormatted = formatTranscriptForPrompt(transcriptData);
        const userPrompt = `Here is the transcript to analyze:\n\n${transcriptFormatted}`;

        // Generate facts
        const result = await model.generateContent([systemPrompt, userPrompt]);
        const response = await result.response;
        const responseText = response.text();

        // Parse JSON response
        let extractionResponse: ExtractionResponse;
        try {
            extractionResponse = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Failed to parse Gemini response:", parseError);
            console.error("Response text:", responseText);
            return NextResponse.json(
                { error: "Failed to parse AI response. Please try again." },
                { status: 500 }
            );
        }

        // Validate facts
        const validatedFacts: Fact[] = [];
        const transcriptText = transcriptData.text;

        for (const fact of extractionResponse.facts || []) {
            // Ensure fact_id is set
            if (!fact.fact_id) {
                fact.fact_id = `FACT_${validatedFacts.length + 1}`.padStart(
                    2,
                    "0"
                );
            }

            // Validate verbatim quote exists in transcript
            if (validateFact(fact, transcriptText)) {
                validatedFacts.push(fact);
            } else {
                console.warn(
                    `Skipping fact with invalid quote: ${fact.verbatim_quote.substring(
                        0,
                        50
                    )}...`
                );
            }
        }

        return NextResponse.json({ facts: validatedFacts });
    } catch (error) {
        console.error("Error generating facts:", error);
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: `Failed to generate facts: ${errorMessage}` },
            { status: 500 }
        );
    }
}
