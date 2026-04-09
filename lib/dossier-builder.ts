import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import { CompanyDossier } from "./company-data";
import { gatherShodanIntelligence, ShodanFinds } from "./shodan-engine";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
    console.warn("GOOGLE_GENERATIVE_AI_API_KEY is not set. Dossier generation will fail.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

// Define the response schema matching CompanyDossier using SchemaType
const dossierSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        name: { type: SchemaType.STRING, description: "Full official name of the organization" },
        founded: { type: SchemaType.STRING, description: "Year founded or established" },
        hq: { type: SchemaType.STRING, description: "Headquarters location (City, Country)" },
        leadership: { type: SchemaType.STRING, description: "Key leadership (CEO, Founder)" },
        legacy: { type: SchemaType.STRING, description: "A bold, detailed paragraph about their history and market dominance" },
        portfolio: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "List of key products, services, or solutions offered"
        },
        description: { type: SchemaType.STRING, description: "A comprehensive description of what the company does" },
        website: { type: SchemaType.STRING, description: "Official website URL" },
        businessModel: { type: SchemaType.STRING, description: "Detailed explanation of how they make money and operate" },
        employees: { type: SchemaType.STRING, description: "Estimated number of employees" },
        annualRevenue: { type: SchemaType.STRING, description: "Estimated annual revenue" },
        operationalReach: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "Geographic locations or markets they operate in"
        },
        industriesServed: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "List of industries they service"
        },
        notableClients: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "Known or likely major clients/partners"
        },
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
            description: "Breakdown of major revenue streams with descriptions"
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
            description: "Timeline of key corporate events"
        },
        digitalAssets: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "Critical digital infrastructure, software, and data they hold"
        },
        supplyChainExposure: { type: SchemaType.STRING, description: "Deep analysis of digital supply chain dependencies and cyber vulnerabilities" },
        regulatoryEnvironment: { type: SchemaType.STRING, description: "Regulations they must comply with" },
        cyberThreatNarrative: { type: SchemaType.STRING, description: "A highly realistic, devastating cyber threat narrative tailored to their business model." },
        cyberStats: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    label: { type: SchemaType.STRING },
                    value: { type: SchemaType.NUMBER, description: "Risk score from 0 to 100" },
                    reasoning: { type: SchemaType.STRING }
                },
                required: ["label", "value", "reasoning"]
            },
            description: "5 quantifiable cyber risk factors specific to this business."
        },
        shodanIntelligence: {
            type: SchemaType.OBJECT,
            properties: {
                assetCount: { type: SchemaType.NUMBER },
                openPorts: { type: SchemaType.ARRAY, items: { type: SchemaType.NUMBER } },
                vulnerabilities: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                techStack: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                lastScanDate: { type: SchemaType.STRING }
            },
            description: "Explicitly pass back the technical OSINT findings if they were provided in the prompt."
        }
    },
    required: [
        "name", "founded", "hq", "leadership", "legacy", "portfolio", "description",
        "businessModel", "employees", "annualRevenue", "operationalReach", "industriesServed",
        "notableClients", "revenueStreams", "keyMilestones", "digitalAssets",
        "supplyChainExposure", "regulatoryEnvironment", "cyberThreatNarrative", "cyberStats"
    ]
};

/**
 * Dynamically builds a CompanyDossier using the Gemini API and Google Search Grounding.
 */
