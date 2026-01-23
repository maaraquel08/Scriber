import { NextRequest, NextResponse } from "next/server"
import {
  createMethodology,
  listMethodologies,
} from "@/lib/supabase-db"
import { getApiUser } from "@/lib/api-auth"

export async function GET() {
  try {
    const user = await getApiUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", methodologies: [] },
        { status: 401 }
      )
    }

    const methodologies = await listMethodologies(user.id)
    return NextResponse.json({ methodologies })
  } catch (error) {
    console.error("Error listing methodologies:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list methodologies", methodologies: [] },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getApiUser()
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Methodology name is required" },
        { status: 400 }
      )
    }

    const methodology = await createMethodology(name.trim(), description?.trim(), user.id)
    
    return NextResponse.json({ 
      success: true, 
      methodology,
      message: "Methodology created successfully" 
    })
  } catch (error) {
    console.error("Error creating methodology:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create methodology" },
      { status: 500 }
    )
  }
}
