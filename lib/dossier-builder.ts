import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import { CompanyDossier } from "./company-data";
import { gatherShodanIntelligence, ShodanFinds } from "./shodan-engine";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
    console.warn("GOOGLE_GENERATIVE_AI_API_KEY is not set. Dossier generation will fail.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

const dossierSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        name: { type: SchemaType.STRING, description: "Full official name of the organization" },
        founded: { type: SchemaType.STRING, description: "Year founded or established" },
        hq: { type: SchemaType.STRING, description: "Headquarters location (City, Country)" },
        leadership: { type: SchemaType.STRING, description: "Key leadership (CEO, Founder)" },
        legacy: { type: SchemaType.STRING, description: "Detailed paragraph about history" },
        portfolio: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Products" },
        description: { type: SchemaType.STRING, description: "Description" },
        website: { type: SchemaType.STRING, description: "Website URL" },
        businessModel: { type: SchemaType.STRING, description: "Business Model" },
        employees: { type: SchemaType.STRING, description: "Employees" },
        annualRevenue: { type: SchemaType.STRING, description: "Revenue" },
        operationalReach: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Markets" },
        industriesServed: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Industries" },
        notableClients: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Clients" },
        revenueStreams: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    label: { type: SchemaType.STRING },
                    description: { type: SchemaType.STRING }
                },
                required: ["label", "description"]
            },
            description: "Streams"
        },
        keyMilestones: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    year: { type: SchemaType.STRING },
                    event: { type: SchemaType.STRING }
                },
                required: ["year", "event"]
            },
            description: "Timeline"
        },
        digitalAssets: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Assets" },
        supplyChainExposure: { type: SchemaType.STRING, description: "Analysis" },
        regulatoryEnvironment: { type: SchemaType.STRING, description: "Regulations" },
        cyberThreatNarrative: { type: SchemaType.STRING, description: "Narrative" },
        cyberStats: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    label: { type: SchemaType.STRING },
                    value: { type: SchemaType.NUMBER },
                    reasoning: { type: SchemaType.STRING }
                },
                required: ["label", "value", "reasoning"]
            },
            description: "Stats"
        },
        shodanIntelligence: {
            type: SchemaType.OBJECT,
            properties: {
                assetCount: { type: SchemaType.NUMBER },
                openPorts: { 
                    type: SchemaType.ARRAY, 
                    items: { 
                        type: SchemaType.OBJECT,
                        properties: {
                            port: { type: SchemaType.NUMBER },
                            risk: { type: SchemaType.STRING }
                        },
                        required: ["port", "risk"]
                    } 
                },
                vulnerabilities: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                techStack: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                lastScanDate: { type: SchemaType.STRING }
            },
            description: "OSINT"
        }
    },
    required: ["name", "founded", "hq", "leadership", "legacy", "portfolio", "description", "businessModel", "employees", "annualRevenue", "operationalReach", "industriesServed", "notableClients", "revenueStreams", "keyMilestones", "digitalAssets", "supplyChainExposure", "regulatoryEnvironment", "cyberThreatNarrative", "cyberStats"]
};

export async function buildDynamicDossier(organizationName: string, websiteUrl?: string): Promise<CompanyDossier> {
    if (!apiKey) throw new Error("No API Key");

    let shodanPrompt = "";
    if (websiteUrl) {
        const shodanRecon = await gatherShodanIntelligence(websiteUrl);
        if (shodanRecon) {
            shodanPrompt = `OSINT: ${shodanRecon.rawReport}`;
        }
    }

    const safetySettings = [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ];

    const searchModel = genAI.getGenerativeModel({
        model: process.env.AI_MODEL || "gemini-2.0-flash",
        safetySettings: safetySettings as any
    });

    const extractionModel = genAI.getGenerativeModel({
        model: process.env.AI_MODEL || "gemini-2.0-flash",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: dossierSchema,
            temperature: 0.1,
        },
        safetySettings: safetySettings as any
    });

    const researchPrompt = `
        You are a Tier-1 Forensic Cyber Underwriter.
        Perform a deep-dive OSINT synthesis for: "${organizationName}".
        ${websiteUrl ? `Primary URL: ${websiteUrl}` : ''}
        ${shodanPrompt}

        REQUIRED STANDARDS:
        1. **Leadership**: Specific CEO/MD name.
        2. **Scale**: Exact annual revenue estimate (e.g. INR 5,000 Cr) and employee count.
        3. **Business Model**: Technical nature of operations.
        4. **Cyber Risk**: Technical risk factors referencing specific frameworks like India's DPDP Act 2023.
        5. **Digital Assets**: Granular list (ERP, CRM, PHI/PII scale).

        Format as a dense narrative briefing.
    `;

    try {
        console.log(`[Dossier Builder] Step 1: Gathering structured intelligence for ${organizationName}...`);
        const searchResult = await searchModel.generateContent(researchPrompt);
        const searchResponse = searchResult.response.text();

        console.log(`[Dossier Builder] Step 2: Extracting high-fidelity JSON...`);
        const extractionPrompt = `
            You are a senior data engineer. Extract JSON from this briefing.
            If data is missing, infer logically. Ensure 4 items per array.
            
            [BRIEFING]
            ${searchResponse}
            [/BRIEFING]
        `;

        const extractionResult = await extractionModel.generateContent(extractionPrompt);
        const jsonText = extractionResult.response.text().replace(/```json|```/g, "").trim();
        
        let cleanedJsonText = jsonText;
        const firstBrace = jsonText.indexOf('{');
        if (firstBrace > 0) cleanedJsonText = jsonText.substring(firstBrace);

        const data: CompanyDossier = JSON.parse(cleanedJsonText);
        if (websiteUrl && !data.website) data.website = websiteUrl;
        
        console.log(`[Dossier Builder] Synthesis Successful: ${data.name}`);
        return data;
    } catch (error) {
        console.error("AI Build Error:", error);
        throw error;
    }
}

export function getFallbackModel() {
    const safetySettings = [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
    ];

    return genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
        },
        safetySettings: safetySettings as any
    });
}
