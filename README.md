# CYRUS.PRO — Weighted Underwriting & Risk Assessment

> An enterprise-grade cyber risk underwriting engine with AI-powered organization intelligence, dynamic multi-domain scoring, and high-fidelity reporting.

Built with **Next.js 16**, **React 19**, **Supabase**, **Gemini AI**, and **Framer Motion**.

---

## 🚀 Overview

CYRUS.PRO is designed for technical underwriters and risk analysts handling complex cyber insurance assessments. It combines a weighted, multi-domain questionnaire engine with a Gemini-powered intelligence dossier system — giving underwriters a complete picture of any organization's risk profile before a single question is answered.

---

## ✨ Features

### 🤖 AI-Powered Organization Intelligence (Dossier)
- Generates a **real-time Client Context Docket** for any organization using **Gemini 2.0 Flash** with **Google Search grounding**
- Synthesizes: company overview, leadership, revenue streams, key milestones, digital asset inventory, supply chain exposure, regulatory environment, and a tailored **cyber threat narrative**
- Produces **5 quantified cyber risk vectors** (0–100 scores) with actional underwriting reasoning
- Zero manual research required — the AI agent handles all data synthesis independently

### 📋 Dynamic Risk Questionnaire Engine
- **19+ risk domains** with industry-specific weight mapping
- Weighted scoring engine with real-time score computation
- **"Killer Node" detection** — flags critical failure points that automatically tier the risk
- Per-domain progress tracking and adaptive question flow

### ☁️ Cloud-Based Draft System
- Save and resume assessments seamlessly across devices
- Supabase-backed persistent storage with Row Level Security (RLS)
- Automatic draft recovery on session restore (12s timeout + retry logic)

### 🧑‍💼 Admin Command Center
- Full submission audit trail with role-based access
- **Excel & PDF export** of individual and aggregate assessment reports
- Industry analytics and trend dashboards (Recharts)
- User role management and submission review queue

### 🎨 Premium UI/UX
- Dark-mode optimized, high-fidelity interface
- Fluid micro-animations via **Framer Motion**
- Full **Radix UI** component suite with accessibility built-in
- OTP-based auth flows, reset password, onboarding tour

---

## 🛠️ Technical Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **UI** | React 19, Tailwind CSS v4, Radix UI, Framer Motion |
| **AI** | Google Gemini 2.0 Flash (`@google/generative-ai`) with Google Search grounding |
| **Backend / Auth** | Supabase (PostgreSQL, RLS, Supabase Auth, SSR) |
| **Forms** | React Hook Form + Zod |
| **Reporting** | jsPDF + jsPDF-AutoTable, ExcelJS / xlsx |
| **Charts** | Recharts |
| **Automation** | n8n (Asynchronous Workflow Engine) |
| **Containerization**| Docker & Docker Compose |
| **OSINT** | Shodan API |

---

├── infrastructure/             # Automation & Docker configuration
│   ├── n8n/                    # n8n custom data and workflows
│   ├── start-automation.sh     # One-click docker startup script
│   └── *_workflow.json         # n8n workflow export files
├── docker-compose.yml          # Full stack containerization
├── Dockerfile                  # Next.js production build config
├── components/                 # Shared UI components
├── context/                    # React context (underwriting state)
├── lib/
│   ├── dossier-builder.ts      # Gemini AI dossier generation logic
│   └── company-data.ts         # CompanyDossier type definitions
├── hooks/                      # Custom React hooks
├── scripts/
│   └── seed_model_v2.ts        # Database seeding script
└── styles/
    └── globals.css
```

---

## 🛠️ Infrastructure & Automation

CYRUS.PRO uses a self-hosted **n8n** automation engine to offload heavy AI processing and OSINT research. This ensures the frontend remains highly responsive even during complex risk synthesis.

### 🐳 Docker Deployment
The entire stack (Next.js, n8n, PostgreSQL) is containerized for consistent deployment.

```bash
# Start the full automation stack
sh infrastructure/start-automation.sh
```

### 🤖 n8n Workflows
- **CYRUS - Dossier Generation**: Triggers on new client onboarding; uses Shodan and Gemini to build intelligence profiles.
- **CYRUS - AI Policy Analysis**: Triggered from the Admin panel; scans policy documents for risk vectors.
- **CYRUS - Master Document Management**: Generates final Executive Master Dockets and stores them in Supabase.

---

## 🏁 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com) API key (for Gemini)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/adityaladge/weightedunderwritingmodel.git
cd weightedunderwritingmodel

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.local.example .env.local
# Edit .env.local with your actual keys (see below)

# 4. Start the development server
npm run dev
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini AI (for dossier generation)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
```

### Database Setup

Run the `master_consolidated_setup.sql` script in your Supabase SQL Editor to initialize the schema, Row Level Security policies, and seed data.

To seed the underwriting model data:
```bash
npm run seed
```

---

## 🔌 API Reference

| `/api/generate-dossier` | `POST` | Trigger AI dossier generation (n8n) |
| `/api/analyze-policy` | `POST` | Trigger document risk analysis (n8n) |
| `/api/assessments` | `GET/POST` | List / create assessments |
| `/api/excel` | `POST` | Export assessment as Excel report |
| `/api/intelligence` | `GET` | Retrieve risk intelligence data |
| `/api/industries` | `GET` | List available industries |
| `/api/health` | `GET` | Health check |

---

## 📄 License

Custom Proprietary License — All Rights Reserved. © Share India Group.
