import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { assessmentId, clientEmail } = await req.json();

        if (!assessmentId) {
            return NextResponse.json({ error: "Missing assessmentId" }, { status: 400 });
        }

        console.log(`[Finalize Audit] Triggering n8n master workflow for: ${assessmentId}`);
        
        // Use internal Docker network URL
        const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "http://n8n:5678/webhook/finalize-audit";

        const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                assessmentId,
                clientEmail
            })
        });

        if (!n8nResponse.ok) {
            throw new Error(`n8n Trigger Failed: ${n8nResponse.statusText}`);
        }

        return NextResponse.json({ success: true, message: "Finalization protocol initiated via n8n" });

    } catch (err: any) {
        console.error("[Finalize Audit Error]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
