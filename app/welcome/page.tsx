"use client"

import { ShieldCheck, ArrowRight, Play, FileText, BarChart3, Lock, User, Building2, Save, LogOut, CheckCircle2, AlertCircle, Globe, Settings as SettingsIcon, Shield, ExternalLink } from "lucide-react"
import Link from "next/link"
import { getDossier } from "@/lib/company-data"
import { useUnderwriting } from "@/context/underwriting-context"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { INDUSTRY_PROFILES } from "@/lib/scoring-engine"
import { motion, AnimatePresence } from "framer-motion"

export default function WelcomePage() {
    const {
        completionStats,
        clientName,
        organizationWebsite,
        userProfile,
        isAdmin,
        updateProfile,
        signOut,
        isLoading: contextLoading,
    } = useUnderwriting()

    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const [formData, setFormData] = useState({
        name: "",
        organization_name: "",
        industry: "",
        username: ""
    })

    useEffect(() => {
        if (userProfile) {
            setFormData({
                name: userProfile.name || "",
                organization_name: userProfile.organization_name || "",
                industry: userProfile.industry || "",
                username: userProfile.username || ""
            })
        }
    }, [userProfile])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setMessage(null)

        const result = await updateProfile(formData)

        if (result.success) {
            setMessage({ type: 'success', text: "Profile synchronization complete." })
            setTimeout(() => setMessage(null), 3000)
        } else {
            setMessage({ type: 'error', text: result.error || "failed_sync" })
        }
        setIsSaving(false)
    }



    return (
        <div className="min-h-screen bg-slate-50 font-inter text-slate-900 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <img src="/share-india-new.png" alt="Share India" className="h-9 w-auto" />
                    <div className="h-8 w-[1px] bg-slate-200" />
                    <div>
                        <h1 className="text-xl font-black text-si-navy font-outfit tracking-tight">CYRUS<span className="text-si-blue-primary">.PRO</span></h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Cyber Audit</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Authorized Access</p>
                    </div>
                    <Link
                        href="/settings"
                        className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-si-navy group"
                        title="Profile Settings"
                    >
                        <SettingsIcon className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                    </Link>
                    <button
                        onClick={signOut}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-si-red hover:border-si-red/30 transition-all active:scale-95"
                    >
                        Exit Session
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <main className="max-w-7xl mx-auto w-full p-8 md:p-16">
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center min-h-[70vh] py-16">
                    {/* Left Column: Core CTA */}
                    <div className="lg:col-span-7">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-si-blue-primary/10 rounded-full text-si-blue-primary font-bold text-xs uppercase tracking-widest mb-8">
                                <ShieldCheck className="w-4 h-4" />
                                <span>Audit Framework v2.0 Live</span>
                            </div>

                            <h1 className="text-5xl md:text-7xl font-black text-si-navy font-outfit tracking-tight mb-8 leading-tight">
                                Comprehensive <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-si-blue-primary to-si-blue-secondary">Cyber Risk Profiling</span>
                            </h1>

                            <p className="text-lg md:text-xl text-slate-600 max-w-xl leading-relaxed mb-10">
                                This audit assesses your organization's cybersecurity posture across 19 critical infrastructure domains. The output is a definitive risk tier rating and risk profiling evaluation.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-6 items-start">
                                <Link href="/assessment">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="group px-8 py-5 bg-si-navy text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-si-navy/20 flex items-center gap-4 hover:bg-si-blue-primary transition-colors"
                                    >
                                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                            <Play className="w-5 h-5 fill-current" />
                                        </div>
                                        <div className="text-left">
                                            <span className="block text-[10px] text-white/60 mb-1">
                                                {completionStats.percentage > 0 ? "RESUME SESSION" : "INITIALIZE AUDIT"}
                                            </span>
                                            <span className="text-lg">
                                                {completionStats.percentage > 0 ? "Continue Assessment" : "Begin Assessment"}
                                            </span>
                                        </div>
                                        <ArrowRight className="w-5 h-5 ml-4 group-hover:translate-x-1 transition-transform" />
                                    </motion.button>
                                </Link>

                                {completionStats.percentage > 0 && (
                                    <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                        <div className="relative w-12 h-12">
                                            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                <path
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    fill="none"
                                                    stroke="#E2E8F0"
                                                    strokeWidth="3"
                                                />
                                                <path
                                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                    fill="none"
                                                    stroke="#3B82F6"
                                                    strokeWidth="3"
                                                    strokeDasharray={`${completionStats.percentage}, 100`}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-si-navy">
                                                {completionStats.percentage}%
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-si-navy uppercase">Overall Progress</p>
                                            <p className="text-[10px] text-slate-500 font-medium">{completionStats.answered} / {completionStats.total} Answered</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Client Context Docket */}
                    <div className="lg:col-span-5">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="bg-si-navy text-white rounded-[48px] p-10 border border-white/5 shadow-2xl shadow-si-navy/40 relative overflow-hidden group"
                        >
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-12">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-si-blue-primary/20 rounded-xl flex items-center justify-center text-si-blue-primary border border-si-blue-primary/30">
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-si-blue-primary">Verified Node</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest block">System Status</span>
                                        <span className="text-[10px] text-emerald-400 font-black uppercase flex items-center gap-2 justify-end">
                                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                            Synchronized
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    {/* Dynamic Dossier Implementation */}
                                    {(() => {
                                        const dossier = userProfile?.company_dossier || getDossier(userProfile?.organization_name)

                                        if (dossier) {
                                            return (
                                                <>
                                                    <div>
                                                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-4">Organizational Legacy</span>
                                                        <div className="flex items-start gap-5">
                                                            <div className="w-16 h-16 bg-white/5 rounded-[24px] border border-white/10 flex items-center justify-center text-si-blue-primary group-hover:bg-si-blue-primary group-hover:text-white transition-all duration-500">
                                                                <Building2 className="w-8 h-8" />
                                                            </div>
                                                            <div>
                                                                <h2 className="text-2xl font-black font-outfit tracking-tight mb-1 italic">
                                                                    {dossier.name}
                                                                </h2>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-si-blue-primary" />
                                                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">
                                                                        {dossier.founded ? `Est. ${dossier.founded}` : 'Established Node'} • {dossier.hq || 'Global Reach'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 shadow-sm">
                                                            <span className="text-[8px] font-black text-white/30 uppercase tracking-wider block mb-2">Leadership</span>
                                                            <p className="text-[11px] font-bold text-white/70 truncate">{dossier.leadership || 'Verified Stakeholders'}</p>
                                                            <p className="text-[9px] text-white/40 mt-1 uppercase">Corporate Control</p>
                                                        </div>
                                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 shadow-sm">
                                                            <span className="text-[8px] font-black text-white/30 uppercase tracking-wider block mb-2">Capabilities</span>
                                                            <p className="text-[11px] font-bold text-white/70 truncate">{dossier.legacy || 'Strategic Influence'}</p>
                                                            <p className="text-[9px] text-white/40 mt-1 uppercase">Market Position</p>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-4">Core Portfolio</span>
                                                        <div className="space-y-3">
                                                            {(dossier.portfolio || ["Standardized Infrastructure", "Secure Network Ops"]).map((item: string, idx: number) => (
                                                                <div key={idx} className="flex items-center gap-3 text-white/60">
                                                                    <div className="w-1 h-1 rounded-full bg-si-blue-primary" />
                                                                    <span className="text-[10px] font-medium tracking-tight">{item}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-10 h-10 bg-si-blue-primary/10 rounded-xl flex items-center justify-center text-si-blue-primary border border-si-blue-primary/20">
                                                                <Globe className="w-5 h-5" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-[11px] font-medium text-white/60 leading-relaxed italic">
                                                                    "{dossier.description || 'Verified organizational profile being evaluated against the highest cybersecurity benchmarks.'}"
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {(dossier.website || organizationWebsite) && (
                                                            <a
                                                                href={dossier.website || organizationWebsite}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="ml-4 p-3 bg-white/5 hover:bg-si-blue-primary/20 rounded-xl border border-white/5 transition-colors group/link"
                                                                title="Visit Official Website"
                                                            >
                                                                <ExternalLink className="w-4 h-4 text-white/40 group-hover/link:text-si-blue-primary transition-colors" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </>
                                            )
                                        }

                                        /* Fallback for completely unknown future clients */
                                        return (
                                            <>
                                                <div className="space-y-10">
                                                    <div>
                                                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-4">Organizational Legacy</span>
                                                        <div className="flex items-start gap-5">
                                                            <div className="w-16 h-16 bg-white/5 rounded-[24px] border border-white/10 flex items-center justify-center text-si-blue-primary group-hover:bg-si-blue-primary group-hover:text-white transition-all duration-500">
                                                                <Building2 className="w-8 h-8" />
                                                            </div>
                                                            <div>
                                                                <h2 className="text-2xl font-black font-outfit tracking-tight mb-1 italic">
                                                                    {userProfile?.organization_name || "Unidentified Client"}
                                                                </h2>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-si-blue-primary" />
                                                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">
                                                                        Verified Node • {INDUSTRY_PROFILES.find(p => p.id === userProfile?.industry || p.name === userProfile?.industry)?.name || "General Risk Profile"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 shadow-sm">
                                                            <span className="text-[8px] font-black text-white/30 uppercase tracking-wider block mb-2">Leadership</span>
                                                            <p className="text-[11px] font-bold text-white/70 truncate">Authorized Signatory</p>
                                                            <p className="text-[9px] text-white/40 mt-1 uppercase">Corporate Control</p>
                                                        </div>
                                                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5 shadow-sm">
                                                            <span className="text-[8px] font-black text-white/30 uppercase tracking-wider block mb-2">Capabilities</span>
                                                            <p className="text-[11px] font-bold text-white/70 truncate">Tier 1 Infrastructure</p>
                                                            <p className="text-[9px] text-white/40 mt-1 uppercase">Market Position</p>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-4">Core Portfolio</span>
                                                        <div className="space-y-3">
                                                            {["Standardized Infrastructure", "Secure Network Ops", "Enterprise Data Integrity"].map((item: string, idx: number) => (
                                                                <div key={idx} className="flex items-center gap-3 text-white/60">
                                                                    <div className="w-1 h-1 rounded-full bg-si-blue-primary" />
                                                                    <span className="text-[10px] font-medium tracking-tight">{item}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-10 h-10 bg-si-blue-primary/10 rounded-xl flex items-center justify-center text-si-blue-primary border border-si-blue-primary/20">
                                                                <Globe className="w-5 h-5" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-[11px] font-medium text-white/60 leading-relaxed italic">
                                                                    "Verified organizational profile being evaluated against the highest cybersecurity benchmarks for {userProfile?.organization_name || 'this entity'}."
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {(userProfile?.organization_website || organizationWebsite) && (
                                                            <a
                                                                href={userProfile?.organization_website || organizationWebsite}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="ml-4 p-3 bg-white/5 hover:bg-si-blue-primary/20 rounded-xl border border-white/5 transition-colors group/link"
                                                                title="Visit Official Website"
                                                            >
                                                                <ExternalLink className="w-4 h-4 text-white/40 group-hover/link:text-si-blue-primary transition-colors" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        )
                                    })()}
                                </div>
                            </div>

                            {/* Decorative Background Elements */}
                            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-si-blue-primary/5 rounded-full blur-[100px] -mr-40 -mt-20 pointer-events-none" />
                            <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-si-blue-primary/10 rounded-full blur-[80px] opacity-20 pointer-events-none" />
                        </motion.div>
                    </div>
                </section>


                {/* Features Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-32 border-t border-slate-200 pt-16"
                >
                    <div className="space-y-4">
                        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-2">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h3 className="font-outfit font-bold text-lg text-si-navy">Industry Standard</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Aligned with global cybersecurity frameworks (NIST, ISO 27001) for accurate risk benchmarking.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-2">
                            <Lock className="w-6 h-6" />
                        </div>
                        <h3 className="font-outfit font-bold text-lg text-si-navy">Secure & Confidential</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Your assessment data is processed locally and formatted for direct underwriting submission.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-2">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <h3 className="font-outfit font-bold text-lg text-si-navy">Instant Analytics</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Get immediate feedback on risk drivers, control gaps, and risk profiling results.
                        </p>
                    </div>
                </motion.div>
            </main>
        </div>
    )
}
