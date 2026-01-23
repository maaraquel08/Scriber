-- Create methodologies table
CREATE TABLE IF NOT EXISTS methodologies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_methodologies_created_at ON methodologies(created_at DESC);

-- Create transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  text TEXT NOT NULL,
  language_code TEXT DEFAULT 'en',
  language_probability REAL DEFAULT 1.0,
  words JSONB NOT NULL,
  file_name TEXT,
  file_type TEXT,
  methodology_id TEXT REFERENCES methodologies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transcripts_methodology ON transcripts(methodology_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_created_at ON transcripts(created_at DESC);

-- Create facts table
CREATE TABLE IF NOT EXISTS facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id TEXT NOT NULL REFERENCES transcripts(id) ON DELETE CASCADE,
  fact_id TEXT NOT NULL,
  verbatim_quote TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  speaker_label TEXT NOT NULL,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('Positive', 'Neutral', 'Negative')),
  theme TEXT NOT NULL,
  summary_of_observation TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(transcript_id, fact_id)
);

CREATE INDEX IF NOT EXISTS idx_facts_transcript ON facts(transcript_id);
CREATE INDEX IF NOT EXISTS idx_facts_theme ON facts(theme);

-- Create insights table
CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  methodology_id TEXT NOT NULL REFERENCES methodologies(id) ON DELETE CASCADE,
  insight_id TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('Principle', 'Strategic', 'Tactical')),
  type TEXT NOT NULL CHECK (type IN ('Behavioral', 'Functional', 'Need', 'Pain Point')),
  strength TEXT NOT NULL CHECK (strength IN ('Strong', 'Emerging')),
  context TEXT NOT NULL,
  cause TEXT NOT NULL,
  effect TEXT NOT NULL,
  relevance TEXT NOT NULL,
  evidence JSONB NOT NULL,
  recommendation TEXT NOT NULL,
  insight_summary JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(methodology_id, insight_id)
);

CREATE INDEX IF NOT EXISTS idx_insights_methodology ON insights(methodology_id);

-- Enable Row Level Security (RLS) - Allow all operations for now
-- In production, you may want to add proper RLS policies
ALTER TABLE methodologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (adjust based on your auth needs)
CREATE POLICY "Allow all operations on methodologies" ON methodologies
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on transcripts" ON transcripts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on facts" ON facts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on insights" ON insights
  FOR ALL USING (true) WITH CHECK (true);
