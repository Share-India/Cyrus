import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { CompanyDossier } from "./company-data";

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
    console.warn("GOOGLE_GENERATIVE_AI_API_KEY is not set. Dossier generation will fail.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

// Define the response schema matching CompanyDossier using SchemaType
const dossierSchema = {
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

    const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: dossierSchema,
            temperature: 0.2,
        },
        tools: [{ googleSearch: {} }]
    });

    const targetContext = websiteUrl
        ? `The organization is "${organizationName}", and their official website is ${websiteUrl}.`
        : `The organization is "${organizationName}".`;

    const prompt = `
        You are an elite Cyber Threat Intelligence (CTI) and corporate analyst AI.
        Your task is to generate a massive, highly detailed, and accurate "Organization Intelligence Dossier" for:
        
        ${targetContext}

        Instructions:
        1. Use your integrated Google Search tool to find the most up-to-date, real-world information about this company.
        2. If a website URL is provided, search for information from that site and its operations.
        3. Fill out the entire JSON schema with incredibly detailed, professional, and specific information.
        4. Do NOT use generic placeholders — use their actual operational details.
        5. For "cyberThreatNarrative" and "supplyChainExposure", think like a underwriter: how would a ransomware attack or data breach devastate their specific operations?
        6. For "cyberStats", provide exactly 5 specific risk vectors with realistic scores (0-100) and deep business reasoning.
        7. Ensure ALL arrays have at least 4-6 rich, descriptive items.
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        if (!text) {
            throw new Error("Gemini returned an empty response.");
        }

        const data: CompanyDossier = JSON.parse(text);

        if (websiteUrl && (!data.website || data.website === "")) {
            data.website = websiteUrl;
        }

        return data;

    } catch (error) {
        console.error("Error generating dynamic dossier with Gemini:", error);
        throw error;
    }
}
