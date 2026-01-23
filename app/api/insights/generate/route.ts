import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";
import { readFileSync } from "fs";
import { join } from "path";
import type { Fact, InsightsResponse, Insight } from "@/lib/types";

function buildSystemPrompt(
    dataType: string,
    product: string,
    feature: string
): string {
    // Read the strict schema prompt file
    const promptPath = join(process.cwd(), "app", "CONTEXT", "STRICT_SCHEME_PROMPT_INSIGHTS_V3.MD");
    let promptTemplate: string;
    
    try {
        promptTemplate = readFileSync(promptPath, "utf-8");
    } catch (error) {
        console.error("Failed to read STRICT_SCHEME_PROMPT_INSIGHTS_V3.MD:", error);
        // Fallback to inline prompt if file read fails
        promptTemplate = `# ATOMIC RESEARCH INSIGHT SYNTHESIZER — V2 (Hardened)

## ROLE
You are a **Senior UX Research Strategist** with deep expertise in **Synthesis**.  
Your primary skill is identifying **patterns, root causes, and product-relevant meaning** from fragmented qualitative data ("Atomic Facts").

You do **not** summarize transcripts.  
You synthesize insights that help product teams **decide what to fix, validate, or prioritize next**.

---

## CONTEXT
- **Data Source:** ${dataType}
- **Input Type:** Atomic Facts (shredded from transcripts)
- **Product:** ${product}
- **Feature / Area:** ${feature}

Each Atomic Fact represents a single observation, quote, or behavior extracted from user research.

---

## TASK
Analyze the provided collection of Atomic Facts and synthesize them into **clear, defensible Insights**.

Each Insight should:
- Reveal a **meaningful pattern or discovery**
- Explain **why it is happening**
- Clarify **why it matters** for users and the product team

Prefer **fewer, higher-quality insights** over exhaustive coverage.

---

## INSIGHT DEFINITION
An **Insight** is not a summary of events.

It is a discovery that explains user behavior and informs decisions.

**Insight Formula:**
Observation (What is happening)
- Root Cause / Motivation (Why it is happening)
- Consequence (Why it matters / what it impacts)

---

## CONSTRAINTS & RULES

### 1. Traceability (Non-Negotiable)
- Every Insight **MUST** explicitly link back to its originating evidence.
- Use \`Fact_ID\` and/or \`Source_Timestamp\`.
- If an Insight cannot be traced, **do not include it**.

---

### 2. Evidence Strength Classification
Each Insight must be labeled with **one** strength level:

- **Strong**
  - Supported by **3 or more independent Atomic Facts**
  - Represents a consistent pattern across users

- **Emerging**
  - Supported by **1–2 Atomic Facts**
  - Represents a critical edge case, showstopper, or high-risk behavior
  - Requires further validation

Do **not** inflate strength levels.

---

### 3. Insight Classification (Primary Only)
Each Insight must be categorized into **one primary type**:

- **Behavioral**  
  How users actually behave vs. what they say or expect

- **Functional**  
  Issues related to features, system logic, or UI behavior

- **Need**  
  A gap between current capabilities and user goals

- **Pain Point**  
  A specific friction causing frustration, confusion, or abandonment

> Choose the **single primary classification** that best explains the insight.  
> Do not list multiple types.

---

### 4. Root Cause Discipline ("The Why")
- The \`the_why\` must be a **defensible inference** grounded in the provided facts.
- Do **not** invent user motivations, personality traits, or intent not supported by evidence.
- Avoid generic explanations (e.g., "users are confused") unless explicitly supported.

---

### 5. Recommendation Scope Control
Recommendations must align with evidence strength:

- **Strong Insight**
  - May recommend design, UX, or product changes

- **Emerging Pattern**
  - Should recommend validation steps (e.g., follow-up research, experiment, usability test)

Avoid premature solutioning or large redesigns without sufficient evidence.

---

### 6. No Hallucination
- Do not introduce trends, behaviors, or conclusions not explicitly supported by the Atomic Facts.
- If evidence is insufficient, **omit the insight entirely**.

---

## OUTPUT SCHEMA (STRICT JSON)

Return the synthesis in the following exact JSON structure matching the provided schema.

## INPUT DATA

Paste your Atomic Facts / Nuggets below.

Each fact should include:
- A unique Fact_ID
- A short description or quote
- Optional timestamp or metadata`;
    }

    // Replace placeholders
    return promptTemplate
        .replace(/\$\{dataType\}/g, dataType)
        .replace(/\$\{product\}/g, product)
        .replace(/\$\{feature\}/g, feature);
}

