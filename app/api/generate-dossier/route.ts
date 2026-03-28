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
            // Attempt to build the dossier dynamically using Gemini + Google Search
            const dynamicDossier = await buildDynamicDossier(organizationName, websiteUrl);
            return NextResponse.json(dynamicDossier);
        } catch (geminiError) {
            console.error("[Dossier API] Gemini Generation Failed:", geminiError);
            
            // Fallback to local hardcoded/generic dossier
            console.log("[Dossier API] Falling back to static intelligence engine.");
            const fallbackDossier = getDossier(organizationName);
            
            if (fallbackDossier) {
                return NextResponse.json(fallbackDossier);
            } else {
                return NextResponse.json(
                    { error: "Failed to generate dossier and no fallback available." },
                    { status: 500 }
                );
            }
        }
    } catch (error) {
        console.error("[Dossier API] Request Parsing Error:", error);
        return NextResponse.json(
            { error: "Invalid request payload." },
            { status: 400 }
        );
    }
}