export async function buildDynamicDossier(organizationName: string, websiteUrl?: string): Promise<CompanyDossier> {
    if (!apiKey) {
        throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not configured.");
    }

    // Attempt Shodan Reconnaissance if a website is provided
    let shodanRecon: ShodanFinds | null = null;
    let shodanPrompt = "";

    if (websiteUrl) {
        console.log(`[Dossier Builder] Triggering OSINT Recon for: ${websiteUrl}`);
        shodanRecon = await gatherShodanIntelligence(websiteUrl);

        if (shodanRecon) {
            shodanPrompt = `
                CRITICAL TECHNICAL INTELLIGENCE INJECTED:
                We have performed a direct OSINT scan on their public infrastructure.
                Integrate these findings into your final Threat Narrative and Cyber Stats:
                ${shodanRecon.rawReport}
            `;
        }
    }

    // Model 1: Search-enabled for unstructured intelligence gathering
    const searchModel = genAI.getGenerativeModel({
        model: process.env.AI_MODEL || "gemini-2.0-flash",
        generationConfig: {
            temperature: 0.2,
        },
        // @ts-expect-error - The SDK types use googleSearchRetrieval but the API requires googleSearch
        tools: [{ googleSearch: {} }]
    });

    // Model 2: Strict JSON schema extraction (no tools)
    const extractionModel = genAI.getGenerativeModel({
        model: process.env.AI_MODEL || "gemini-2.0-flash",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: dossierSchema,
            temperature: 0.1,
        }
    });

    const targetContext = websiteUrl
        ? `The organization is "${organizationName}", and their official website is ${websiteUrl}.`
        : `The organization is "${organizationName}".`;

    const researchPrompt = `
        You are a Tier-1 Forensic Cyber Underwriter at a global reinsurance firm.
        Perform a deep-dive OSINT synthesis for the organization: "${organizationName}".
        ${websiteUrl ? `Primary URL for reconnaissance: ${websiteUrl}` : ''}

        ${shodanPrompt}

        REQUIRED STANDARDS (ELITE SPECIFICITY ONLY):
        1. **Leadership**: Identify the specific CEO, MD, or Authorized Signatory by name (e.g., "M.S. Sreedhar, MD"). NO generic "Management Team".
        2. **Revenue/Scale**: Hunt for exact annual revenue or valuation (e.g., "INR 3,500 Cr", "USD 450M"). Identify exact employee headcount ranges.
        3. **Business Model**: Explain the technical nature of their operations (e.g., "Direct-to-consumer digital insurance node with API-led distribution strategy"). 
        4. **Portfolio**: List 4-6 specific products or service lines (e.g., "Commercial Casualty", "Retail Health", "SME Cyber").
        5. **Cyber Risk Narrative**: Synthesized as highly technical risk factors with realistic business reasoning referencing specific laws like India's DPDP Act 2023 or IRDAI frameworks. 
        6. **Digital Asset Inventory**: Be granular. List specific systems they likely use (e.g., "SAP S/4HANA ERP", "Direct API Gateways to HDFC Bank", "PHI Data for 2M+ patients").

        STRICT FORBIDDEN LIST:
        - NO "N/A" or "Unknown".
        - NO "Leading service provider".
        - NO generic "Data security risk".
        - NO placeholders like "[CEO NAME]".

        Format your research as a dense narrative block of technical intel first, followed by the specific data points requested.
    `;

    try {
        console.log(`[Dossier Builder] Step 1: Gathering unstructured intelligence via Search for ${organizationName}...`);
        const searchResult = await searchModel.generateContent(researchPrompt);
        const searchResponse = searchResult.response.text();

        if (!searchResponse) {
            throw new Error("Gemini returned an empty research response.");
        }

        console.log(`[Dossier Builder] Step 2: Extracting structured JSON schema...`);
        const extractionPrompt = `
            You are a strict JSON data extraction AI.
            Read the following corporate intelligence briefing and map it exactly into the required JSON schema structure.
            If any data point is missing from the briefing, infer the most logical, realistic professional estimate based on similar companies in their industry. Ensure all arrays have at least 4 items.

            [INTELLIGENCE BRIEFING START]
            ${searchResponse}
            [INTELLIGENCE BRIEFING END]
        `;

        const extractionResult = await extractionModel.generateContent(extractionPrompt);
        const jsonText = extractionResult.response.text();

        if (!jsonText) {
            throw new Error("Gemini returned an empty JSON extraction response.");
        }

        const data: CompanyDossier = JSON.parse(jsonText);

        if (websiteUrl && (!data.website || data.website.trim() === "" || data.website.toLowerCase().includes("n/a") || data.website.toLowerCase() === "na")) {
            data.website = websiteUrl;
        }

        console.log(`[Dossier Builder] Dynamic Dossier successfully generated for ${data.name}.`);
        return data;

    } catch (error) {
        console.error("Error generating dynamic dossier with Gemini:", error);
        throw error;
    }
}
