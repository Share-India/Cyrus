"use client"

import { getCurrentPremiumLoading } from "@/lib/scoring-engine"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useParams, useRouter } from "next/navigation"
import {
    ShieldCheck,
    ArrowLeft,
    Download,
    AlertCircle,
    Lock,
    Clock,
    User,
    CheckCircle2,
    XCircle,
    BarChart3,
    PieChart,
    ChevronRight,
    FileText,
    Zap,
    AlertTriangle,
    Scale,
    Activity,
    LayoutDashboard,
    Upload
} from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { downloadAssessmentReport } from "@/lib/report-generator"
import { downloadPDFSummary } from "@/lib/pdf-report-generator"
import { INDUSTRY_PROFILES } from "@/lib/scoring-engine"
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip as RechartsTooltip
} from 'recharts'

interface DetailedSubmission {
    id: string
    user_id: string
    industry_id: string
    total_score: number
    risk_tier: string
    premium_loading: string
    auto_declined: boolean
    created_at: string
    submission_data: {
        domains: Array<{
            id: string
            name: string
            activeWeight: number
            questions: Array<{
                id: string
                text: string
                response: number
                isKiller: boolean
            }>
        }>
        result: any
        clientName?: string
        selectedIndustry?: string
    }
    profiles: {
        email: string
    }
}

