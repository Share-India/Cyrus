"use client"

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
    Activity
} from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { downloadAssessmentReport } from "@/lib/report-generator"
import { INDUSTRY_PROFILES } from "@/lib/scoring-engine"

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
                    .select('email')
                    .eq('id', assessmentData.user_id)
                    .single()

                // Combine the data
                const combinedData = {
                    ...assessmentData,
                    profiles: profileData || { email: 'Unknown' }
                }

                setSubmission(combinedData as any)
            }
            setIsLoading(false)
        }

        if (params.id) fetchDetails()
    }, [params.id, supabase])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="w-12 h-12 text-si-navy animate-pulse" />
                    <span className="text-[10px] font-black text-si-navy/40 uppercase tracking-[0.4em]">Decrypting Ledger...</span>
                </div>
            </div>
        )
    }

    if (!submission) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="w-16 h-16 text-si-red mb-6 opacity-20" />
                <h1 className="text-2xl font-black text-si-navy font-outfit mb-4">Report Not Found</h1>
                <p className="text-slate-500 mb-8 max-w-md">The requested risk protocol submission could not be retrieved from the archives.</p>
                <Link href="/admin/submissions" className="px-8 py-3 bg-si-navy text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl">
                    Back to Terminal
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
                            <span className="text-[10px] text-si-blue-primary font-black uppercase tracking-[0.3em]">Protocol Code: {submission.id.substring(0, 8)}</span>
                        </div>
                        <span className="text-sm font-bold text-white font-outfit italic tracking-tight">Risk Profile Audit: {submission.profiles?.email}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {/* Excel Export Button */}
                    <button
                        onClick={() => {
                            const industryName = INDUSTRY_PROFILES.find(p => p.id === submission.industry_id)?.name || submission.industry_id
                            downloadAssessmentReport(
                                result,
                                submission_data.domains as any,
                                submission_data.clientName || submission.profiles?.email || 'Unknown Client',
                                industryName
                            )
                        }}
                        className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl px-6 py-4 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-4">
                            {/* Share India Logo */}
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-all">
                                <img src="/share-india-new.png" alt="Share India" className="h-6 w-auto brightness-0 invert" />
                            </div>

                            {/* Client Details */}
                            <div className="flex flex-col items-start text-left min-w-[280px]">
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText className="w-3 h-3 text-si-blue-primary" />
                                    <span className="text-[9px] font-black text-si-blue-primary uppercase tracking-[0.2em]">Excel Report</span>
                                </div>
                                <span className="text-sm font-bold text-white mb-0.5 truncate max-w-[260px]">
                                    {submission_data.clientName || submission.profiles?.email}
                                </span>
                                <div className="flex items-center gap-3 text-[10px] text-white/40">
                                    <span className="font-medium">{INDUSTRY_PROFILES.find(p => p.id === submission.industry_id)?.name || submission.industry_id.replace(/_/g, ' ')}</span>
                                    <span>•</span>
                                    <span className="font-bold text-white/60">{submission.total_score}%</span>
                                    <span>•</span>
                                    <span>{new Date(submission.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Download Icon */}
                            <div className="ml-2 w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-si-blue-primary group-hover:scale-110 transition-all">
                                <Download className="w-4 h-4 text-white/60 group-hover:text-white" />
                            </div>
                        </div>
                    </button>

                    {/* PDF Export Button */}
                    <button
                        onClick={() => window.print()}
                        className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl px-6 py-4 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-4">
                            {/* Share India Logo */}
                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-all">
                                <img src="/share-india-new.png" alt="Share India" className="h-6 w-auto brightness-0 invert" />
                            </div>

                            {/* Client Details */}
                            <div className="flex flex-col items-start text-left min-w-[280px]">
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText className="w-3 h-3 text-emerald-400" />
                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em]">PDF Audit</span>
                                </div>
                                <span className="text-sm font-bold text-white mb-0.5 truncate max-w-[260px]">
                                    {submission_data.clientName || submission.profiles?.email}
                                </span>
                                <div className="flex items-center gap-3 text-[10px] text-white/40">
                                    <span className="font-medium">{INDUSTRY_PROFILES.find(p => p.id === submission.industry_id)?.name || submission.industry_id.replace(/_/g, ' ')}</span>
                                    <span>•</span>
                                    <span className="font-bold text-white/60">Tier {submission.risk_tier}</span>
                                    <span>•</span>
                                    <span>{new Date(submission.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Download Icon */}
                            <div className="ml-2 w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center group-hover:bg-emerald-400 group-hover:scale-110 transition-all">
                                <Download className="w-4 h-4 text-white/60 group-hover:text-white" />
                            </div>
                        </div>
                    </button>

                    {/* Risk Tier Badge */}
                    <div className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${submission.risk_tier === 'A' ? 'bg-emerald-500 text-white' :
                        submission.risk_tier === 'B' ? 'bg-si-blue-primary text-white' :
                            'bg-si-red text-white'
                        }`}>
                        Risk Tier {submission.risk_tier}
                    </div>
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
                                    <h2 className="text-5xl font-black font-outfit tracking-tighter italic mb-4">PROTOCOL FAILED.</h2>
                                    <p className="text-xl font-medium text-white/80 max-w-2xl leading-relaxed">
                                        System detected <span className="text-white font-black underline underline-offset-8 decoration-white/30">{failedKillers.length} critical node failures</span>.
                                        Operational security parameters were breached, triggering an irreversible auto-decline state.
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
                                <span className="text-[10px] font-black text-si-blue-primary uppercase tracking-[0.4em] block mb-4">Compliance Rating</span>
                                <h1 className="text-[120px] font-black text-si-navy font-outfit tracking-tighter italic leading-none">
                                    {submission.total_score}<span className="text-si-blue-primary not-italic opacity-20">%</span>
                                </h1>
                            </div>
                            <div className="flex flex-col items-center md:items-end text-center md:text-right gap-6">
                                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm w-full md:w-auto">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Premium Loading</span>
                                    <span className="text-3xl font-black text-si-navy font-outfit italic tracking-tight">{submission.premium_loading}</span>
                                </div>
                                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm w-full md:w-auto">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Industry Group</span>
                                    <span className="text-sm font-black text-si-navy uppercase tracking-tighter">{submission.industry_id.replace(/_/g, ' ')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Breakdown */}
                        <div className="space-y-8">
                            <h3 className="text-xs font-black text-si-navy/30 uppercase tracking-[0.5em] px-2 flex items-center gap-4">
                                <Scale className="w-4 h-4" /> Structural breakdown
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {result.domainScores.map((ds: any, idx: number) => (
                                    <div key={idx} className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/20 hover:border-si-blue-primary transition-all group">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[10px] font-black text-slate-300 group-hover:bg-si-navy group-hover:text-white transition-all">
                                                {String(idx + 1).padStart(2, '0')}
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
                                <h3 className="text-[11px] font-black text-si-blue-primary uppercase tracking-[0.4em] mb-12">Audit Provenance</h3>
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
                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1">Origin Node</span>
                                            <span className="text-sm font-bold block truncate max-w-[200px]">{submission.profiles?.email}</span>
                                            <span className="text-[10px] font-bold text-white/20 block font-mono">ID: {submission.user_id.substring(0, 12)}...</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-si-blue-primary">
                                            <Lock className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-1">Audit Standard</span>
                                            <span className="text-sm font-bold block uppercase tracking-tighter">Cyrus-Weight-Audit v2.0</span>
                                            <span className="text-[10px] font-bold text-emerald-400/50 block font-mono uppercase">Verified SHA-256</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -right-20 -bottom-20 opacity-5">
                                <ShieldCheck className="w-80 h-80 rotate-12" />
                            </div>
                        </div>

                        {/* Audit Log (Nodes) */}
                        <div className="bg-slate-50 p-12 rounded-[56px] border border-slate-100">
                            <h3 className="text-[11px] font-black text-si-navy/30 uppercase tracking-[0.4em] mb-8">Node Audit Log</h3>
                            <div className="space-y-6 max-h-[1000px] overflow-y-auto pr-4 custom-scrollbar">
                                {submission_data.domains.flatMap(d => d.questions).map(q => (
                                    <div key={q.id} className="p-6 bg-white rounded-3xl border border-slate-100 group">
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
                                            <span className="text-xs font-black font-outfit text-si-navy italic">{q.response.toFixed(2)}</span>
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
