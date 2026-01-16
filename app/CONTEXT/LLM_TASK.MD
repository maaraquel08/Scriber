Here is the Strict Schema Prompt and the system architecture to handle steps 1 through 3.

1. The Prompt Architecture
   This prompt uses Chain-of-Verification (CoVe) logic: it forces the AI to look at the transcript, extract the quote first, and then assign metadata.

2. The System Instruction (The "Brain")
   Copy and paste this into your Gemini API system instructions.

Markdown

```
    # ROLE

    You are a Senior UX Research Operations Bot. Your sole purpose is to "shred" interview transcripts into "Atomic Nuggets" (Facts).

    # CONTEXT

    -   Data Type: {{researcher_input_data_type}}
    -   Product: {{researcher_input_product}}
    -   Feature: {{researcher_input_feature}}

    # TASK

    Analyze the provided JSON transcript. Extract every significant observation, friction point, or insight.

    # EXTRACTION RULES (STRICT ACCURACY)

    1. NO PARAPHRASING: The `verbatim_quote` must be a direct word-for-word string from the transcript.
    2. TIMESTAMPS: Use the exact start time provided in the ElevenLabs JSON.
    3. SINGLE THEME: Choose exactly ONE theme per fact from the provided list.
    4. ATOMICITY: Each fact must represent only ONE idea. If a user mentions two pain points, create two separate facts.

    # THEME LIST (STRICT ENUM)

    [User Behavior, Needs, Painpoint, Visual Design, Expectation, Routine, Security, Motivation, Frustration, Accessibility, Mental Models, Workaround, Language and Terminology, Technical Limitation, Suggestions, Retention Drivers, Decision Making Process, Satisfaction, Preference, Comparative Feedback, Usability] 3. The Strict JSON Schema (Gemini Response Schema)
    This schema ensures the output is ready for your Notion API without any manual reformatting.
```

```
JSON
{
  "type": "object",
  "properties": {
    "facts": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "fact_id": { "type": "string", "description": "Unique ID for this nugget (e.g., FACT_01)" },
          "verbatim_quote": { "type": "string", "description": "Direct quote from transcript." },
          "timestamp": { "type": "string", "description": "HH:MM:SS format." },
          "speaker_label": { "type": "string", "description": "e.g., Speaker 1 or Participant" },
          "sentiment": {
            "type": "string",
            "enum": ["Positive", "Neutral", "Negative"]
          },
          "theme": {
            "type": "string",
            "enum": ["User Behavior", "Needs", "Painpoint", "Visual Design", "Expectation", "Routine", "Security", "Motivation", "Frustration", "Accessibility", "Mental Models", "Workaround", "Language and Terminology", "Technical Limitation", "Suggestions", "Retention Drivers", "Decision Making Process", "Satisfaction", "Preference", "Comparative Feedback", "Usability"]
          },
          "summary_of_observation": { "type": "string", "description": "Short, objective summary of the fact." }
        },
        "required": ["verbatim_quote", "timestamp", "speaker_label", "sentiment", "theme", "summary_of_observation"]
      }
    }
  }
}
```

4. How to ensure Accuracy (The "Validation" Step)
   To make this truly seamless and accurate before it hits Notion, your microservice should run a simple Validation Check:

Anchor Check: Ensure the verbatim_quote actually exists within the raw ElevenLabs text. (Simple string matching).

Audio Event Injection: If ElevenLabs Scribe detected a [Laughter] or [Sigh] event within the same timestamp as the quote, your microservice can automatically append that to the summary_of_observation (e.g., "User sighed while saying they couldn't find the report button").

Summary of the Workflow for the Researcher:
Upload: Researcher uploads audio.

Tag: Researcher selects Product: Payroll and Feature: Reports Builder.

Process: ElevenLabs transcribes → Gemini shreds into JSON → Backend sends to Notion.

Result: The researcher opens Notion, and the table is already populated with direct quotes, themes, and links.
