import { NextRequest, NextResponse } from "next/server"
import { getInsights, saveInsights, getMethodology } from "@/lib/supabase-db"
import { getApiUser } from "@/lib/api-auth"
import type { InsightsResponse } from "@/lib/types"

/**
 * GET /api/methodologies/[id]/insights
 * Load insights for a methodology
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getApiUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id: methodologyId } = await params
    
    // Verify user owns this methodology
    const methodology = await getMethodology(methodologyId)
    if (!methodology) {
      return NextResponse.json(
        { error: "Methodology not found" },
        { status: 404 }
      )
    }

    const insightsData = await getInsights(methodologyId)
    return NextResponse.json(insightsData)
  } catch (error) {
    console.error("Error loading methodology insights:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load insights" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/methodologies/[id]/insights
 * Save insights for a methodology
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getApiUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id: methodologyId } = await params
    
    // Verify user owns this methodology
    const methodology = await getMethodology(methodologyId)
    if (!methodology) {
      return NextResponse.json(
        { error: "Methodology not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const insightsData: InsightsResponse = body

    if (!insightsData || !insightsData.insights || !Array.isArray(insightsData.insights)) {
      return NextResponse.json(
        { error: "Invalid insights data structure" },
        { status: 400 }
      )
    }

    const result = await saveInsights(methodologyId, insightsData)
    return NextResponse.json({
      success: true,
      count: result.count,
    })
  } catch (error) {
    console.error("Error saving methodology insights:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save insights" },
      { status: 500 }
    )
  }
}
