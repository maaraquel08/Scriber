import { createSupabaseAdmin } from "./supabase-client"
import type { Fact, Methodology, Insight, InsightsResponse, TranscriptWord } from "./types"

function getSupabase() {
  return createSupabaseAdmin()
}

// ============================================================================
// Transcripts
// ============================================================================

export interface SaveTranscriptData {
  languageCode: string
  languageProbability: number
  text: string
  words: TranscriptWord[]
  title: string
  fileName?: string
  fileType?: string
  methodology?: string | null
  userId?: string // User ID for RLS
}

export async function saveTranscript(
  transcriptId: string,
  data: SaveTranscriptData
) {
  // Transform words to match database format
  const wordsForDb = data.words.map((word) => ({
    text: word.text,
    start: word.start,
    end: word.end,
    type: word.type,
    speaker_id: word.speaker_id,
  }))

  const supabase = getSupabase()
  
  // Try with user_id first, fallback without if column doesn't exist
  let { error } = await supabase
    .from("transcripts")
    .upsert({
      id: transcriptId,
      title: data.title,
      text: data.text,
      language_code: data.languageCode,
      language_probability: data.languageProbability,
      words: wordsForDb,
      file_name: data.fileName || null,
      file_type: data.fileType || null,
      methodology_id: data.methodology || null,
      user_id: data.userId || null,
      updated_at: new Date().toISOString(),
    } as any)

  // Fallback: if user_id column doesn't exist, retry without it
  if (error?.message?.includes("user_id")) {
    const result = await supabase
      .from("transcripts")
      .upsert({
        id: transcriptId,
        title: data.title,
        text: data.text,
        language_code: data.languageCode,
        language_probability: data.languageProbability,
        words: wordsForDb,
        file_name: data.fileName || null,
        file_type: data.fileType || null,
        methodology_id: data.methodology || null,
        updated_at: new Date().toISOString(),
      } as any)
    error = result.error
  }

  if (error) {
    throw new Error(`Failed to save transcript: ${error.message}`)
  }

  return { success: true, id: transcriptId }
}

