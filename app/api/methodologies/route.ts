import { NextRequest, NextResponse } from "next/server"
import {
  createMethodology,
  listMethodologies,
} from "@/lib/methodology-utils"

export async function GET() {
  try {
    const methodologies = listMethodologies()
    return NextResponse.json({ methodologies })
  } catch (error) {
    console.error("Error listing methodologies:", error)
    return NextResponse.json(
      { error: "Failed to list methodologies", methodologies: [] },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Methodology name is required" },
        { status: 400 }
      )
    }

    const methodology = createMethodology(name.trim(), description?.trim())
    
    return NextResponse.json({ 
      success: true, 
      methodology,
      message: "Methodology created successfully" 
    })
  } catch (error) {
    console.error("Error creating methodology:", error)
    return NextResponse.json(
      { error: "Failed to create methodology" },
      { status: 500 }
    )
  }
}
