import { NextResponse } from "next/server";
import { getDossier } from "@/lib/company-data";
import { createClient } from "@/lib/supabase/server";
import { buildDynamicDossier } from "@/lib/dossier-builder";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { organizationName, websiteUrl, userId } = body;

        if (!organizationName) {
            return NextResponse.json(
                { error: "Organization name is required." },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // 1. Intelligent Cache + Upgrade Check
        if (userId) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("organization_name, company_dossier")
                .eq("id", userId)
                .single();

            if (profile?.company_dossier && 
                profile.organization_name?.toLowerCase() === organizationName.toLowerCase()) {
                
                // DOSSIER UPGRADE LOGIC: Detect 'Generic' profiles and force a fresh AI synthesis
                const dossier = profile.company_dossier as any;
                const isGeneric = 
                    !dossier.leadership || 
                    dossier.leadership === "Authorized Signatory" || 
                    dossier.leadership === "Management Team" ||
                    !dossier.revenueStreams || 
                    dossier.revenueStreams.length === 0 ||
                    !dossier.cyberStats ||
                    dossier.cyberStats.length < 3;

                if (!isGeneric) {
                    console.log(`[Dossier API] Cache Hit: Returning high-fidelity dossier for ${organizationName}`);
                    return NextResponse.json(profile.company_dossier);
                }
                
                console.log(`[Dossier API] Cache Invalid (Generic): Triggering Elite Upgrade for ${organizationName}`);
            } else {
                console.log(`[Dossier API] Cache Bypass: Searching for new organization ${organizationName}`);
            }
        }

        console.log(`[Dossier API] Generating dynamic intelligence for: ${organizationName} (${websiteUrl || "No URL"})`);

        try {
            // Trigger n8n Workflow for Dossier Generation
            const N8N_BASE_URL = process.env.N8N_WEBHOOK_URL || "http://localhost:5678/webhook";
            const N8N_ENDPOINT = `${N8N_BASE_URL}/generate-dossier`;

            const N8N_USER = process.env.N8N_USER || "admin";
            const N8N_PASS = process.env.N8N_PASSWORD || "CyrusAutomation123!";
            const authHeader = `Basic ${Buffer.from(`${N8N_USER}:${N8N_PASS}`).toString('base64')}`;

            const response = await fetch(N8N_ENDPOINT, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify({ organizationName, websiteUrl }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`n8n Error (${response.status}): ${errorText || 'No response body'}`);
            }
            
            const responseText = await response.text();
            let dynamicDossier;

            // NUCLEAR PARSER: Handles Markdown backticks, AI chatter, and malformed JSON
            try {
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                const cleanJson = jsonMatch ? jsonMatch[0] : responseText;
                dynamicDossier = JSON.parse(cleanJson);
            } catch (jsonErr) {
                console.error("[Dossier API] Nuclear Parse Failed. Status:", response.status);
                throw new Error(`AI returned invalid formatting`);
            }
            
            // Safety: Handle n8n array wrapping
            if (Array.isArray(dynamicDossier)) {
                dynamicDossier = dynamicDossier[0];
            }

            if (!dynamicDossier || Object.keys(dynamicDossier).length === 0) {
                throw new Error("Empty intelligence payload");
            }

            if (dynamicDossier.message === "Workflow was started" || !dynamicDossier.name || !dynamicDossier.cyberStats) {
                throw new Error(`n8n returned asynchronous confirmation or incomplete data: ${JSON.stringify(dynamicDossier)}`);
            }

            console.log(`[Dossier API] Synthesis Successful for ${organizationName} via n8n`);

            // If userId is provided, update the database profile with the new enriched dossier
            if (userId && dynamicDossier) {
                await supabase
                    .from('profiles')
                    .update({ company_dossier: dynamicDossier })
                    .eq('id', userId);
            }

            return NextResponse.json(dynamicDossier);
        } catch (error: any) {
            console.error("[Dossier API] n8n Automation Failed:", error.message);
            console.log(`[Dossier API] Falling back to Direct Gemini Synthesis for: ${organizationName}`);

            try {
                // FALLBACK: Use Direct Gemini Synthesis (Google Search + Shodan Recon)
                const dynamicDossier = await buildDynamicDossier(organizationName, websiteUrl);

                if (userId && dynamicDossier) {
                    console.log(`[Dossier API] Syncing direct intelligence to vault for user: ${userId}`);
                    await supabase
                        .from('profiles')
                        .update({ company_dossier: dynamicDossier })
                        .eq('id', userId);
                }

                console.log(`[Dossier API] Direct Synthesis Successful for ${organizationName}`);
                return NextResponse.json(dynamicDossier);
            } catch (fallbackError: any) {
                console.error("[Dossier API] Direct Synthesis also failed:", fallbackError.message);
                
                // FINAL FALLBACK: Static Engine
                const fallbackDossier = getDossier(organizationName);
                if (fallbackDossier) {
                    console.log("[Dossier API] Falling back to static template engine.");
                    return NextResponse.json(fallbackDossier);
                }

                return NextResponse.json(
                    { error: "Intelligence synthesis malformed. Please check AI credits." },
                    { status: 500 }
                );
            }
        }

    } catch (error) {
        console.error("[Dossier API] Fatal Request Error:", error);
        return NextResponse.json(
            { error: "Intelligence synthesis malformed." },
            { status: 400 }
        );
    }
}