export async function getTranscript(transcriptId: string, userId?: string) {
  const supabase = getSupabase()
  let query = supabase
    .from("transcripts")
    .select("*")
    .eq("id", transcriptId)

  if (userId) {
    query = query.eq("user_id", userId)
  }

  let { data, error } = await query.single()

  // Fallback: if user_id column doesn't exist, retry without filter
  if (error?.message?.includes("user_id does not exist")) {
    const result = await supabase
      .from("transcripts")
      .select("*")
      .eq("id", transcriptId)
      .single()
    data = result.data
    error = result.error
  }

  if (error) {
    if (error.code === "PGRST116") {
      return null
    }
    throw new Error(`Failed to get transcript: ${error.message}`)
  }

  if (!data) return null

  const row = data as any

  return {
    id: row.id,
    title: row.title,
    languageCode: row.language_code,
    languageProbability: row.language_probability,
    text: row.text,
    words: (row.words || []).map((w: any) => ({
      text: w.text,
      start: w.start,
      end: w.end,
      type: w.type,
      speaker_id: w.speaker_id,
    })),
    fileName: row.file_name,
    fileType: row.file_type,
    methodology: row.methodology_id,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function updateTranscript(
  transcriptId: string,
  updates: {
    title?: string
    methodology?: string | null
  },
  userId?: string
) {
  const updateData: any = {
    updated_at: new Date().toISOString(),
  }

  if (updates.title !== undefined) {
    updateData.title = updates.title
  }
  if (updates.methodology !== undefined) {
    updateData.methodology_id = updates.methodology
  }

  const supabase = getSupabase()
  let query = supabase
    .from("transcripts")
    .update(updateData)
    .eq("id", transcriptId)

  if (userId) {
    query = query.eq("user_id", userId)
  }

  let { error } = await query

  // Fallback: if user_id column doesn't exist, retry without filter
  if (error?.message?.includes("user_id does not exist")) {
    const result = await supabase
      .from("transcripts")
      .update(updateData)
      .eq("id", transcriptId)
    error = result.error
  }

  if (error) {
    throw new Error(`Failed to update transcript: ${error.message}`)
  }

  return { success: true }
}

export async function deleteTranscript(transcriptId: string, userId?: string) {
  const supabase = getSupabase()
  
  // First delete facts (though CASCADE should handle this)
  await deleteFacts(transcriptId).catch(() => {
    // Ignore errors if facts don't exist
  })
  
  let query = supabase
    .from("transcripts")
    .delete()
    .eq("id", transcriptId)

  if (userId) {
    query = query.eq("user_id", userId)
  }

  let { error } = await query

  // Fallback: if user_id column doesn't exist, retry without filter
  if (error?.message?.includes("user_id does not exist")) {
    const result = await supabase
      .from("transcripts")
      .delete()
      .eq("id", transcriptId)
    error = result.error
  }

  if (error) {
    throw new Error(`Failed to delete transcript: ${error.message}`)
  }

  return { success: true }
}

export async function listTranscriptsByMethodology(methodologyId: string, userId?: string) {
  const supabase = getSupabase()
  let query = supabase
    .from("transcripts")
    .select("id, title, created_at, updated_at, file_name, file_type")
    .eq("methodology_id", methodologyId)
    .order("created_at", { ascending: false })

  if (userId) {
    query = query.eq("user_id", userId)
  }

  let { data, error } = await query

  // Fallback: if user_id column doesn't exist, retry without filter
  if (error?.message?.includes("user_id does not exist")) {
    const result = await supabase
      .from("transcripts")
      .select("id, title, created_at, updated_at, file_name, file_type")
      .eq("methodology_id", methodologyId)
      .order("created_at", { ascending: false })
    data = result.data
    error = result.error
  }

  if (error) {
    throw new Error(`Failed to list transcripts: ${error.message}`)
  }

  // Get fact counts for each transcript
  const transcriptsWithFacts = await Promise.all(
    ((data as any[]) || []).map(async (transcript) => {
      const supabaseClient = getSupabase()
      const { count } = await supabaseClient
        .from("facts")
        .select("*", { count: "exact", head: true })
        .eq("transcript_id", transcript.id)

      return {
        id: transcript.id,
        title: transcript.title,
        duration: 0, // Calculate from words if needed
        factCount: count || 0,
        createdAt: transcript.created_at,
        updatedAt: transcript.updated_at,
      }
    })
  )

  return transcriptsWithFacts
}

// ============================================================================
// Facts
// ============================================================================

export async function saveFacts(transcriptId: string, facts: Fact[]) {
  const supabase = getSupabase()
  // Delete existing facts for this transcript
  await supabase.from("facts").delete().eq("transcript_id", transcriptId)

  if (facts.length === 0) {
    return { success: true, count: 0 }
  }

  // Insert new facts
  const factsToInsert = facts.map((fact) => ({
    transcript_id: transcriptId,
    fact_id: fact.fact_id,
    verbatim_quote: fact.verbatim_quote,
    timestamp: fact.timestamp,
    speaker_label: fact.speaker_label,
    sentiment: fact.sentiment,
    theme: fact.theme,
    summary_of_observation: fact.summary_of_observation,
  }))

  const { error } = await supabase.from("facts").insert(factsToInsert as any)

  if (error) {
    throw new Error(`Failed to save facts: ${error.message}`)
  }

  return { success: true, count: facts.length }
}

export async function getFacts(transcriptId: string): Promise<Fact[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("facts")
    .select("*")
    .eq("transcript_id", transcriptId)
    .order("timestamp", { ascending: true })

  if (error) {
    throw new Error(`Failed to get facts: ${error.message}`)
  }

  if (!data) return []

  return (data as any[]).map((row) => ({
    fact_id: row.fact_id,
    verbatim_quote: row.verbatim_quote,
    timestamp: row.timestamp,
    speaker_label: row.speaker_label,
    sentiment: row.sentiment,
    theme: row.theme,
    summary_of_observation: row.summary_of_observation,
  }))
}

export async function deleteFacts(transcriptId: string) {
  const supabase = getSupabase()
  const { error } = await supabase
    .from("facts")
    .delete()
    .eq("transcript_id", transcriptId)

  if (error) {
    throw new Error(`Failed to delete facts: ${error.message}`)
  }

  return { success: true }
}

// ============================================================================
// Methodologies
// ============================================================================

export async function createMethodology(
  name: string,
  description?: string,
  userId?: string
): Promise<Methodology> {
  const id = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  const now = new Date().toISOString()

  const supabase = getSupabase()
  
  // Try with user_id first, fallback without if column doesn't exist
  let { data, error } = await supabase
    .from("methodologies")
    .insert({
      id,
      name,
      description: description || null,
      user_id: userId || null,
      created_at: now,
      updated_at: now,
    } as any)
    .select()
    .single()

  // Fallback: if user_id column doesn't exist, retry without it
  if (error?.message?.includes("user_id")) {
    const result = await supabase
      .from("methodologies")
      .insert({
        id,
        name,
        description: description || null,
        created_at: now,
        updated_at: now,
      } as any)
      .select()
      .single()
    data = result.data
    error = result.error
  }

  if (error) {
    throw new Error(`Failed to create methodology: ${error.message}`)
  }

  const row = data as any

  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listMethodologies(userId?: string): Promise<Methodology[]> {
  const supabase = getSupabase()
  
  // Try with user_id filter first, fallback without if column doesn't exist
  let query = supabase
    .from("methodologies")
    .select("*")
    .order("created_at", { ascending: false })

  if (userId) {
    query = query.eq("user_id", userId)
  }

  let { data, error } = await query

  // Fallback: if user_id column doesn't exist, retry without filter
  if (error?.message?.includes("user_id does not exist")) {
    const fallbackQuery = supabase
      .from("methodologies")
      .select("*")
      .order("created_at", { ascending: false })
    
    const result = await fallbackQuery
    data = result.data
    error = result.error
  }

  if (error) {
    throw new Error(`Failed to list methodologies: ${error.message}`)
  }

  return ((data as any[]) || []).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

export async function getMethodology(id: string, userId?: string): Promise<Methodology | null> {
  const supabase = getSupabase()
  let query = supabase
    .from("methodologies")
    .select("*")
    .eq("id", id)

  if (userId) {
    query = query.eq("user_id", userId)
  }

  let { data, error } = await query.single()

  // Fallback: if user_id column doesn't exist, retry without filter
  if (error?.message?.includes("user_id does not exist")) {
    const result = await supabase
      .from("methodologies")
      .select("*")
      .eq("id", id)
      .single()
    data = result.data
    error = result.error
  }

  if (error) {
    if (error.code === "PGRST116") {
      return null
    }
    throw new Error(`Failed to get methodology: ${error.message}`)
  }

  if (!data) return null

  const row = data as any

  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function updateMethodology(
  id: string,
  updates: { name?: string; description?: string },
  userId?: string
): Promise<Methodology | null> {
  const updateData: any = {
    updated_at: new Date().toISOString(),
  }

  if (updates.name !== undefined) {
    updateData.name = updates.name
  }
  if (updates.description !== undefined) {
    updateData.description = updates.description || null
  }

  const supabase = getSupabase()
  let query = supabase
    .from("methodologies")
    .update(updateData)
    .eq("id", id)

  if (userId) {
    query = query.eq("user_id", userId)
  }

  let { data, error } = await query.select().single()

  // Fallback: if user_id column doesn't exist, retry without filter
  if (error?.message?.includes("user_id does not exist")) {
    const result = await supabase
      .from("methodologies")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()
    data = result.data
    error = result.error
  }

  if (error) {
    throw new Error(`Failed to update methodology: ${error.message}`)
  }

  if (!data) return null

  const row = data as any

  return {
    id: row.id,
    name: row.name,
    description: row.description || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function deleteMethodology(id: string, userId?: string) {
  const supabase = getSupabase()
  
  // First, get all transcripts for this methodology to delete their media files
  const transcriptsResponse = await supabase
    .from("transcripts")
    .select("id")
    .eq("methodology_id", id)

  let query = supabase
    .from("methodologies")
    .delete()
    .eq("id", id)

  if (userId) {
    query = query.eq("user_id", userId)
  }

  let { error } = await query

  // Fallback: if user_id column doesn't exist, retry without filter
  if (error?.message?.includes("user_id does not exist")) {
    const result = await supabase
      .from("methodologies")
      .delete()
      .eq("id", id)
    error = result.error
  }

  if (error) {
    throw new Error(`Failed to delete methodology: ${error.message}`)
  }

  // Delete associated media files for transcripts in this methodology
  if (transcriptsResponse.data) {
    const transcriptIds = transcriptsResponse.data.map((t: any) => t.id)
    // Note: Media file deletion will be handled by the API route
  }

  return { success: true }
}

// ============================================================================
// Insights
// ============================================================================

export async function saveInsights(
  methodologyId: string,
  insightsData: InsightsResponse
) {
  const supabase = getSupabase()
  // Delete existing insights for this methodology
  await supabase.from("insights").delete().eq("methodology_id", methodologyId)

  if (insightsData.insights.length === 0) {
    return { success: true, count: 0 }
  }

  // Insert new insights
  const insightsToInsert = insightsData.insights.map((insight) => ({
    methodology_id: methodologyId,
    insight_id: insight.id,
    level: insight.level,
    type: insight.type,
    strength: insight.strength,
    context: insight.context,
    cause: insight.cause,
    effect: insight.effect,
    relevance: insight.relevance,
    evidence: insight.evidence,
    recommendation: insight.recommendation,
    insight_summary: insightsData.insight_summary,
  }))

  const { error } = await supabase.from("insights").insert(insightsToInsert as any)

  if (error) {
    throw new Error(`Failed to save insights: ${error.message}`)
  }

  return { success: true, count: insightsData.insights.length }
}

export async function getInsights(
  methodologyId: string
): Promise<InsightsResponse> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("insights")
    .select("*")
    .eq("methodology_id", methodologyId)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(`Failed to get insights: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return {
      insight_summary: {
        total_facts_analyzed: 0,
        total_insights_generated: 0,
      },
      insights: [],
    }
  }

  const rows = data as any[]

  // Get insight_summary from first insight (they all have the same summary)
  const insightSummary = rows[0]?.insight_summary || {
    total_facts_analyzed: 0,
    total_insights_generated: 0,
  }

  const insights: Insight[] = rows.map((row) => ({
    id: row.insight_id,
    level: row.level,
    type: row.type,
    strength: row.strength,
    context: row.context,
    cause: row.cause,
    effect: row.effect,
    relevance: row.relevance,
    evidence: row.evidence,
    recommendation: row.recommendation,
  }))

  return {
    insight_summary: insightSummary,
    insights,
  }
}
