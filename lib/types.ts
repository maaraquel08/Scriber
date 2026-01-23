export interface TranscriptWord {
  text: string;
  start: number; // seconds
  end: number; // seconds
  type: "word" | "spacing";
  speaker_id: string;
}

export interface TranscriptData {
  language_code: string;
  language_probability: number;
  text: string;
  words: TranscriptWord[];
}

export interface Speaker {
  id: string;
  name: string;
  role?: string;
  color: string;
  avatar?: string;
}

export interface TranscriptSegment {
  id: string;
  speaker_id: string;
  start: number;
  end: number;
  text: string;
  words: TranscriptWord[];
}

export interface Fact {
  fact_id: string;
  verbatim_quote: string;
  timestamp: string; // HH:MM:SS format
  speaker_label: string;
  sentiment: "Positive" | "Neutral" | "Negative";
  theme: string; // From the enum list in LLM_TASK.MD
  summary_of_observation: string;
}

export interface ExtractionResponse {
  facts: Fact[];
}

export interface Methodology {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Insight {
  id: string; // e.g., "INS-001"
  level: "Principle" | "Strategic" | "Tactical";
  type: "Behavioral" | "Functional" | "Need" | "Pain Point";
  strength: "Strong" | "Emerging";
  context: string;
  cause: string;
  effect: string;
  relevance: string;
  evidence: {
    fact_ids: string[];
    supporting_quotes: string[];
  };
  recommendation: string;
}

export interface InsightsResponse {
  insight_summary: {
    total_facts_analyzed: number;
    total_insights_generated: number;
  };
  insights: Insight[];
}