export default function SubmissionDetails() {
    const params = useParams()
    const router = useRouter()
    const [submission, setSubmission] = useState<DetailedSubmission | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [benchmarkData, setBenchmarkData] = useState<any[]>([])
    const [policyDoc, setPolicyDoc] = useState<{ file_name: string; file_path: string; uploaded_at: string; download_url?: string } | null>(null)
    const [auditDoc, setAuditDoc] = useState<{ file_name: string; file_path: string; uploaded_at: string; download_url?: string } | null>(null)
    const [isPolicyLoading, setIsPolicyLoading] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        const fetchDetails = async () => {
            // Fetch the assessment
            const { data: assessmentData, error: assessmentError } = await supabase
                .from('assessments')
                .select('*')
                .eq('id', params.id)
                .single()

            if (assessmentError) {
                console.error("Error fetching submission details:", assessmentError)
                setIsLoading(false)
                return
            }

            if (assessmentData) {
                // Fetch the associated profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('email, organization_name, name, industry, username')
                    .eq('id', assessmentData.user_id)
                    .single()

                // Combine the data
                const combinedData = {
                    ...assessmentData,
                    profiles: profileData || { email: 'Unknown' }
                }

                setSubmission(combinedData as any)

                // Fetch benchmark data (same industry)
                const { data: industryAssessments } = await supabase
                    .from('assessments')
                    .select('submission_data')
                    .eq('industry_id', assessmentData.industry_id)

                if (industryAssessments) {
                    const currentScores = (assessmentData.submission_data as any).result?.domainScores || []

                    // Calculate Industry Average
                    const domainAverages: Record<string, { total: number, count: number }> = {}
                    industryAssessments.forEach(ia => {
                        const scores = (ia.submission_data as any)?.result?.domainScores || []
                        scores.forEach((ds: any) => {
                            if (!domainAverages[ds.domain]) domainAverages[ds.domain] = { total: 0, count: 0 }
                            domainAverages[ds.domain].total += ds.score
                            domainAverages[ds.domain].count += 1
                        })
                    })

                    const benchmark = currentScores.map((cs: any) => ({
                        subject: cs.domain.split(' ').map((w: string) => w[0]).join(''),
                        fullName: cs.domain,
                        Current: cs.score,
                        IndustryAvg: Math.round(domainAverages[cs.domain].total / domainAverages[cs.domain].count),
                        fullMark: 100
                    }))
                    setBenchmarkData(benchmark)
                }
            }
            setIsLoading(false)
        }

        if (params.id) fetchDetails()
    }, [params.id, supabase])

    // Fetch policy and audit documents for this submission
    useEffect(() => {
        const fetchDocs = async () => {
            if (!submission) return
            setIsPolicyLoading(true)

            // Fetch all documents for this user/assessment
            const { data } = await supabase
                .from('policy_documents')
                .select('file_name, file_path, uploaded_at, document_type')
                .or(`assessment_id.eq.${params.id},user_id.eq.${submission.user_id}`)
                .order('uploaded_at', { ascending: false })

            if (data && data.length > 0) {
                // Organize by type (get the most recent of each)
                const policy = data.find(d => d.document_type === 'policy')
                const audit = data.find(d => d.document_type === 'audit_report')

                if (policy) {
                    const { data: signedData } = await supabase.storage
                        .from('policy-documents')
                        .createSignedUrl(policy.file_path, 3600)
                    setPolicyDoc({ ...policy, download_url: signedData?.signedUrl || undefined })
                }

                if (audit) {
                    const { data: signedData } = await supabase.storage
                        .from('policy-documents')
                        .createSignedUrl(audit.file_path, 3600)
                    setAuditDoc({ ...audit, download_url: signedData?.signedUrl || undefined })
                }
            }
            setIsPolicyLoading(false)
        }

        fetchDocs()
    }, [submission, params.id, supabase])

    const [isFinalizing, setIsFinalizing] = useState(false)
    const [isFinalized, setIsFinalized] = useState(false)

    if (isLoading) {

        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="w-12 h-12 text-si-navy animate-pulse" />
                    <span className="text-[10px] font-black text-si-navy/40 uppercase tracking-[0.4em]">Loading Assessment...</span>
                </div>
            </div>
        )
    }

    if (!submission) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="w-16 h-16 text-si-red mb-6 opacity-20" />
                <h1 className="text-2xl font-black text-si-navy font-outfit mb-4">Report Not Found</h1>
                <p className="text-slate-500 mb-8 max-w-md">The requested audit submission could not be retrieved from the archives.</p>
                <Link href="/admin/submissions" className="px-8 py-3 bg-si-navy text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>
            </div>
        )
    }

    const { submission_data } = submission
    const result = submission_data.result

    // Find failed killer questions
    const failedKillers = submission_data.domains.flatMap(d =>
        d.questions.filter(q => q.isKiller && q.response < 1)
    )

    return (
        <div className="min-h-screen bg-white font-inter text-slate-900 pb-40">
            {/* Header */}
            <header className="bg-si-navy border-b border-white/5 px-8 py-6 flex items-center justify-between sticky top-0 z-50 shadow-2xl">
                <div className="flex items-center gap-6">
                    <Link href="/admin/submissions" className="p-3 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 rounded-xl border border-white/10 transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="h-8 w-[1px] bg-white/10" />
                    <div>
                        <div className="flex items-center gap-2">
                            <FileText className="w-3 h-3 text-si-blue-primary" />
                            <span className="text-[10px] text-si-blue-primary font-black uppercase tracking-[0.3em]">Audit ID: {submission.id.substring(0, 8)}</span>
                        </div>
                        <span className="text-sm font-bold text-white font-outfit italic tracking-tight">Technical Risk Audit</span>
                    </div>

                </div>


                <div className="flex items-center gap-4">


                    {/* Finalize Protocol Button */}
                    <button
                        onClick={async () => {
                            if (isFinalizing) return;
                            setIsFinalizing(true);

                            // Simulate database update
                            await new Promise(resolve => setTimeout(resolve, 1500));

                            // Generate Rich HTML Email Table
                            const clientEmail = submission.profiles?.email || "";
                            const subject = `Cyber Insurance Audit Finalized - ${submission.id.substring(0, 8)}`;

                            // Domain Rows for HTML
                            const domainRows = submission_data.domains.map(d => {
                                const score = Math.round((d.questions.reduce((acc, q) => acc + q.response, 0) / d.questions.length) * 100);
                                const color = score >= 80 ? '#34d399' : score >= 50 ? '#fbbf24' : '#ef4444';
                                return `
                                    <tr>
                                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-family: sans-serif; font-size: 14px; font-weight: 600; color: #1e293b;">${d.name}</td>
                                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-family: sans-serif; font-size: 14px; font-weight: 700; color: ${color}; text-align: right;">${score}%</td>
                                    </tr>
                                `;
                            }).join('');

                            const htmlBody = `
                                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                                    
                                    <!-- Header -->
                                    <tr style="background-color: #1e293b;">
                                        <td style="padding: 30px; text-align: center;">
                                            <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; font-style: italic;">ASSESSMENT FINALIZED</h2>
                                            <p style="color: #94a3b8; margin: 10px 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px;">Audit ID: ${submission.id.substring(0, 8)}</p>
                                        </td>
                                    </tr>

                                    <!-- Main Content -->
                                    <tr>
                                        <td style="padding: 30px;">
                                            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #334155;">
                                                Dear Client,<br><br>
                                                Our team has finalized your insurance audit. Your verified risk profile and premium determination are detailed below.
                                            </p>

                                            <!-- Key Stats Grid -->
                                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                                                <tr>
                                                    <td width="33%" style="padding: 15px; background-color: #f1f5f9; border-radius: 8px; text-align: center;">
                                                        <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Risk Score</div>
                                                        <div style="font-size: 24px; font-weight: 900; color: #0f172a;">${submission.total_score}%</div>
                                                    </td>
                                                    <td width="2%" style="font-size: 0;">&nbsp;</td>
                                                    <td width="30%" style="padding: 15px; background-color: #f1f5f9; border-radius: 8px; text-align: center;">
                                                        <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Tier</div>
                                                        <div style="font-size: 24px; font-weight: 900; color: #0f172a;">${submission.risk_tier}</div>
                                                    </td>
                                                    <td width="2%" style="font-size: 0;">&nbsp;</td>
                                                    <td width="33%" style="padding: 15px; background-color: #f1f5f9; border-radius: 8px; text-align: center;">
                                                        <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Loading</div>
                                                        <div style="font-size: 24px; font-weight: 900; color: #0f172a;">${getCurrentPremiumLoading(submission.risk_tier)}</div>
                                                    </td>
                                                </tr>
                                            </table>

                                            <!-- Domain Breakdown -->
                                            <div style="font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Domain Performance</div>
                                            
                                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                                                ${domainRows}
                                            </table>
                                            
                                            ${submission.auto_declined ? `
                                            <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                                                <p style="color: #b91c1c; font-weight: 700; font-size: 12px; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">⚠️ CRITICAL: AUDIT FAILED</p>
                                                <p style="color: #7f1d1d; font-size: 13px; margin: 5px 0 0;">System Security Parameters were breached.</p>
                                            </div>
                                            ` : ''}

                                            <div style="text-align: center; margin-top: 40px; border-top: 1px solid #e2e8f0; pt: 20px;">
                                                <p style="font-size: 10px; color: #94a3b8; margin: 0 0 10px; line-height: 1.4;">
                                                    This communication is privileged and confidential. <strong>Share India Insurance Brokers Pvt. Ltd.</strong> is a licensed Direct Insurance Broker (IRDAI License No. 466). The risk assessment provided herein is based on the data submitted and is subject to final policy issuance terms.
                                                </p>
                                                <p style="font-size: 12px; color: #64748b; margin: 10px 0 0;">Underwriting Governance Team<br><strong>Share India Insurance Brokers</strong></p>
                                                <a href="https://shareindia.com" style="display: inline-block; margin-top: 5px; font-size: 11px; text-decoration: none; color: #2563eb;">shareindia.com</a>
                                            </div>
                                        </td>
                                    </tr>
                                </table>
                            `;

                            // Copy to clipboard as rich text
                            try {
                                const blob = new Blob([htmlBody], { type: 'text/html' });
                                const plainTextBlob = new Blob(["Risk Report Summary\n\nScore: " + submission.total_score], { type: 'text/plain' });

                                await navigator.clipboard.write([
                                    new ClipboardItem({
                                        'text/html': blob,
                                        'text/plain': plainTextBlob
                                    })
                                ]);

                                toast.success("Report copied to clipboard!", {
                                    description: "Paste (Ctrl+V) into the email body after your client opens.",
                                    duration: 5000,
                                });
                            } catch (err) {
                                console.error('Failed to copy html: ', err);
                                toast.error("Could not copy table automatically.");
                            }

                            // Trigger Gmail
                            const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(clientEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(">> PASTE REPORT TABLE HERE <<")}`;
                            window.open(gmailUrl, '_blank');

                            setIsFinalized(true);
                            setIsFinalizing(false);
                        }}
                        disabled={isFinalized || isFinalizing}
                        className={`group flex items-center gap-3 px-8 py-4 font-black text-[11px] uppercase tracking-[0.15em] rounded-2xl transition-all duration-500 shadow-xl ${isFinalized
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-si-blue-primary to-cyan-400 text-white hover:from-cyan-400 hover:to-si-blue-primary hover:shadow-cyan-400/40 hover:scale-[1.02] active:scale-[0.98]"
                            }`}
                    >
                        <span>{isFinalizing ? "Processing..." : isFinalized ? "Audit Finalized" : "Finalize Audit"}</span>
                        {!isFinalized && !isFinalizing && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                        {isFinalized && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </button>
                </div>
            </header>


            <main className="max-w-[1400px] mx-auto p-12">
                {/* Critical Failure Overlay (Killer Alert) */}
                <AnimatePresence>
                    {submission.auto_declined && (
                        <motion.div
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-si-red p-12 rounded-[48px] border-[6px] border-white shadow-2xl shadow-si-red/30 mb-12 relative overflow-hidden text-white"
                        >
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                                <div className="w-24 h-24 bg-white/20 rounded-[32px] flex items-center justify-center shrink-0 animate-pulse">
                                    <AlertTriangle className="w-12 h-12" />
                                </div>
                                <div>
                                    <h2 className="text-5xl font-black font-outfit tracking-tighter italic mb-4">AUDIT FAILED.</h2>
                                    <p className="text-xl font-medium text-white/80 max-w-2xl leading-relaxed">
                                        System detected <span className="text-white font-black underline underline-offset-8 decoration-white/30">{failedKillers.length} critical failures</span>.
                                        Critical security standards were not met, triggering an automatic decline of the assessment.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-3 md:ml-auto">
                                    {failedKillers.map(q => (
                                        <div key={q.id} className="px-4 py-2 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/20">
                                            {q.id} Failed
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-96 h-96 opacity-10 -mr-20 -mt-20">
                                <Zap className="w-full h-full" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Column: Data & Score */}
                    <div className="lg:col-span-8 space-y-12">
                        <div className="bg-slate-50 p-12 rounded-[56px] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-12 group transition-all hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-black text-si-blue-primary uppercase tracking-[0.4em] block">Compliance Rating</span>
                                    <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg ${submission.risk_tier === 'A' ? 'bg-emerald-500 text-white' :
                                        submission.risk_tier === 'B' ? 'bg-si-blue-primary text-white' :
                                            'bg-si-red text-white'
                                        }`}>
                                        Risk Tier {submission.risk_tier}
                                    </div>
                                </div>

                                <h1 className="text-[120px] font-black text-si-navy font-outfit tracking-tighter italic leading-none">
                                    {submission.total_score}<span className="text-si-blue-primary not-italic opacity-20">%</span>
                                </h1>
                            </div>

                            <div className="flex flex-col items-center md:items-end text-center md:text-right gap-6">
                                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm w-full md:w-auto">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Premium Loading</span>
                                    <span className="text-3xl font-black text-si-navy font-outfit italic tracking-tight">{getCurrentPremiumLoading(submission.risk_tier)}</span>
                                </div>
                                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm w-full md:w-auto">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Industry Group</span>
                                    <span className="text-sm font-black text-si-navy uppercase tracking-tighter">{submission.industry_id.replace(/_/g, ' ')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Radar Comparison Card */}
                        <div className="bg-si-navy p-12 rounded-[56px] shadow-2xl shadow-si-navy/20 relative overflow-hidden">
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                                <div className="flex-1 w-full relative">
                                    <div className="flex items-center gap-3 mb-8">
                                        <Activity className="w-5 h-5 text-si-blue-primary" />
                                        <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Multi-Vector Exposure Radar</h3>
                                    </div>
                                    <div className="h-[350px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={benchmarkData}>
                                                <PolarGrid stroke="#ffffff10" />
                                                <PolarAngleAxis
                                                    dataKey="subject"
                                                    tick={{ fill: '#ffffff40', fontSize: 10, fontWeight: 900 }}
                                                />
                                                <Radar
                                                    name="Current Audit"
                                                    dataKey="Current"
                                                    stroke="#2563eb"
                                                    fill="#2563eb"
                                                    fillOpacity={0.6}
                                                />
                                                <Radar
                                                    name="Industry Avg"
                                                    dataKey="IndustryAvg"
                                                    stroke="#94a3b8"
                                                    fill="#94a3b8"
                                                    fillOpacity={0.2}
                                                />
                                                <RechartsTooltip
                                                    contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', color: '#1e293b' }}
                                                />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-8 flex items-center justify-center gap-8">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-si-blue-primary rounded-full" />
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Client Risk</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-slate-500 rounded-full" />
                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Sector Benchmark</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full md:w-80 space-y-4">
                                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                                        <span className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] block mb-2">Industry Comparative</span>
                                        <p className="text-sm font-medium text-white/80 leading-relaxed">
                                            This audit is currently <span className="text-si-blue-primary font-black italic">
                                                {submission.total_score > (benchmarkData.reduce((acc, b) => acc + b.IndustryAvg, 0) / (benchmarkData.length || 1)) ? 'above' : 'below'} industry averages
                                            </span> in terms of overall cyber posture within the <span className="text-white font-bold">{submission.industry_id.replace(/_/g, ' ')}</span> sector.
                                        </p>
                                    </div>
                                    <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                                        <span className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] block mb-2">Key Exposure Area</span>
                                        <span className="text-white font-bold block mb-1">
                                            {benchmarkData.length > 0 ? benchmarkData.sort((a, b) => a.Current - b.Current)[0].fullName : 'N/A'}
                                        </span>
                                        <span className="text-[10px] text-si-red font-black uppercase">Critical Recommendation Needed</span>
                                    </div>
                                </div>
                            </div>
                            {/* Background Decoration */}
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-si-blue-primary/10 rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none" />
                        </div>

                        {/* Breakdown */}
                        <div className="space-y-8">
                            <h3 className="text-xs font-black text-si-navy/30 uppercase tracking-[0.5em] px-2 flex items-center gap-4">
                                <Scale className="w-4 h-4" /> Category breakdown
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {result.domainScores.map((ds: any, idx: number) => (
                                    <div key={idx} className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/20 hover:border-si-blue-primary transition-all group">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[10px] font-black text-slate-300 group-hover:bg-si-navy group-hover:text-white transition-all">
                                                {Math.round(ds.score)}%
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${ds.score >= 80 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-si-red'}`}>
                                                {Math.round(ds.score)}% Validated
                                            </div>
                                        </div>
                                        <h4 className="text-2xl font-black text-si-navy font-outfit italic tracking-tighter mb-6 leading-none">{ds.domain}</h4>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${ds.score}%` }}
                                                    transition={{ duration: 1.5, ease: "circOut" }}
                                                    className={`h-full rounded-full ${ds.score >= 80 ? 'bg-emerald-400' : ds.score >= 50 ? 'bg-si-blue-primary' : 'bg-si-red'}`}
                                                />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-300 uppercase w-12 text-right">W: {ds.activeWeight}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Audit Metadata */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-si-navy text-white p-12 rounded-[56px] shadow-2xl shadow-si-navy/30 relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-[11px] font-black text-si-blue-primary uppercase tracking-[0.4em] mb-12">Audit Details</h3>
                                <div className="space-y-12">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-si-blue-primary">
                                            <Clock className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1">Time Captured</span>
                                            <span className="text-lg font-black font-outfit">{new Date(submission.created_at).toLocaleDateString()}</span>
                                            <span className="text-[10px] font-bold text-white/20 block font-mono">{new Date(submission.created_at).toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-si-blue-primary">
                                            <User className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1">User Profile</span>
                                            <span className="text-sm font-bold block truncate max-w-[200px]">{(submission.profiles as any)?.name || (submission.profiles as any)?.username || submission.profiles?.email}</span>
                                            <span className="text-[10px] font-bold text-white/40 block truncate max-w-[200px]">{(submission.profiles as any)?.organization_name || 'No Organization'}</span>
                                            <span className="text-[10px] font-bold text-white/20 block font-mono">ID: {submission.user_id.substring(0, 12)}...</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-si-blue-primary">
                                            <LayoutDashboard className="w-7 h-7" />
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1">Sector / Industry</span>
                                            <span className="text-sm font-bold block uppercase tracking-tighter">{(submission.profiles as any)?.industry || submission.industry_id.replace(/_/g, ' ')}</span>
                                            <span className="text-[10px] font-bold text-white/20 block font-mono">CODE: {submission.industry_id}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-si-blue-primary">
                                            <Lock className="w-7 h-7" />
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1">Audit Standard</span>
                                            <span className="text-sm font-bold block uppercase tracking-tighter">Cyrus-Weight-Audit v2.0</span>
                                            <span className="text-[10px] font-bold text-emerald-400/50 block font-mono uppercase">Verified SHA-256</span>
                                        </div>
                                    </div>

                                    {/* IT/Cyber Security Policy Document */}
                                    <div className="flex items-start gap-6">
                                        <div className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-si-blue-primary shrink-0">
                                            <Upload className="w-7 h-7" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-2">IT / Cyber Security Policy</span>
                                            {isPolicyLoading ? (
                                                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest animate-pulse">Checking...</span>
                                            ) : policyDoc ? (
                                                <div className="space-y-2">
                                                    <span className="text-sm font-bold block truncate max-w-[200px]" title={policyDoc.file_name}>
                                                        {policyDoc.file_name}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-white/30 block">
                                                        {new Date(policyDoc.uploaded_at).toLocaleDateString()} {new Date(policyDoc.uploaded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {policyDoc.download_url ? (
                                                        <a
                                                            href={policyDoc.download_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 mt-1 px-4 py-2 bg-si-blue-primary/20 hover:bg-si-blue-primary/30 border border-si-blue-primary/30 rounded-xl text-[10px] font-black text-si-blue-primary uppercase tracking-widest transition-all"
                                                        >
                                                            <Download className="w-3 h-3" />
                                                            Download Policy
                                                        </a>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-white/20 uppercase">Generating link...</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-white/30 uppercase tracking-widest">
                                                    Not Uploaded
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Prior Audit Report */}
                                    <div className="flex items-start gap-6 border-t border-white/5 pt-6 mt-6">
                                        <div className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-si-blue-primary shrink-0">
                                            <FileText className="w-7 h-7" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-2">Prior Audit Report</span>
                                            {isPolicyLoading ? (
                                                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest animate-pulse">Checking...</span>
                                            ) : auditDoc ? (
                                                <div className="space-y-2">
                                                    <span className="text-sm font-bold block truncate max-w-[200px]" title={auditDoc.file_name}>
                                                        {auditDoc.file_name}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-white/30 block">
                                                        {new Date(auditDoc.uploaded_at).toLocaleDateString()} {new Date(auditDoc.uploaded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {auditDoc.download_url ? (
                                                        <a
                                                            href={auditDoc.download_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 mt-1 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-xl text-[10px] font-black text-emerald-400 uppercase tracking-widest transition-all"
                                                        >
                                                            <Download className="w-3 h-3" />
                                                            Download Report
                                                        </a>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-white/20 uppercase">Generating link...</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-white/30 uppercase tracking-widest">
                                                    Not Uploaded
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Export Manifest Section */}
                                <div className="mt-16 pt-12 border-t border-white/5 space-y-6">
                                    <h4 className="text-[10px] font-black text-si-blue-primary uppercase tracking-[0.4em]">Export Manifest</h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        {/* Excel Export */}
                                        <button
                                            onClick={() => {
                                                const industryName = INDUSTRY_PROFILES.find(p => p.id === submission.industry_id)?.name || submission.industry_id
                                                downloadAssessmentReport(
                                                    result,
                                                    submission_data.domains as any,
                                                    submission_data.clientName || submission.profiles?.email || 'Unknown Client',
                                                    industryName,
                                                    submission.profiles?.email || '',
                                                    submission.created_at,
                                                    submission.id
                                                )
                                            }}
                                            className="w-full group flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-si-blue-primary/20 rounded-xl flex items-center justify-center text-si-blue-primary">
                                                    <FileText className="w-5 h-5" />
                                                </div>
                                                <div className="text-left">
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest block">XLSX Audit</span>
                                                    <span className="text-[9px] text-white/40 font-bold uppercase tracking-tighter">Institutional Report</span>
                                                </div>
                                            </div>
                                            <Download className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                                        </button>

                                        {/* PDF Export */}
                                        <button
                                            onClick={() => {
                                                const industryName = INDUSTRY_PROFILES.find(p => p.id === submission.industry_id)?.name || submission.industry_id
                                                downloadPDFSummary(
                                                    result,
                                                    submission_data.domains as any,
                                                    submission_data.clientName || submission.profiles?.email || 'Unknown Client',
                                                    industryName,
                                                    submission.profiles?.email || '',
                                                    submission.created_at,
                                                    submission.id
                                                )
                                            }}
                                            className="w-full group flex items-center justify-between p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                                                    <Download className="w-5 h-5" />
                                                </div>
                                                <div className="text-left">
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest block">PDF Audit</span>
                                                    <span className="text-[9px] text-white/40 font-bold uppercase tracking-tighter">Risk Profile Summary</span>
                                                </div>
                                            </div>
                                            <Download className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -right-20 -bottom-20 opacity-5">
                                <ShieldCheck className="w-80 h-80 rotate-12" />
                            </div>
                        </div>


                        {/* Audit Log (Nodes) */}
                        <div className="bg-slate-50 p-12 rounded-[56px] border border-slate-100">
                            <h3 className="text-[11px] font-black text-si-navy/30 uppercase tracking-[0.4em] mb-8">Detailed Checklist Log</h3>
                            <div className="space-y-6 max-h-[1000px] overflow-y-auto pr-4 custom-scrollbar">
                                {submission_data.domains.flatMap(d => d.questions).map(q => (
                                    <div key={q.id} className={`p-6 rounded-3xl border transition-all group ${q.isKiller
                                        ? "bg-si-red/[0.02] border-si-red/20 shadow-sm shadow-si-red/5"
                                        : "bg-white border-slate-100"
                                        }`}>
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-[10px] font-black text-si-blue-primary font-mono">{q.id}</span>
                                            {q.isKiller && (
                                                <Zap className={`w-4 h-4 ${q.response < 1 ? 'text-si-red' : 'text-slate-200'}`} />
                                            )}
                                        </div>
                                        <p className="text-xs font-bold text-si-navy leading-relaxed mb-4">{q.text}</p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${q.response === 1 ? 'bg-emerald-400' : q.response > 0 ? 'bg-amber-400' : 'bg-si-red'}`} />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                    {q.response === 1 ? 'Pass' : q.response > 0 ? 'Partial' : 'Fail'}
                                                </span>
                                            </div>
                                            <span className={`text-xs font-black font-outfit italic ${q.isKiller ? "text-si-red" : "text-si-navy"}`}>
                                                {q.response.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
