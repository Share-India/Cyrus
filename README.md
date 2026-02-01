# CYRUS.PRO - Weighted Underwriting & Risk Assessment

A premium, enterprise-grade technical risk assessment and underwriting engine built with **Next.js 14**, **Supabase**, and **Framer Motion**.

![Application Screenshot](public/share-india-new.png)

## 🚀 Overview

CYRUS.PRO is designed to streamline the technical underwriting process for complex risk environments. It features a dynamic, multi-domain questionnaire with weighted scoring, real-time risk tiering, and comprehensive compliance auditing.

### Key Features
- **Dynamic Risk Engine**: 19+ domains with industry-specific weight mapping.
- **Protocol Compliance**: Automated scoring and "Killer Node" detection for critical failure points.
- **Cloud-Based Drafts**: Resume assessments seamlessly across any device.
- **Admin Command Center**: Detailed submission audits, role management, and export capabilities (Excel/PDF).
- **Premium UI**: Dark-mode optimized, high-fidelity interface with fluid micro-animations.

## 🛠️ Technical Stack
- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Framer Motion, Lucide React.
- **Backend/Auth**: Supabase (PostgreSQL, RLS, Auth).
- **Reporting**: ExcelJS, jsPDF for high-fidelity report generation.

## 🏁 Getting Started

### Prerequisites
- Node.js 18+
- Supabase Account

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/adityaladge/weightedunderwritingmodel.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## 📊 Database Setup
Run the `master_consolidated_setup.sql` script in your Supabase SQL Editor to initialize the schema, security policies, and seed data.

## 📄 License
Custom Proprietary License - All Rights Reserved.
