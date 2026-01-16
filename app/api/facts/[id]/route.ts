import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { Fact } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data", "transcriptions");

function getFactsFilePath(transcriptId: string): string {
    return path.join(DATA_DIR, `${transcriptId}-facts.json`);
}

/**
 * GET /api/facts/[id]
 * Load cached facts for a transcript
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: transcriptId } = await params;
        const filePath = getFactsFilePath(transcriptId);

        try {
            const fileContent = await fs.readFile(filePath, "utf-8");
            const facts: Fact[] = JSON.parse(fileContent);
            return NextResponse.json({ facts });
        } catch (error) {
            // File doesn't exist - return empty facts array
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                return NextResponse.json({ facts: [] });
            }
            throw error;
        }
    } catch (error) {
        console.error("Error loading cached facts:", error);
        return NextResponse.json(
            { error: "Failed to load cached facts" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/facts/[id]
 * Save facts to cache
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: transcriptId } = await params;
        const body = await request.json();
        const { facts } = body;

        if (!Array.isArray(facts)) {
            return NextResponse.json(
                { error: "Facts must be an array" },
                { status: 400 }
            );
        }

        const filePath = getFactsFilePath(transcriptId);

        // Ensure directory exists
        await fs.mkdir(DATA_DIR, { recursive: true });

        // Save facts to file
        await fs.writeFile(filePath, JSON.stringify(facts, null, 2), "utf-8");

        return NextResponse.json({ success: true, count: facts.length });
    } catch (error) {
        console.error("Error saving facts:", error);
        return NextResponse.json(
            { error: "Failed to save facts" },
            { status: 500 }
        );
    }
}
