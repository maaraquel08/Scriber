1. The Logic Flow
   Your microservice should handle the data in this order:

Input: User selects DataType, Product, and Feature from your predefined lists in your app's UI.

Transcription: ElevenLabs Scribe returns the JSON transcript (including audio_events like laughter/pauses).

The LLM Call: Your microservice sends the Transcript + Metadata to Gemini with a Response Schema.

2. Gemini Response Schema (The "Atomic" Blueprint)
   By defining the schema below, Gemini will only return a JSON array of "Nuggets."

````
Python

# Desired Output Schema (Pydantic / JSON Schema)
from pydantic import BaseModel, Field
from typing import List, Literal

class Fact(BaseModel):
    verbatim_quote: str = Field(description="The exact text from the transcript.")
    timestamp: str = Field(description="Start time of the quote (e.g., 00:04:12).")
    speaker: str = Field(description="The speaker label (e.g., Speaker 1).")
    sentiment: Literal["Positive", "Neutral", "Negative"]
    theme: Literal[
        "User Behavior", "Needs", "Painpoint", "Visual Design", "Expectation",
        "Routine", "Security", "Motivation", "Frustration", "Accessibility",
        "Mental Models", "Workaround", "Language and Terminology",
        "Technical Limitation", "Suggestions", "Retention Drivers",
        "Decision Making Process", "Satisfaction", "Preference",
        "Comparative Feedback", "Usability"
    ]
    summary_of_fact: str = Field(description="A 1-sentence summary of this observation.")

class ExtractionResponse(BaseModel):
    facts: List[Fact]


```
3. The Automation Prompt
Your system prompt should use the metadata provided by the researcher as context to improve the AI's "theme" selection.

The System Instruction:

You are a Senior UX Research Analyst. You will be given a transcript and the following context:

Data Type: [Researcher Input]

Product: [Researcher Input]

Feature: [Researcher Input]

Your Task: Analyze the transcript and extract "Atomic Facts" (Nuggets). For every significant user observation, extract the quote, timestamp, and speaker. Assign exactly one Theme from the provided list that best fits the fact.

Constraint: Only return the JSON object. Do not include any narrative text.
````