function buildResponseSchema(): Schema {
    return {
        type: SchemaType.OBJECT,
        properties: {
            insight_summary: {
                type: SchemaType.OBJECT,
                properties: {
                    total_facts_analyzed: {
                        type: SchemaType.NUMBER,
                        description: "Total number of facts analyzed",
                    },
                    total_insights_generated: {
                        type: SchemaType.NUMBER,
                        description: "Total number of insights generated",
                    },
                },
                required: ["total_facts_analyzed", "total_insights_generated"],
            },
            insights: {
                type: SchemaType.ARRAY,
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        id: {
                            type: SchemaType.STRING,
                            description: "Unique insight ID (e.g., INS-001)",
                        },
                        level: {
                            type: SchemaType.STRING,
                            enum: ["Principle", "Strategic", "Tactical"],
                            description: "Insight level by scope and longevity",
                        },
                        type: {
                            type: SchemaType.STRING,
                            enum: ["Behavioral", "Functional", "Need", "Pain Point"],
                            description: "Primary insight classification",
                        },
                        strength: {
                            type: SchemaType.STRING,
                            enum: ["Strong", "Emerging"],
                            description: "Evidence strength level",
                        },
                        context: {
                            type: SchemaType.STRING,
                            description: "The situation or scenario where the issue occurs",
                        },
                        cause: {
                            type: SchemaType.STRING,
                            description: "The evidence-backed reason this is happening",
                        },
                        effect: {
                            type: SchemaType.STRING,
                            description: "The user or business impact if this persists",
                        },
                        relevance: {
                            type: SchemaType.STRING,
                            description: "Why this matters for design, strategy, or delivery",
                        },
                        evidence: {
                            type: SchemaType.OBJECT,
                            properties: {
                                fact_ids: {
                                    type: SchemaType.ARRAY,
                                    items: {
                                        type: SchemaType.STRING,
                                    },
                                    description: "Array of fact IDs supporting this insight",
                                },
                                supporting_quotes: {
                                    type: SchemaType.ARRAY,
                                    items: {
                                        type: SchemaType.STRING,
                                    },
                                    description: "Verbatim excerpts taken directly from Atomic Facts",
                                },
                            },
                            required: ["fact_ids", "supporting_quotes"],
                        },
                        recommendation: {
                            type: SchemaType.STRING,
                            description: "An evidence-appropriate next step",
                        },
                    },
                    required: [
                        "id",
                        "level",
                        "type",
                        "strength",
                        "context",
                        "cause",
                        "effect",
                        "relevance",
                        "evidence",
                        "recommendation",
                    ],
                },
            },
        },
        required: ["insight_summary", "insights"],
    } as unknown as Schema;
}

function formatFactsForPrompt(facts: Fact[], dataType: string): string {
    // Map dataType to how_learned format
    const howLearnedMap: Record<string, string> = {
        "User Interview": "interview",
        "Usability Test": "usability test",
        "Focus Group": "focus group",
        "Survey Response": "survey",
        "Customer Feedback": "customer feedback",
        "Support Ticket": "support ticket",
        "Beta Testing": "beta testing",
        "A/B Test Results": "analytics",
        "Field Study": "field study",
    };
    
    const howLearned = howLearnedMap[dataType] || dataType.toLowerCase() || "usability test";
    
    return JSON.stringify(
        facts.map((fact) => ({
            fact_id: fact.fact_id,
            type: "Quote", // Most facts are quotes from transcripts
            content: fact.verbatim_quote,
            how_learned: howLearned,
            context: `${fact.theme} - ${fact.summary_of_observation}`,
            source_timestamp: fact.timestamp,
        })),
        null,
        2
    );
}

