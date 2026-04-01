/**
 * Shodan Engine
 * Wraps the Shodan REST API to gather actionable OSINT on a target domain.
 */

export interface ShodanFinds {
    assetCount: number;
    openPorts: number[];
    vulnerabilities: string[]; // CVEs
    techStack: string[]; // Web servers, DB versions, etc.
    rawReport: string; // A summarized string for the LLM
}

export async function gatherShodanIntelligence(websiteUrl: string): Promise<ShodanFinds | null> {
    const apiKey = process.env.SHODAN_API_KEY;

    if (!apiKey) {
        console.warn("[Shodan Engine] SHODAN_API_KEY is not configured in .env.local. Skipping OSINT.");
        return null;
    }

    try {
        // Strip https, http, www, and endpoints to get the raw domain
        const urlObj = new URL(!websiteUrl.startsWith('http') ? `https://${websiteUrl}` : websiteUrl);
        let domain = urlObj.hostname;
        if (domain.startsWith("www.")) {
            domain = domain.substring(4);
        }

        console.log(`[Shodan Engine] Initiating OSINT scan for domain: ${domain}`);

        // Call the broad host search endpoint
        const response = await fetch(`https://api.shodan.io/shodan/host/search?key=${apiKey}&query=hostname:${domain}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            // Prevent Next.js from aggressively caching this API call so we get fresh intel
            cache: 'no-store'
        });

        if (!response.ok) {
            console.error(`[Shodan Engine] API Error: ${response.status} ${response.statusText}`);
            return null;
        }

        const data = await response.json();

        if (!data.matches || data.matches.length === 0) {
            console.log(`[Shodan Engine] Zero exposed assets found for ${domain}.`);
            return {
                assetCount: 0,
                openPorts: [],
                vulnerabilities: [],
                techStack: [],
                rawReport: `Shodan reconnaissance yielded zero exposed external internet assets or vulnerabilities for ${domain}.`
            };
        }

        const matches = data.matches;
        const openPorts = new Set<number>();
        const vulns = new Set<string>();
        const techStack = new Set<string>();

        // We'll summarize the top critical findings to drop into Gemini
        let topAssetsSummary = "";

        matches.forEach((match: any, index: number) => {
            if (match.port) openPorts.add(match.port);
            
            // Extract standard vulnerabilities (CVE array)
            if (match.vulns) {
                Object.keys(match.vulns).forEach(cve => vulns.add(cve));
            }

            // Extract tech layer info (e.g. Apache, Nginx, IIS)
            if (match.product) techStack.add(match.product);
            if (match.version && match.product) techStack.add(`${match.product} ${match.version}`);

            // Build a mini technical raw string for the LLM up to 5 assets
            if (index < 5) {
                topAssetsSummary += `- IP: ${match.ip_str} | Port: ${match.port} | Protocol: ${match.transport} | Service: ${match.product || "Unknown"}\n`;
            }
        });

        // Add additional banners if we have vulns
        if (vulns.size > 0) {
            topAssetsSummary += `\n🚨 DETECTED CRITICAL CVEs:\n${Array.from(vulns).join(", ")}\n`;
        }

        const reportString = `
[SHODAN EXTENDED OSINT REPORT]
Target: ${domain}
Total Exposed Assets Found: ${data.total || matches.length}
Unique Open Ports Exposed: ${Array.from(openPorts).join(", ")}
Identified Technologies: ${Array.from(techStack).slice(0, 10).join(", ") || "None highly specific identified"}
Known Vulnerabilities (CVEs): ${vulns.size > 0 ? Array.from(vulns).join(", ") : "None specifically matched from banners"}

Sample Extracted Asset Footprint:
${topAssetsSummary}
[END SHODAN DATA]`;

        console.log(`[Shodan Engine] Successfully gathered ${matches.length} matches, found ${openPorts.size} open ports and ${vulns.size} CVEs.`);

        return {
            assetCount: data.total || matches.length,
            openPorts: Array.from(openPorts),
            vulnerabilities: Array.from(vulns).slice(0, 50), // Cap to prevent massive arrays
            techStack: Array.from(techStack),
            rawReport: reportString
        };

    } catch (error) {
        console.error("[Shodan Engine] Execution failure:", error);
        return null;
    }
}
