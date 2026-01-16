// SHARE INDIA CYBER INSURANCE - UNIFIED UNDERWRITING MODEL
// All 95 questions across 19 domains with industry weights and killer logic

export type QuestionType = "binary" | "frequency" | "multiple" | "coverage" | "governance"

export interface UnderwritingQuestion {
  id: string
  domain: string
  text: string
  type: QuestionType
  options?: {
    label: string
    value: number
  }[]
  response: number
  maxValue?: number
  isKiller: boolean
  defaultIsKiller?: boolean // Added for potential future use, though not strictly required by current logic
}

export interface Domain {
  id: string
  name: string
  defaultWeight: number
  activeWeight: number
  questions: UnderwritingQuestion[]
}

export interface IndustryProfile {
  id: string
  name: string
  domainWeights: {
    [domainName: string]: number
  }
}

export interface ScoringResult {
  totalScore: number
  domainScores: Array<{
    domain: string
    score: number
    defaultWeight: number
    activeWeight: number
    contribution: number
    maxScore: number
    earnedScore: number
  }>
  riskTier: "A" | "B" | "C" | "D"
  premiumLoading: string
  autoDeclined: boolean
  failedKillers: Array<{ id: string; text: string }>
  declineNarrative: string
}

export const INDUSTRY_PROFILES: IndustryProfile[] = [
  {
    id: "cyber_security",
    name: "Cyber Security",
    domainWeights: {
      "Network Security": 7,
      "Data Backup and Recovery": 7,
      Certifications: 4,
      "Background Verification and Awareness": 4,
      "Regulatory Compliance": 5,
      "Organizational Policies": 5,
      "Physical Perimeter Security": 7,
      "Endpoint Security": 6,
      "IoT and OT Network": 9,
      "Asset Management": 6,
      "Identity and Access Management": 6,
      "Vulnerability Assessment and Penetration Test": 5,
      "Ransomware Supplemental": 5,
      "Dark Web Exposure": 2,
      "Change / Patch Cadence": 5,
      "DLP & DSPM": 4,
      "Active Directory Configuration": 3,
      "Incident Management & Response": 6,
      "SOC & SOAR Capabilities": 4,
    },
  },
  {
    id: "manufacturing",
    name: "Manufacturing and Engineering",
    domainWeights: {
      "Network Security": 7,
      "Data Backup and Recovery": 8,
      Certifications: 3,
      "Background Verification and Awareness": 4,
      "Regulatory Compliance": 5,
      "Organizational Policies": 3,
      "Physical Perimeter Security": 7,
      "Endpoint Security": 6,
      "IoT and OT Network": 10,
      "Asset Management": 5,
      "Identity and Access Management": 5,
      "Vulnerability Assessment and Penetration Test": 6,
      "Ransomware Supplemental": 7,
      "Dark Web Exposure": 2,
      "Change / Patch Cadence": 5,
      "DLP & DSPM": 4,
      "Active Directory Configuration": 4,
      "Incident Management & Response": 5,
      "SOC & SOAR Capabilities": 4,
    },
  },
  {
    id: "construction",
    name: "Construction and Infrastructure",
    domainWeights: {
      "Network Security": 6,
      "Data Backup and Recovery": 7,
      Certifications: 3,
      "Background Verification and Awareness": 5,
      "Regulatory Compliance": 6,
      "Organizational Policies": 4,
      "Physical Perimeter Security": 9,
      "Endpoint Security": 5,
      "IoT and OT Network": 9,
      "Asset Management": 6,
      "Identity and Access Management": 5,
      "Vulnerability Assessment and Penetration Test": 5,
      "Ransomware Supplemental": 6,
      "Dark Web Exposure": 2,
      "Change / Patch Cadence": 4,
      "DLP & DSPM": 3,
      "Active Directory Configuration": 4,
      "Incident Management & Response": 6,
      "SOC & SOAR Capabilities": 5,
    },
  },
  {
    id: "it_technology",
    name: "IT and Technology Services",
    domainWeights: {
      "Network Security": 8,
      "Data Backup and Recovery": 6,
      Certifications: 4,
      "Background Verification and Awareness": 5,
      "Regulatory Compliance": 6,
      "Organizational Policies": 4,
      "Physical Perimeter Security": 2,
      "Endpoint Security": 7,
      "IoT and OT Network": 2,
      "Asset Management": 5,
      "Identity and Access Management": 9,
      "Vulnerability Assessment and Penetration Test": 7,
      "Ransomware Supplemental": 6,
      "Dark Web Exposure": 4,
      "Change / Patch Cadence": 6,
      "DLP & DSPM": 8,
      "Active Directory Configuration": 6,
      "Incident Management & Response": 5,
      "SOC & SOAR Capabilities": 0,
    },
  },
  {
    id: "healthcare",
    name: "Healthcare and Pharmaceuticals",
    domainWeights: {
      "Network Security": 7,
      "Data Backup and Recovery": 9,
      Certifications: 4,
      "Background Verification and Awareness": 5,
      "Regulatory Compliance": 9,
      "Organizational Policies": 4,
      "Physical Perimeter Security": 5,
      "Endpoint Security": 6,
      "IoT and OT Network": 5,
      "Asset Management": 5,
      "Identity and Access Management": 7,
      "Vulnerability Assessment and Penetration Test": 5,
      "Ransomware Supplemental": 8,
      "Dark Web Exposure": 4,
      "Change / Patch Cadence": 4,
      "DLP & DSPM": 7,
      "Active Directory Configuration": 3,
      "Incident Management & Response": 2,
      "SOC & SOAR Capabilities": 1,
    },
  },
  {
    id: "retail",
    name: "Retail and E-Commerce",
    domainWeights: {
      "Network Security": 7,
      "Data Backup and Recovery": 6,
      Certifications: 3,
      "Background Verification and Awareness": 4,
      "Regulatory Compliance": 6,
      "Organizational Policies": 4,
      "Physical Perimeter Security": 4,
      "Endpoint Security": 6,
      "IoT and OT Network": 3,
      "Asset Management": 5,
      "Identity and Access Management": 8,
      "Vulnerability Assessment and Penetration Test": 6,
      "Ransomware Supplemental": 6,
      "Dark Web Exposure": 7,
      "Change / Patch Cadence": 6,
      "DLP & DSPM": 7,
      "Active Directory Configuration": 5,
      "Incident Management & Response": 5,
      "SOC & SOAR Capabilities": 2,
    },
  },
  {
    id: "hospitality",
    name: "Hospitality and Tourism",
    domainWeights: {
      "Network Security": 6,
      "Data Backup and Recovery": 6,
      Certifications: 3,
      "Background Verification and Awareness": 6,
      "Regulatory Compliance": 5,
      "Organizational Policies": 4,
      "Physical Perimeter Security": 7,
      "Endpoint Security": 8,
      "IoT and OT Network": 4,
      "Asset Management": 5,
      "Identity and Access Management": 7,
      "Vulnerability Assessment and Penetration Test": 5,
      "Ransomware Supplemental": 6,
      "Dark Web Exposure": 6,
      "Change / Patch Cadence": 5,
      "DLP & DSPM": 6,
      "Active Directory Configuration": 4,
      "Incident Management & Response": 4,
      "SOC & SOAR Capabilities": 3,
    },
  },
  {
    id: "logistics",
    name: "Logistics and Transportation",
    domainWeights: {
      "Network Security": 6,
      "Data Backup and Recovery": 7,
      Certifications: 3,
      "Background Verification and Awareness": 5,
      "Regulatory Compliance": 6,
      "Organizational Policies": 4,
      "Physical Perimeter Security": 7,
      "Endpoint Security": 5,
      "IoT and OT Network": 8,
      "Asset Management": 7,
      "Identity and Access Management": 5,
      "Vulnerability Assessment and Penetration Test": 5,
      "Ransomware Supplemental": 6,
      "Dark Web Exposure": 3,
      "Change / Patch Cadence": 5,
      "DLP & DSPM": 4,
      "Active Directory Configuration": 4,
      "Incident Management & Response": 4,
      "SOC & SOAR Capabilities": 4,
    },
  },
  {
    id: "financial",
    name: "Financial Services and Banking",
    domainWeights: {
      "Network Security": 8,
      "Data Backup and Recovery": 6,
      Certifications: 4,
      "Background Verification and Awareness": 6,
      "Regulatory Compliance": 10,
      "Organizational Policies": 5,
      "Physical Perimeter Security": 3,
      "Endpoint Security": 6,
      "IoT and OT Network": 1,
      "Asset Management": 4,
      "Identity and Access Management": 10,
      "Vulnerability Assessment and Penetration Test": 7,
      "Ransomware Supplemental": 6,
      "Dark Web Exposure": 7,
      "Change / Patch Cadence": 5,
      "DLP & DSPM": 8,
      "Active Directory Configuration": 2,
      "Incident Management & Response": 1,
      "SOC & SOAR Capabilities": 1,
    },
  },
]

