import { createClient } from "@/lib/supabase/server";
import { analyzePolicyDocument } from "@/lib/policy-analyzer";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const supabase = await createClient();
    const { documentId } = await req.json();

    if (!documentId) {
        return NextResponse.json({ error: "Missing documentId" }, { status: 400 });
    }

    try {
        // 1. Fetch document metadata
        const { data: document, error: dbError } = await supabase
            .from("policy_documents")
            .select("*")
            .eq("id", documentId)
            .single();

        if (dbError || !document) throw new Error(dbError?.message || "Document not found");

        // 2. Update status to 'processing'
        await supabase
            .from("policy_documents")
            .update({ analysis_status: "processing" })
            .eq("id", documentId);

        // 3. Download file from storage
        const { data: fileData, error: storageError } = await supabase.storage
            .from("policy-documents")
            .download(document.file_path);

        if (storageError || !fileData) throw new Error(storageError?.message || "Failed to download file");

        const buffer = Buffer.from(await fileData.arrayBuffer());

        // 4. Mime type determination (can refine this based on extension)
        let mimeType = "application/pdf";
        if (document.file_name.endsWith(".docx")) mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        else if (document.file_name.endsWith(".png")) mimeType = "image/png";
        else if (document.file_name.endsWith(".jpg") || document.file_name.endsWith(".jpeg")) mimeType = "image/jpeg";

        // 5. Run AI Analysis
        console.log(`[AI Analysis] Starting analysis for: ${document.file_name}`);
        const analysis = await analyzePolicyDocument(buffer, mimeType);

        // 6. Save results to database
        const { error: updateError } = await supabase
            .from("policy_documents")
            .update({
                analysis_result: analysis,
                analysis_status: "completed"
            })
            .eq("id", documentId);

        if (updateError) throw new Error(updateError.message);

        console.log(`[AI Analysis] Completed analysis for: ${document.file_name}`);
        return NextResponse.json({ success: true, analysis });

    } catch (err: any) {
        console.error("[AI Analysis Error]", err);
        
        // Update database with error status
        await supabase
            .from("policy_documents")
            .update({ 
                analysis_status: "failed", 
                analysis_error: err.message 
            })
            .eq("id", documentId);

        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
