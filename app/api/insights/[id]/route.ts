import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { InsightsResponse } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data", "transcriptions");

function getInsightsFilePath(transcriptId: string): string {
    return path.join(DATA_DIR, `${transcriptId}-insights.json`);
}

/**
 * GET /api/insights/[id]
 * Load cached insights for a transcript
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: transcriptId } = await params;
        const filePath = getInsightsFilePath(transcriptId);

        try {
            const fileContent = await fs.readFile(filePath, "utf-8");
            const insightsData: InsightsResponse = JSON.parse(fileContent);
            return NextResponse.json(insightsData);
        } catch (error) {
            // File doesn't exist - return empty insights
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                return NextResponse.json({
                    insight_summary: {
                        total_facts_analyzed: 0,
                        total_insights_generated: 0,
                    },
                    insights: [],
                });
            }
            throw error;
        }
    } catch (error) {
        console.error("Error loading cached insights:", error);
        return NextResponse.json(
            { error: "Failed to load cached insights" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/insights/[id]
 * Save insights to cache
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: transcriptId } = await params;
        const body = await request.json();
        const insightsData: InsightsResponse = body;

        if (!insightsData || !insightsData.insights || !Array.isArray(insightsData.insights)) {
            return NextResponse.json(
                { error: "Invalid insights data structure" },
                { status: 400 }
            );
        }

        const filePath = getInsightsFilePath(transcriptId);

        // Ensure directory exists
        await fs.mkdir(DATA_DIR, { recursive: true });

        // Save insights to file
        await fs.writeFile(
            filePath,
            JSON.stringify(insightsData, null, 2),
            "utf-8"
        );

        return NextResponse.json({
            success: true,
            count: insightsData.insights.length,
        });
    } catch (error) {
        console.error("Error saving insights:", error);
        return NextResponse.json(
            { error: "Failed to save insights" },
            { status: 500 }
        );
    }
}
