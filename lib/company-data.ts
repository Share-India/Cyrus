
export interface CompanyDossier {
    name: string;
    founded: string;
    hq: string;
    leadership: string;
    legacy: string;
    portfolio: string[];
    description: string;
    website?: string;
}

export const COMPANY_DOSSIERS: Record<string, CompanyDossier> = {
    "Avcon Forklifts": {
        name: "AVCON SYSTEMS",
        founded: "1984",
        hq: "Thane, India",
        leadership: "Mr. V.S. Sawarkar",
        legacy: "40-Year Excellence",
        portfolio: [
            "Precision Battery-Operated Forklifts",
            "Customized 3D-Designed Solutions",
            "Advanced Warehousing Equipment"
        ],
        description: "A pioneer in ergonomic and safe material handling, founded by industry veteran Mr. V.S. Sawarkar.",
        website: "https://avconforklift.com"
    },
    "Share India Insurance Brokers": {
        name: "SHARE INDIA INSURANCE",
        founded: "2018",
        hq: "New Delhi, India",
        leadership: "Mr. Ajay Kumar Patel (CEO)",
        legacy: "Share India Group (Est. 1994)",
        portfolio: [
            "Industrial & Commercial Risk Advisory",
            "Employee Benefits & Life Insurance",
            "Data-Driven Claims Advocacy"
        ],
        description: "An IRDA-licensed broker providing comprehensive risk management solutions with nearly 3 decades of group financial heritage.",
        website: "https://shareindiainsurance.com"
    },
    "Alpha Industries": {
        name: "ALPHALOGIC INDUSTRIES",
        founded: "2020",
        hq: "Pune, India",
        leadership: "Dynamic Enterprise Team",
        legacy: "High-Growth Storage Pioneer",
        portfolio: [
            "Industrial Racking & Storage Systems",
            "Automated Mezzanine Solutions",
            "Logistics Infrastructure Design"
        ],
        description: "Specializing in manufacturing state-of-the-art industrial storage systems for global logistics and manufacturing hubs.",
        website: "https://alphalogicindustries.com"
    },
    "TCS": {
        name: "TATA CONSULTANCY SERVICES",
        founded: "1968",
        hq: "Mumbai, India",
        leadership: "Tata Group Stewardship",
        legacy: "Global IT Benchmark",
        portfolio: [
            "Artificial Intelligence & Cloud",
            "Cybersecurity & Digital Infrastructure",
            "Global Technology Consulting"
        ],
        description: "The architect of India's IT revolution, operating in 46 countries as a cornerstone of the Tata Group.",
        website: "https://www.tcs.com"
    }
};

export const getDossier = (orgName: string | null): CompanyDossier | null => {
    if (!orgName) return null;

    // Exact match search
    if (COMPANY_DOSSIERS[orgName]) return COMPANY_DOSSIERS[orgName];

    // Fuzzy/Case-insensitive search
    const key = Object.keys(COMPANY_DOSSIERS).find(k => k.toLowerCase() === orgName.toLowerCase());
    if (key) return COMPANY_DOSSIERS[key];

    return null;
};
