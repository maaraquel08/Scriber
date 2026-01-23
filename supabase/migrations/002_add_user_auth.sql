-- Migration: Add user authentication support
-- This migration adds user_id columns to all tables and updates RLS policies

-- Add user_id column to methodologies
ALTER TABLE methodologies 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to transcripts
ALTER TABLE transcripts 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes on user_id columns for performance
CREATE INDEX IF NOT EXISTS idx_methodologies_user_id ON methodologies(user_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_user_id ON transcripts(user_id);

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all operations on methodologies" ON methodologies;
DROP POLICY IF EXISTS "Allow all operations on transcripts" ON transcripts;
DROP POLICY IF EXISTS "Allow all operations on facts" ON facts;
DROP POLICY IF EXISTS "Allow all operations on insights" ON insights;

-- Create user-scoped RLS policies for methodologies
CREATE POLICY "Users can view own methodologies" ON methodologies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own methodologies" ON methodologies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own methodologies" ON methodologies
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own methodologies" ON methodologies
  FOR DELETE USING (auth.uid() = user_id);

-- Create user-scoped RLS policies for transcripts
CREATE POLICY "Users can view own transcripts" ON transcripts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transcripts" ON transcripts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transcripts" ON transcripts
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transcripts" ON transcripts
  FOR DELETE USING (auth.uid() = user_id);

-- Facts RLS policies (via transcript ownership)
-- Users can access facts for transcripts they own
CREATE POLICY "Users can view facts for own transcripts" ON facts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM transcripts 
      WHERE transcripts.id = facts.transcript_id 
      AND transcripts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert facts for own transcripts" ON facts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM transcripts 
      WHERE transcripts.id = facts.transcript_id 
      AND transcripts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update facts for own transcripts" ON facts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM transcripts 
      WHERE transcripts.id = facts.transcript_id 
      AND transcripts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete facts for own transcripts" ON facts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM transcripts 
      WHERE transcripts.id = facts.transcript_id 
      AND transcripts.user_id = auth.uid()
    )
  );

-- Insights RLS policies (via methodology ownership)
-- Users can access insights for methodologies they own
CREATE POLICY "Users can view insights for own methodologies" ON insights
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM methodologies 
      WHERE methodologies.id = insights.methodology_id 
      AND methodologies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert insights for own methodologies" ON insights
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM methodologies 
      WHERE methodologies.id = insights.methodology_id 
      AND methodologies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update insights for own methodologies" ON insights
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM methodologies 
      WHERE methodologies.id = insights.methodology_id 
      AND methodologies.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete insights for own methodologies" ON insights
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM methodologies 
      WHERE methodologies.id = insights.methodology_id 
      AND methodologies.user_id = auth.uid()
    )
  );

-- Service role bypass policies (for API routes using service role key)
-- These allow the service role to manage all data
CREATE POLICY "Service role can manage all methodologies" ON methodologies
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage all transcripts" ON transcripts
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage all facts" ON facts
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage all insights" ON insights
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