export async function POST(request: NextRequest) {
    try {
        // Accept API key from header (user-provided) or fallback to env var
        const apiKey = request.headers.get("X-Gemini-Key") || process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                {
                    error: "Gemini API key is not configured. Please add your API key in Settings.",
                },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { facts, dataType, product, feature } = body;

        if (!facts || !Array.isArray(facts) || facts.length === 0) {
            return NextResponse.json(
                { error: "Facts array is required and must not be empty" },
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
        const factsFormatted = formatFactsForPrompt(facts, dataType);
        const userPrompt = `Here are the Atomic Facts to analyze:\n\n${factsFormatted}`;

        // Generate insights
        const result = await model.generateContent([systemPrompt, userPrompt]);
        const response = await result.response;
        const responseText = response.text();

        // Parse JSON response
        let insightsResponse: InsightsResponse;
        try {
            insightsResponse = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Failed to parse Gemini response:", parseError);
            console.error("Response text:", responseText);
            return NextResponse.json(
                { error: "Failed to parse AI response. Please try again." },
                { status: 500 }
            );
        }

        // Validate insights structure
        if (!insightsResponse.insights || !Array.isArray(insightsResponse.insights)) {
            return NextResponse.json(
                { error: "Invalid response structure: insights array is missing" },
                { status: 500 }
            );
        }

        // Validate that fact_ids in insights exist in the provided facts
        // Handle both prefixed format ({transcriptId}_Facts_{factId}) and legacy format
        const factIds = new Set(facts.map((f) => f.fact_id));
        // Create a map of fact_id to verbatim_quote for validation
        const factQuotesMap = new Map<string, string>();
        facts.forEach((fact) => {
            factQuotesMap.set(fact.fact_id, fact.verbatim_quote);
        });
        
        const validatedInsights: Insight[] = [];

        for (const insight of insightsResponse.insights) {
            // Validate fact_ids exist
            const invalidFactIds = insight.evidence.fact_ids.filter(
                (id) => !factIds.has(id)
            );
            if (invalidFactIds.length > 0) {
                console.warn(
                    `Insight ${insight.id} references invalid fact_ids: ${invalidFactIds.join(", ")}`
                );
                // Remove invalid fact_ids
                insight.evidence.fact_ids = insight.evidence.fact_ids.filter(
                    (id) => factIds.has(id)
                );
            }

            // Validate and filter supporting quotes to ensure they are verbatim
            const validatedQuotes: string[] = [];
            for (const quote of insight.evidence.supporting_quotes) {
                // Check if quote matches any of the referenced facts' verbatim quotes
                let isVerbatim = false;
                for (const factId of insight.evidence.fact_ids) {
                    const factQuote = factQuotesMap.get(factId);
                    if (factQuote) {
                        // Normalize for comparison (remove extra whitespace, case-insensitive)
                        const normalizedQuote = quote.trim().toLowerCase().replace(/\s+/g, " ");
                        const normalizedFactQuote = factQuote.trim().toLowerCase().replace(/\s+/g, " ");
                        
                        // Check if quote is contained in fact quote (allowing for partial matches)
                        if (normalizedFactQuote.includes(normalizedQuote) || normalizedQuote.includes(normalizedFactQuote)) {
                            // Use the original fact quote to ensure verbatim
                            validatedQuotes.push(factQuote);
                            isVerbatim = true;
                            break;
                        }
                    }
                }
                
                if (!isVerbatim) {
                    console.warn(
                        `Insight ${insight.id} has non-verbatim quote: "${quote.substring(0, 50)}..." - replacing with actual fact quote`
                    );
                    // Try to find a matching fact quote from the referenced fact_ids
                    if (insight.evidence.fact_ids.length > 0) {
                        const firstFactQuote = factQuotesMap.get(insight.evidence.fact_ids[0]);
                        if (firstFactQuote) {
                            validatedQuotes.push(firstFactQuote);
                        }
                    }
                }
            }
            
            // Update supporting quotes with validated verbatim quotes
            insight.evidence.supporting_quotes = validatedQuotes.length > 0 
                ? validatedQuotes 
                : insight.evidence.fact_ids.map(id => factQuotesMap.get(id) || "").filter(Boolean);

            // Only include insights with at least one valid fact_id
            if (insight.evidence.fact_ids.length > 0) {
                validatedInsights.push(insight);
            } else {
                console.warn(
                    `Skipping insight ${insight.id} with no valid fact_ids`
                );
            }
        }

        return NextResponse.json({
            insight_summary: {
                total_facts_analyzed: facts.length,
                total_insights_generated: validatedInsights.length,
            },
            insights: validatedInsights,
        });
    } catch (error) {
        console.error("Error generating insights:", error);
        const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json(
            { error: `Failed to generate insights: ${errorMessage}` },
            { status: 500 }
        );
    }
}
