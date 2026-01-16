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