const ALL_QUESTIONS: UnderwritingQuestion[] = [
  // Network Security (5 questions)
  {
    id: "NS-001",
    domain: "Network Security",
    text: "Is there a documented network architecture and design?",
    type: "binary",
    response: 0,
    isKiller: true,
    defaultIsKiller: true,
  },
  {
    id: "NS-002",
    domain: "Network Security",
    text: "Are firewalls deployed at all network perimeters?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "NS-003",
    domain: "Network Security",
    text: "Is network segmentation implemented?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "NS-004",
    domain: "Network Security",
    text: "Are VPNs used for remote access?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "NS-005",
    domain: "Network Security",
    text: "Is DNS security (DNSSEC) implemented?",
    type: "binary",
    response: 0,
    isKiller: false,
  },

  // Data Backup & Recovery (5 questions)
  {
    id: "DBR-001",
    domain: "Data Backup and Recovery",
    text: "Is there a formal, tested backup and recovery plan?",
    type: "binary",
    response: 0,
    isKiller: true,
    defaultIsKiller: true,
  },
  {
    id: "DBR-002",
    domain: "Data Backup and Recovery",
    text: "Are backups performed at least weekly?",
    type: "frequency",
    response: 0,
    isKiller: false,
    options: [
      { label: "Never", value: 0 },
      { label: "Annually", value: 0.25 },
      { label: "Semi-annually", value: 0.5 },
      { label: "Quarterly", value: 0.75 },
      { label: "Weekly or more", value: 1 },
    ],
  },
  {
    id: "DBR-003",
    domain: "Data Backup and Recovery",
    text: "Are backups stored offsite?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "DBR-004",
    domain: "Data Backup and Recovery",
    text: "Is backup restoration tested regularly?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "DBR-005",
    domain: "Data Backup and Recovery",
    text: "Are backup systems encrypted?",
    type: "binary",
    response: 0,
    isKiller: false,
  },

  // Certifications (5 questions)
  {
    id: "CERT-001",
    domain: "Certifications",
    text: "Does the organization hold ISO 27001 certification?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "CERT-002",
    domain: "Certifications",
    text: "Does the organization hold SOC 2 Type II certification?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "CERT-003",
    domain: "Certifications",
    text: "Does the organization hold industry-specific certifications?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "CERT-004",
    domain: "Certifications",
    text: "Are certifications maintained with annual audits?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "CERT-005",
    domain: "Certifications",
    text: "Does the organization hold PCI DSS certification (if applicable)?",
    type: "binary",
    response: 0,
    isKiller: false,
  },

  // Background Verification & Awareness (5 questions)
  {
    id: "BVA-001",
    domain: "Background Verification and Awareness",
    text: "Are background checks conducted for all employees?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "BVA-002",
    domain: "Background Verification and Awareness",
    text: "Is security awareness training provided annually?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "BVA-003",
    domain: "Background Verification and Awareness",
    text: "Is phishing simulation testing performed?",
    type: "frequency",
    response: 0,
    isKiller: false,
    options: [
      { label: "Never", value: 0 },
      { label: "Annually", value: 0.25 },
      { label: "Semi-annually", value: 0.5 },
      { label: "Quarterly", value: 0.75 },
      { label: "Monthly or more", value: 1 },
    ],
  },
  {
    id: "BVA-004",
    domain: "Background Verification and Awareness",
    text: "Is data handling training conducted?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "BVA-005",
    domain: "Background Verification and Awareness",
    text: "Are vendors/contractors vetted for security compliance?",
    type: "binary",
    response: 0,
    isKiller: false,
  },

  // Regulatory Compliance (5 questions)
  {
    id: "RC-001",
    domain: "Regulatory Compliance",
    text: "Does the organization have a documented compliance program?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "RC-002",
    domain: "Regulatory Compliance",
    text: "Are compliance audits conducted annually?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "RC-003",
    domain: "Regulatory Compliance",
    text: "Is there a data privacy policy aligned with GDPR/local laws?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "RC-004",
    domain: "Regulatory Compliance",
    text: "Are breach notification procedures documented?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "RC-005",
    domain: "Regulatory Compliance",
    text: "Is a Data Protection Officer or equivalent role assigned?",
    type: "binary",
    response: 0,
    isKiller: false,
  },

  // Organizational Policies (5 questions)
  {
    id: "OP-001",
    domain: "Organizational Policies",
    text: "Is there a documented information security policy?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "OP-002",
    domain: "Organizational Policies",
    text: "Is an access control policy documented and enforced?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "OP-003",
    domain: "Organizational Policies",
    text: "Is an incident response policy in place?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "OP-004",
    domain: "Organizational Policies",
    text: "Is a change management policy documented?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "OP-005",
    domain: "Organizational Policies",
    text: "Are policies reviewed and updated at least annually?",
    type: "binary",
    response: 0,
    isKiller: false,
  },

  // Physical Perimeter Security (5 questions)
  {
    id: "PPS-001",
    domain: "Physical Perimeter Security",
    text: "Is the data center/server room physically protected?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "PPS-002",
    domain: "Physical Perimeter Security",
    text: "Is access to server rooms logged and monitored?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "PPS-003",
    domain: "Physical Perimeter Security",
    text: "Are surveillance cameras deployed?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "PPS-004",
    domain: "Physical Perimeter Security",
    text: "Is badge/biometric access control implemented?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "PPS-005",
    domain: "Physical Perimeter Security",
    text: "Are environmental controls (HVAC, fire suppression) in place?",
    type: "binary",
    response: 0,
    isKiller: false,
  },

  // Endpoint Security (5 questions)
  {
    id: "ES-001",
    domain: "Endpoint Security",
    text: "Is anti-malware software deployed on all endpoints?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "ES-002",
    domain: "Endpoint Security",
    text: "Is EDR (Endpoint Detection and Response) deployed?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "ES-003",
    domain: "Endpoint Security",
    text: "Is full disk encryption enabled on all endpoints?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "ES-004",
    domain: "Endpoint Security",
    text: "Are antivirus updates automatic and tested?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "ES-005",
    domain: "Endpoint Security",
    text: "Is USB and removable media restricted or monitored?",
    type: "binary",
    response: 0,
    isKiller: false,
  },

  // IoT & OT Network (5 questions)
  {
    id: "IOT-001",
    domain: "IoT and OT Network",
    text: "Is there an inventory of all IoT/OT devices?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "IOT-002",
    domain: "IoT and OT Network",
    text: "Are IoT/OT devices segmented from IT networks?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "IOT-003",
    domain: "IoT and OT Network",
    text: "Are IoT/OT firmware updates managed and tested?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "IOT-004",
    domain: "IoT and OT Network",
    text: "Are default credentials changed on all IoT/OT devices?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "IOT-005",
    domain: "IoT and OT Network",
    text: "Is monitoring/anomaly detection enabled for IoT/OT networks?",
    type: "binary",
    response: 0,
    isKiller: false,
  },

  // Asset Management (5 questions)
  {
    id: "AM-001",
    domain: "Asset Management",
    text: "Is a comprehensive asset inventory maintained?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "AM-002",
    domain: "Asset Management",
    text: "Are assets classified by sensitivity level?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "AM-003",
    domain: "Asset Management",
    text: "Is asset disposal/decommissioning documented?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "AM-004",
    domain: "Asset Management",
    text: "Are asset audits performed at least annually?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "AM-005",
    domain: "Asset Management",
    text: "Is hardware lifecycle management documented?",
    type: "binary",
    response: 0,
    isKiller: false,
  },

  // Identity & Access Management (6 questions)
  {
    id: "IAM-001",
    domain: "Identity and Access Management",
    text: "Is Multi-Factor Authentication (MFA) enforced for all users?",
    type: "binary",
    response: 0,
    isKiller: true,
    defaultIsKiller: true,
  },
  {
    id: "IAM-002",
    domain: "Identity and Access Management",
    text: "Is Role-Based Access Control (RBAC) implemented?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "IAM-003",
    domain: "Identity and Access Management",
    text: "Are privileged accounts monitored and audited?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "IAM-004",
    domain: "Identity and Access Management",
    text: "Is password policy enforced (complexity, expiration)?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "IAM-005",
    domain: "Identity and Access Management",
    text: "Are inactive accounts disabled after 30 days?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "IAM-006",
    domain: "Identity and Access Management",
    text: "Is Privileged Access Management (PAM) deployed?",
    type: "binary",
    response: 0,
    isKiller: false,
  },

  // Vulnerability Assessment & Penetration Test (5 questions)
  {
    id: "VAPT-001",
    domain: "Vulnerability Assessment and Penetration Test",
    text: "Are vulnerability scans performed at least quarterly?",
    type: "frequency",
    response: 0,
    isKiller: false,
    options: [
      { label: "Never", value: 0 },
      { label: "Annually", value: 0.25 },
      { label: "Semi-annually", value: 0.5 },
      { label: "Quarterly", value: 0.75 },
      { label: "Monthly or more", value: 1 },
    ],
  },
  {
    id: "VAPT-002",
    domain: "Vulnerability Assessment and Penetration Test",
    text: "Is penetration testing performed annually?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "VAPT-003",
    domain: "Vulnerability Assessment and Penetration Test",
    text: "Is a vulnerability management program documented?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "VAPT-004",
    domain: "Vulnerability Assessment and Penetration Test",
    text: "Is a SLA for patching critical vulnerabilities defined?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "VAPT-005",
    domain: "Vulnerability Assessment and Penetration Test",
    text: "Are findings tracked and remediated with evidence?",
    type: "binary",
    response: 0,
    isKiller: false,
  },

  // Ransomware Supplemental (5 questions)
  {
    id: "RS-001",
    domain: "Ransomware Supplemental",
    text: "Is ransomware-specific training conducted?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "RS-002",
    domain: "Ransomware Supplemental",
    text: "Are backups air-gapped or immutable?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "RS-003",
    domain: "Ransomware Supplemental",
    text: "Is behavior-based threat detection deployed?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "RS-004",
    domain: "Ransomware Supplemental",
    text: "Is ransomware response plan documented and tested?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "RS-005",
    domain: "Ransomware Supplemental",
    text: "Are suspicious file executions monitored and blocked?",
    type: "binary",
    response: 0,
    isKiller: true,
    defaultIsKiller: true,
  },

  // Dark Web Exposure (5 questions)
  {
    id: "DWE-001",
    domain: "Dark Web Exposure",
    text: "Is dark web monitoring for compromised credentials active?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "DWE-002",
    domain: "Dark Web Exposure",
    text: "Is threat intelligence integrated into security operations?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "DWE-003",
    domain: "Dark Web Exposure",
    text: "Is a breach/incident response retainer in place?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "DWE-004",
    domain: "Dark Web Exposure",
    text: "Are social media/brand mentions monitored?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "DWE-005",
    domain: "Dark Web Exposure",
    text: "Is a crisis communication plan documented?",
    type: "binary",
    response: 0,
    isKiller: false,
  },

  // Change / Patch Cadence (5 questions)
  {
    id: "CPC-001",
    domain: "Change / Patch Cadence",
    text: "Is a formal patch management process documented?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "CPC-002",
    domain: "Change / Patch Cadence",
    text: "Are critical patches applied within 48 hours?",
    type: "binary",
    response: 0,
    isKiller: true,
    defaultIsKiller: true,
  },
  {
    id: "CPC-003",
    domain: "Change / Patch Cadence",
    text: "Is patch testing performed before production deployment?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "CPC-004",
    domain: "Change / Patch Cadence",
    text: "Is patch deployment tracked and audited?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "CPC-005",
    domain: "Change / Patch Cadence",
    text: "Is patch compliance monitored and reported?",
    type: "binary",
    response: 0,
    isKiller: false,
  },

  // DLP & DSPM (5 questions)
  {
    id: "DLP-001",
    domain: "DLP & DSPM",
    text: "Is Data Loss Prevention (DLP) software deployed?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "DLP-002",
    domain: "DLP & DSPM",
    text: "Is database activity monitoring (DAM) in place?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "DLP-003",
    domain: "DLP & DSPM",
    text: "Are data classification standards defined?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "DLP-004",
    domain: "DLP & DSPM",
    text: "Is cloud data security posture management (DSPM) implemented?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "DLP-005",
    domain: "DLP & DSPM",
    text: "Are sensitive data exports monitored and logged?",
    type: "binary",
    response: 0,
    isKiller: false,
  },

  // Active Directory Configuration (5 questions)
  {
    id: "ADC-001",
    domain: "Active Directory Configuration",
    text: "Is Active Directory hardening implemented?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "ADC-002",
    domain: "Active Directory Configuration",
    text: "Are inactive AD accounts disabled?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "ADC-003",
    domain: "Active Directory Configuration",
    text: "Is AD access monitored and audited?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "ADC-004",
    domain: "Active Directory Configuration",
    text: "Are nested group memberships audited?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "ADC-005",
    domain: "Active Directory Configuration",
    text: "Is AD schema/security group audit logging enabled?",
    type: "binary",
    response: 0,
    isKiller: false,
  },

  // Incident Management & Response (5 questions)
  {
    id: "IMR-001",
    domain: "Incident Management & Response",
    text: "Is an incident response team designated?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "IMR-002",
    domain: "Incident Management & Response",
    text: "Is incident response testing performed annually?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "IMR-003",
    domain: "Incident Management & Response",
    text: "Is forensic evidence collection documented?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "IMR-004",
    domain: "Incident Management & Response",
    text: "Is an escalation matrix defined?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "IMR-005",
    domain: "Incident Management & Response",
    text: "Are past incidents documented and lessons learned?",
    type: "binary",
    response: 0,
    isKiller: true,
    defaultIsKiller: true,
  },

  // SOC & SOAR Capabilities (5 questions)
  {
    id: "SOC-001",
    domain: "SOC & SOAR Capabilities",
    text: "Is a Security Operations Center (SOC) or equivalent in place?",
    type: "binary",
    response: 0,
    isKiller: true,
    defaultIsKiller: true,
  },
  {
    id: "SOC-002",
    domain: "SOC & SOAR Capabilities",
    text: "Is Security Information Event Management (SIEM) deployed?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "SOC-003",
    domain: "SOC & SOAR Capabilities",
    text: "Is log aggregation from all systems enabled?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "SOC-004",
    domain: "SOC & SOAR Capabilities",
    text: "Is SOAR (Security Orchestration) implemented?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
  {
    id: "SOC-005",
    domain: "SOC & SOAR Capabilities",
    text: "Are alerts monitored 24x7 or documented SLA?",
    type: "binary",
    response: 0,
    isKiller: false,
  },
]

export function getQuestionWeight(isKiller: boolean): number {
  return isKiller ? 3 : 1
}

export function getWeightedScore(baseScore: number, isKiller: boolean): number {
  return baseScore * getQuestionWeight(isKiller)
}

export function getMaxDomainScore(domain: Domain): number {
  return domain.questions.reduce((sum, q) => {
    return sum + getQuestionWeight(q.isKiller)
  }, 0)
}

export function getDomainScore(domain: Domain): { score: number; earned: number; max: number } {
  const earned = domain.questions.reduce((sum, q) => {
    return sum + getWeightedScore(q.response, q.isKiller)
  }, 0)

  const max = getMaxDomainScore(domain)

  if (max === 0) return { score: 0, earned: 0, max: 0 }

  return {
    score: (earned / max) * 100,
    earned,
    max,
  }
}

export function getOverallScore(domains: Domain[]): number {
  return domains.reduce((total, domain) => {
    const { score } = getDomainScore(domain)
    return total + score * (domain.weight / 100)
  }, 0)
}

export function checkAutoDecline(domains: Domain[]): { declined: boolean; failedKillers: string[] } {
  const failedKillers: string[] = []

  domains.forEach((domain) => {
    domain.questions.forEach((q) => {
      if (q.isKiller && q.response === 0) {
        failedKillers.push(`${q.id}: ${q.text}`)
      }
    })
  })

  return {
    declined: failedKillers.length >= 2,
    failedKillers,
  }
}

export function getRiskTier(score: number, autoDeclined: boolean): { tier: "A" | "B" | "C" | "D"; premium: string } {
  if (autoDeclined) {
    return { tier: "D", premium: "Declined" }
  }

  let riskTier: "A" | "B" | "C" | "D" = "D"
  if (score >= 90) riskTier = "A"
  else if (score >= 75) riskTier = "B"
  else if (score >= 60) riskTier = "C"
  else riskTier = "D"

  return { tier: riskTier, premium: getPremiumLoading(riskTier) }
}

function getPremiumLoading(riskTier: "A" | "B" | "C" | "D"): string {
  switch (riskTier) {
    case "A":
      return "Base Rate"
    case "B":
      return "+20%"
    case "C":
      return "+50%"
    case "D":
      return "Declined"
    default:
      return ""
  }
}

export function calculateScore(domains: Domain[]): ScoringResult {
  const domainScores: ScoringResult["domainScores"] = []
  let totalWeightedScore = 0
  let totalWeight = 0
  const failedKillers: Array<{ id: string; text: string }> = []

  for (const domain of domains) {
    let domainEarnedScore = 0
    let domainMaxScore = 0

    for (const question of domain.questions) {
      const questionWeight = question.isKiller ? 3 : 1
      const maxValue = question.maxValue ?? 1
      const clampedResponse = Math.min(question.response, maxValue)
      const questionEarnedScore = clampedResponse * questionWeight
      const questionMaxScore = maxValue * questionWeight

      domainEarnedScore += questionEarnedScore
      domainMaxScore += questionMaxScore

      // Track failed killers
      if (question.isKiller && question.response === 0) {
        failedKillers.push({ id: question.id, text: question.text })
      }
    }

    const domainScoreRatio = domainMaxScore > 0 ? domainEarnedScore / domainMaxScore : 0
    const weightedDomainScore = domainScoreRatio * domain.activeWeight

    domainScores.push({
      domain: domain.name,
      score: Math.round(domainScoreRatio * 100 * 100) / 100,
      defaultWeight: domain.defaultWeight,
      activeWeight: domain.activeWeight,
      contribution: Math.round(weightedDomainScore * 100) / 100,
      maxScore: domainMaxScore,
      earnedScore: Math.round(domainEarnedScore * 100) / 100,
    })

    totalWeightedScore += weightedDomainScore
    totalWeight += domain.activeWeight
  }

  const totalScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0
  const roundedScore = Math.min(Math.round(totalScore * 100) / 100, 100)

  const { tier, premium } = getRiskTier(roundedScore, failedKillers.length >= 2)

  const autoDeclined = failedKillers.length >= 2

  let declineNarrative = ""

  if (autoDeclined) {
    declineNarrative = `Auto-declined due to ${failedKillers.length} failed critical controls: ${failedKillers.map((k) => k.id).join(", ")}`
  } else {
    declineNarrative = getDeclineNarrative(tier, failedKillers)
  }

  return {
    totalScore: roundedScore,
    domainScores,
    riskTier: tier,
    premiumLoading: premium,
    autoDeclined,
    failedKillers,
    declineNarrative,
  }
}

function getDeclineNarrative(
  riskTier: "A" | "B" | "C" | "D",
  failedKillers: Array<{ id: string; text: string }>,
): string {
  switch (riskTier) {
    case "A":
      return `Strong cyber posture. Tier A assigned based on comprehensive controls across ${failedKillers.length} domains.`
    case "B":
      return `Good controls with minor gaps. Tier B assigned. ${failedKillers.length > 0 ? `Review ${failedKillers.length} weak controls.` : "Review recommendations."}`
    case "C":
      return `Moderate risk due to control gaps. Tier C assigned. ${failedKillers.length > 0 ? `Address ${failedKillers.length} failed controls.` : "Recommend security improvements."}`
    case "D":
      return `Tier D assigned due to significant control gaps.`
    default:
      return ""
  }
}

export const DOMAINS: Domain[] = [
  {
    id: "network_security",
    name: "Network Security",
    defaultWeight: 7,
    activeWeight: 7,
    questions: ALL_QUESTIONS.filter((q) => q.domain === "Network Security"),
  },
  {
    id: "data_backup_recovery",
    name: "Data Backup and Recovery",
    defaultWeight: 7,
    activeWeight: 7,
    questions: ALL_QUESTIONS.filter((q) => q.domain === "Data Backup and Recovery"),
  },
  {
    id: "certifications",
    name: "Certifications",
    defaultWeight: 4,
    activeWeight: 4,
    questions: ALL_QUESTIONS.filter((q) => q.domain === "Certifications"),
  },
  {
    id: "background_verification",
    name: "Background Verification and Awareness",
    defaultWeight: 4,
    activeWeight: 4,
    questions: ALL_QUESTIONS.filter((q) => q.domain === "Background Verification and Awareness"),
  },
  {
    id: "regulatory_compliance",
    name: "Regulatory Compliance",
    defaultWeight: 5,
    activeWeight: 5,
    questions: ALL_QUESTIONS.filter((q) => q.domain === "Regulatory Compliance"),
  },
  {
    id: "organizational_policies",
    name: "Organizational Policies",
    defaultWeight: 5,
    activeWeight: 5,
    questions: ALL_QUESTIONS.filter((q) => q.domain === "Organizational Policies"),
  },
  {
    id: "physical_security",
    name: "Physical Perimeter Security",
    defaultWeight: 7,
    activeWeight: 7,
    questions: ALL_QUESTIONS.filter((q) => q.domain === "Physical Perimeter Security"),
  },
  {
    id: "endpoint_security",
    name: "Endpoint Security",
    defaultWeight: 6,
    activeWeight: 6,
    questions: ALL_QUESTIONS.filter((q) => q.domain === "Endpoint Security"),
  },
  {
    id: "iot_ot",
    name: "IoT and OT Network",
    defaultWeight: 9,
    activeWeight: 9,
    questions: ALL_QUESTIONS.filter((q) => q.domain === "IoT and OT Network"),
  },
  {
    id: "asset_management",
    name: "Asset Management",
    defaultWeight: 6,
    activeWeight: 6,
    questions: ALL_QUESTIONS.filter((q) => q.domain === "Asset Management"),
  },
  {
    id: "iam",
    name: "Identity and Access Management",
    defaultWeight: 6,
    activeWeight: 6,
    questions: ALL_QUESTIONS.filter((q) => q.domain === "Identity and Access Management"),
  },
  {
    id: "vapt",
    name: "Vulnerability Assessment and Penetration Test",
    defaultWeight: 5,
    activeWeight: 5,
    questions: ALL_QUESTIONS.filter((q) => q.domain === "Vulnerability Assessment and Penetration Test"),
  },
  {
    id: "ransomware",
    name: "Ransomware Supplemental",
    defaultWeight: 5,
    activeWeight: 5,
    questions: ALL_QUESTIONS.filter((q) => q.domain === "Ransomware Supplemental"),
  },
  {
    id: "dark_web",
    name: "Dark Web Exposure",
    defaultWeight: 2,
    activeWeight: 2,
    questions: ALL_QUESTIONS.filter((q) => q.domain === "Dark Web Exposure"),
  },
  {
    id: "patch_cadence",
    name: "Change / Patch Cadence",
    defaultWeight: 5,
    activeWeight: 5,
    questions: ALL_QUESTIONS.filter((q) => q.domain === "Change / Patch Cadence"),
  },
  {
    id: "dlp_dspm",
    name: "DLP & DSPM",
    defaultWeight: 4,
    activeWeight: 4,
    questions: ALL_QUESTIONS.filter((q) => q.domain === "DLP & DSPM"),
  },
  {
    id: "active_directory",
    name: "Active Directory Configuration",
    defaultWeight: 3,
    activeWeight: 3,
    questions: ALL_QUESTIONS.filter((q) => q.domain === "Active Directory Configuration"),
  },
  {
    id: "incident_response",
    name: "Incident Management & Response",
    defaultWeight: 6,
    activeWeight: 6,
    questions: ALL_QUESTIONS.filter((q) => q.domain === "Incident Management & Response"),
  },
  {
    id: "soc_soar",
    name: "SOC & SOAR Capabilities",
    defaultWeight: 4,
    activeWeight: 4,
    questions: ALL_QUESTIONS.filter((q) => q.domain === "SOC & SOAR Capabilities"),
  },
]

export function getIndustryWeights(industry: IndustryProfile | null, domains: Domain[]): Domain[] {
  if (!industry) return domains
  return domains.map((domain) => ({
    ...domain,
    activeWeight: industry.domainWeights[domain.name] || domain.defaultWeight,
  }))
}
