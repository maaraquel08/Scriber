# Product Requirements: Atomic AI Research Scribe

## Project Overview

An internal microservice designed for UX Researchers and Product Owners to transform raw interview audio into a structured, RAG-ready (Retrieval-Augmented Generation) knowledge base. Powered by **ElevenLabs Scribe API** and **Atomic Research Principles**.

---

## 1. Data Ingestion & Transcription (The Atoms)

_Goal: Convert raw audio into highly accurate, diarized, and anchored text._

-   **ElevenLabs Scribe V2 Integration:** High-fidelity transcription with support for 99+ languages and sub-150ms latency.
-   **Speaker Diarization (Multi-Speaker):** Identification of up to 32 unique speakers to distinguish between the Researcher, User, and Stakeholders.
-   **Audio-Text Anchoring:** Each word in the transcript is mapped to a millisecond timestamp.
    -   _Feature:_ Clicking a sentence in the UI plays the specific audio snippet for verbatim verification.
-   **Project-Specific Vocabulary (Keyterm Prompting):** Upload a glossary of internal feature names, brand terms, or technical jargon to ensure 100% transcription accuracy for niche terms.

## 2. Behavioral & Sentiment Layer (The Evidence)

_Goal: Capture the "how" and "why" behind the words using audio event tagging._

-   **Audio Event Detection:** Automatic tagging of non-verbal cues:
    -   **Emotional Cues:** Laughter, sighs, hesitation, or applause.
    -   **Environment Cues:** Background noise, keyboard typing, or silence.
-   **Sentiment Heatmap:** A visual timeline of the interview showing shifts in user sentiment (Positive/Neutral/Negative) based on tone and word choice.
-   **Frustration Detection:** Specifically flags "Long Pauses" or "Stuttering" as potential indicators of UI confusion or cognitive load.

## 3. Atomic Analysis Engine (The Molecules & Organisms)

_Goal: Shred long-form transcripts into "Nuggets" as per the Atomic Research methodology._

-   **Auto-Nuggeting:** The AI automatically extracts "Single-Experience Facts" from the transcript.
    -   _Nugget Structure:_ `[Observation] + [Verbatim Quote] + [Timestamp] + [Tags]`.
-   **Evidence-Backed Insights:** Groups related Nuggets to form a higher-level "Insight."
    -   _Rule:_ An Insight cannot be created without at least two linked "Atoms" (Nuggets) as evidence.
-   **Pattern Discovery:** Cross-references current interview data with historical sessions to identify recurring pain points across different participants.
-   **Actionable Recommendations:** Generates "Opportunities" (e.g., "Redesign the checkout flow") that are trace-linked back to specific User Insights.

## 4. RAG-Ready Notion Integration

_Goal: Feed the internal "Company Brain" for AI-powered retrieval._

-   **Relational Database Export:** One-click sync that populates three interconnected Notion databases:
    1.  **Experiments DB:** Session metadata (date, participant, product area).
    2.  **Facts DB:** The raw "Nuggets" (Quotes, Audio Links, Sentiment).
    3.  **Insights DB:** The synthesized takeaways linked to multiple Facts.
-   **Semantic Metadata Injection:** Each exported row includes a "RAG-Context String"—a dense, AI-optimized summary—allowing Notion AI to answer questions like: _"Why did users find the new dashboard confusing last quarter?"_
-   **Automated Tagging Taxonomy:** Applies tags based on the Product Roadmap (e.g., `#Onboarding`, `#MobileApp`, `#Persona-Pro-User`).

---

## 5. Summary Table for Product Owners

| Feature                   | Atomic Research Unit | Outcome                                                      |
| :------------------------ | :------------------- | :----------------------------------------------------------- |
| **Speaker Diarization**   | Experiment           | Clean separation of user voice from moderator bias.          |
| **Audio Event Tagger**    | Evidence             | Captures non-verbal frustration (sighs/pauses).              |
| **Auto-Nuggeting**        | Facts                | Converts 1 hour of audio into 10 searchable facts.           |
| **Notion RAG Sync**       | Knowledge            | Makes research data queryable by the entire company AI.      |
| **Recommendation Linker** | Opportunity          | Proves the ROI of a feature request with direct user quotes. |
