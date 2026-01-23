# UX Research Master Repository: Information Architecture

This document outlines the structure and user journey of the AI-powered UX Research Platform, moving from raw data to actionable, traceable insights.

---

## 🏛️ 1. The Vault (Master Repository)
*The centralized home for all high-level intelligence and strategic data.*

### **Insights Dashboard**
*High-level visualization of the most impactful findings across all research.*
* **Insight Gallery:** A searchable grid of "Master Insights" synthesized from multiple research instances.
* **Mindset Segmentation Toggle:** Filter the entire gallery by behavioral segments (e.g., "The Power User," "The Skeptic," "The Efficiency Seeker").

### **Metrics & Sentiment**
* **Trend Tracking:** Visual analytics showing if "Painpoints" (e.g., in Onboarding) are decreasing over time.
* **Volume Stats:** Real-time counter of total Atomic Facts vs. converted Master Insights.
* **Global Search (RAG):** AI chat interface that queries the repository to answer strategic questions with cited evidence.

---

## 🧪 2. Synthesis Lab (The Workspace)
*The "Factory" where raw data is processed, categorized, and patterns are identified.*

### **Uploader & Global View**
* **Drag-and-Drop Area:** Multi-file upload interface for ElevenLabs Scribe processing.
* **Methodology Folders:** Organized by research type or methodology (e.g., "Usability Testing," "Diary Studies," "Contextual Inquiry").

### **Folder View (e.g., "Attrition Usability Testing")**
* **Header:** Metadata display (Project Name, Date, Researcher) + **[Generate Insight]** CTA button to trigger LLM synthesis of folder data.

#### **Tab 1: List of Facts (Collective View)**
* **Aggregated Fact Table:** A unified list of every "Nugget" found across all participants in this specific study.
* **Filtering:** Sort by Theme, Sentiment, or Participant.
* **Trace Link:** Each fact contains a deep link to the specific timestamp in the source video/transcript.

#### **Tab 2: Source Transcripts (Individual View)**
* **Participant Sidebar:** A list to toggle between individual participant sessions.
* **Active Video Player:** A media player synced directly with the transcript text.
* **Inline Highlights:** The transcript visually highlights text segments that have been successfully converted into an "Atomic Fact."

---

## 🔗 3. The Evidence Trace (Data Hierarchy)

To maintain 100% trust and accuracy, the system maintains a strict 3-tier relationship:

| Level | Name | Description | UI Location |
| :--- | :--- | :--- | :--- |
| **Level 3** | **Master Insight** | Synthesized strategic finding across users. | The Vault |
| **Level 2** | **Atomic Fact** | Individual observation, quote, or event. | Synthesis Lab (Tab 1) |
| **Level 1** | **Transcript** | Raw audio/video data and full text. | Synthesis Lab (Tab 2) |



---

## 🚀 4. User Journey: From Video to Strategy

1. **Ingestion:** Researcher uploads 10 interview videos to the **Synthesis Lab** methodology folder.
2. **Extraction:** AI generates transcripts and extracts **Atomic Facts** for each participant automatically.
3. **Review & Audit:** Researcher reviews **Tab 2** for individual accuracy and **Tab 1** for the collective study overview.
4. **Synthesis:** Researcher clicks **`Generate Insight`**. The LLM clusters the facts into **Master Insights** and assigns them to a **Mindset Segment**.
5. **Promotion:** Master Insights are published to **The Vault**.
6. **Query (RAG):** Stakeholders use the AI Assistant to ask questions. The AI provides answers based on **Master Insights**, allowing the user to click through all the way back to the original video evidence.