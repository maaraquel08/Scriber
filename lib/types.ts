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
