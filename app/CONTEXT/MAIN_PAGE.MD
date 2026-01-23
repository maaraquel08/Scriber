# 🏛️ The Vault: Conversational Intelligence Dashboard

This layout prioritizes the **AI Chat Interface** as the primary way to interact with the Master Research Repository, supported by a persistent navigation sidebar for deep-drill access.

---

## 🏗️ 1. Split-Screen Architecture

### **Left Sidebar: The Research Repository (The Library)**
*Persistent navigation for structural browsing.*
* **Top Section: `[ + ] New Study`:** Global upload button to trigger the Synthesis Lab workflow.
* **Methodology Folders:** A collapsible tree-view of all research:
    * 📂 **Usability Testing**
        * 📄 *Q1 Onboarding Study*
        * 📄 *Checkout Flow Audit*
    * 📂 **User Interviews**
        * 📄 *Mindset Discovery 2026*
* **Mindset Segments:** Quick-filter toggles for "The Skeptic," "The Power User," etc.
* **Pinned Insights:** A "Starred" section for high-priority strategic findings.

### **Main Screen: The Research Assistant (The Chat)**
*A workspace similar to Gemini/ChatGPT, optimized for data synthesis.*
* **Chat Input (Bottom):** "Ask anything about your research..."
* **Contextual Breadcrumbs:** Above the chat, visible tags show which folders the AI is currently "reading" from (e.g., `Context: All Usability Testing`).
* **Active Drag-and-Drop:** Dropping a file directly into the chat window triggers the "Synthesis Lab" ingestion flow for that specific file.

---

## 🧠 2. Conversational Features & "Evidence Trace"

The chat interface isn't just for text; it's a **Dynamic UI**.

* **Interactive Fact Cards:** When the AI answers a question, it renders "Mini Cards" within the chat bubble.
    * *Example:* "Users found the button confusing [See Evidence]."
* **The "Source Drawer":** Clicking [See Evidence] opens a side-panel within the chat that displays the **Atomic Fact** and a **Play Button** for the ElevenLabs audio snippet.
* **Suggested Follow-ups:** The AI suggests questions based on the repository, such as:
    * *"How does this pain point differ for Enterprise vs. SMB users?"*
    * *"What are the top 3 quotes related to this frustration?"*

---

## 🔄 3. Interaction Flow: From Chat to Source



1. **Query:** User types: *"Compare the onboarding friction between our two main user mindsets."*
2. **Retrieval (RAG):** The AI searches the **Master Insight Repo** and **Atomic Facts** linked to those mindsets.
3. **Synthesis:** The AI generates a comparison table directly in the chat window.
4. **Verification:** The user clicks a data point in the table; the Left Sidebar auto-navigates to the corresponding **Methodology Folder** and highlights the supporting **Session**.

---

## 📝 4. Layout Logic

| Sidebar (25% Width) | Main Chat Interface (75% Width) |
| :--- | :--- |
| **Search Folders...** | **"Hello. I've analyzed 42 sessions. What would you like to know?"** |
| 📂 Usability Testing (12) | |
| 📂 Interviews (8) | [ Chart: Sentiment across Segments ] |
| 📂 Diary Studies (4) | |
| | **User:** *Summarize the 'Security' pain points.* |
| **Settings / Export** | **AI:** *Based on 15 Facts, users are struggling with...* |