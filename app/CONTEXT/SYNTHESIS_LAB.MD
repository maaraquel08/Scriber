## 🧪 Synthesis Lab: Main Page Structure

The Synthesis Lab acts as the primary workspace for data ingestion and organization.

### **1. Ingestion Zone**
* **Smart Uploader:** A high-visibility drag-and-drop area for bulk media uploads.
* **Process Monitor:** Real-time status bar for ElevenLabs Scribe transcription and Gemini Fact extraction tasks.

### **2. Methodology Repository (List View)**
A structured list view that organizes data by research framework. Each entry is an expandable "Folder."

#### **Folder Actions & Metadata**
* **Methodology Name:** (e.g., "Contextual Inquiry" or "Usability Testing").
* **Volume Metrics:** Displays the count of sessions and extracted facts contained within.
* **Folder-Level Synthesis:** `[Generate Insight]` button to analyze all data within this methodology.

#### **Nested Navigation Flow**
1. **Methodology Folder:** Click to expand and view all associated research instances.
2. **Session List:** Displays individual video recordings (Participant Name, Date, Duration).
3. **The Workbench Trigger:** Clicking an individual session opens the **Research Workbench**, featuring:
    * **Tab 1:** Collective Fact list for that study.
    * **Tab 2:** Synchronized Video Player and Interactive Transcript.

---

### **3. Navigation Logic (The "Drill-Down")**
The UI follows a strict drill-down logic to maintain context:
* **Lab Home** -> **Methodology Folder** -> **Session Selection** -> **Workbench**