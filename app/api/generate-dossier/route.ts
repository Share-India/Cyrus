import { NextResponse } from "next/server";
import { buildDynamicDossier } from "@/lib/dossier-builder";
import { getDossier } from "@/lib/company-data";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { organizationName, websiteUrl } = body;

        if (!organizationName) {
            return NextResponse.json(
                { error: "Organization name is required." },
                { status: 400 }
            );
        }

        console.log(`[Dossier API] Generating dynamic intelligence for: ${organizationName} (${websiteUrl || "No URL"})`);

        try {
            // Trigger n8n Workflow for Dossier Generation
            const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "http://n8n:5678/webhook/generate-dossier";

            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ organizationName, websiteUrl }),
            });

            if (!response.ok) throw new Error('n8n Dossier Generation Failed');
            
            const dynamicDossier = await response.json();
            return NextResponse.json(dynamicDossier);
        } catch (geminiError) {
            console.error("[Dossier API] Gemini Generation Failed:", geminiError);
            
            // Re-adding the fallback logic so it doesn't crash completely if n8n fails
            const fallbackDossier = getDossier(organizationName);
            if (fallbackDossier) return NextResponse.json(fallbackDossier);

            return NextResponse.json(
                { error: "Failed to generate dossier via AI Search. Please try again." },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("[Dossier API] Request Parsing Error:", error);
        return NextResponse.json(
            { error: "Invalid request payload." },
            { status: 400 }
        );
    }
}
