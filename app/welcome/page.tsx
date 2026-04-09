"use client"

import { ShieldCheck, ArrowRight, Play, FileText, BarChart3, Lock, User, Building2, Save, LogOut, CheckCircle2, AlertCircle, Globe, Settings as SettingsIcon, Shield, ExternalLink, Loader2 } from "lucide-react"
import Link from "next/link"
import { getDossier, CompanyDossier } from "@/lib/company-data"
import { useUnderwriting } from "@/context/underwriting-context"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { INDUSTRY_PROFILES } from "@/lib/scoring-engine"
import { motion, AnimatePresence } from "framer-motion"
import { siteConfig } from "@/lib/site-config"

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

    const [showDossierModal, setShowDossierModal] = useState(false)
    const [hasSeenModal, setHasSeenModal] = useState(false)
    const [dossier, setDossier] = useState<CompanyDossier | null>(null)
    const [isDossierLoading, setIsDossierLoading] = useState(false)
    const [dossierError, setDossierError] = useState<string | null>(null)

    // Fetch dossier dynamically via Gemini + Google Search when profile is available
    useEffect(() => {
        if (!contextLoading && userProfile && !hasSeenModal) {
            const orgName = userProfile.organization_name
            const websiteUrl = userProfile.organization_website || userProfile.website || ""
            const localCacheKey = `cyrus_cached_dossier_${userProfile.id}`

            // 1. Bypass static hardcoded dossiers and immediately check cache or call API

            // 2. Check LocalStorage Cache to save API Tokens
            const cachedData = localStorage.getItem(localCacheKey)
            if (cachedData) {
                try {
                    const parsedCache = JSON.parse(cachedData)
                    if (parsedCache && parsedCache.name) {
                        setDossier(parsedCache)
                        setShowDossierModal(true)
                        return
                    }
                } catch (e) {
                    console.error("Failed to parse cached dossier", e)
                }
            }

            // 3. Unknown org + No Cache → Call Gemini & Shodan API
            setIsDossierLoading(true)
            setShowDossierModal(true)

            fetch("/api/generate-dossier", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ organizationName: orgName, websiteUrl })
            })
                .then(res => {
                    if (!res.ok) throw new Error("Generation failed")
                    return res.json()
                })
                .then((data: CompanyDossier) => {
                    setDossier(data)
                    // We DO NOT save to localStorage here, we wait for user confirmation
                })
                .catch(err => {
                    console.error("[Dossier Fetch Error]", err)
                    setDossierError("Intelligence synthesis failed. Please try again.")
                })
                .finally(() => setIsDossierLoading(false))
        }
    }, [contextLoading, userProfile, hasSeenModal])

    const handleConfirmDossier = () => {
        // Only trigger cache save when the user explicitly confirms the intel is correct
        if (dossier && userProfile?.id) {
            const localCacheKey = `cyrus_cached_dossier_${userProfile.id}`
            localStorage.setItem(localCacheKey, JSON.stringify(dossier))
        }
        setShowDossierModal(false)
        setHasSeenModal(true)
    }



    return (
        <div className="min-h-screen bg-slate-50 font-inter text-slate-900 flex flex-col">
            <AnimatePresence>
                {showDossierModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-[32px] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
                        >
                            <div className="p-10 md:p-14">
                                {/* Loading State — Gemini synthesizing */}
                                {isDossierLoading && (
                                    <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
                                        <div className="relative w-20 h-20">
                                            <div className="absolute inset-0 rounded-full border-4 border-si-blue-primary/20 animate-pulse" />
                                            <div className="absolute inset-2 rounded-full border-4 border-t-si-blue-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Shield className="w-7 h-7 text-si-blue-primary" />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-si-navy font-outfit tracking-tight">Synthesizing Intelligence</h3>
                                            <p className="text-sm text-slate-500 font-medium mt-2 max-w-sm mx-auto">CYRUS.PRO is searching the web and performing OSINT scans to analyze your organization&apos;s digital risk profile. This may take 15–30 seconds.</p>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-si-blue-primary bg-si-blue-primary/10 px-4 py-2 rounded-full border border-si-blue-primary/20">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            Powered by Gemini + Google Search + Shodan
                                        </div>
                                    </div>
                                )}

                                {/* Error State */}
                                {!isDossierLoading && dossierError && (
                                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                                        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center">
                                            <AlertCircle className="w-8 h-8 text-rose-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-si-navy font-outfit">Synthesis Interrupted</h3>
                                            <p className="text-sm text-slate-500 mt-1">{dossierError}</p>
                                        </div>
                                        <button onClick={handleConfirmDossier} className="mt-2 px-6 py-2.5 bg-si-blue-primary text-white text-sm font-bold rounded-full hover:bg-si-navy transition-colors">
                                            Continue without Dossier
                                        </button>
                                    </div>
                                )}

                                {/* Dossier Content — only shown once loaded */}
                                {!isDossierLoading && !dossierError && (<>
                                {/* Modal Header */}
                                <div className="flex items-start gap-4 mb-8">
                                    <div className="w-14 h-14 bg-si-blue-primary/10 rounded-2xl flex items-center justify-center text-si-blue-primary flex-shrink-0 mt-1">
                                        <Building2 className="w-7 h-7" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black font-outfit text-si-navy tracking-tight leading-tight">Organization Intelligence Dossier</h2>
                                        <p className="text-sm text-slate-500 font-medium mt-1">Comprehensive profile compiled from verified sources. Please confirm before proceeding to your cyber risk assessment.</p>
                                    </div>
                                </div>

                                <div className="space-y-6">

                                    {/* 1. ENTITY IDENTITY */}
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">① Verified Entity</span>
                                        <h3 className="text-2xl font-black text-si-navy font-outfit mb-3">{dossier?.name || userProfile?.organization_name || "Unidentified Organization"}</h3>
                                        <div className="flex flex-wrap items-center gap-2 mb-4">
                                            {dossier?.hq && (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-full border border-slate-200">
                                                    <Globe className="w-3 h-3 text-si-blue-primary" /> {dossier.hq}
                                                </span>
                                            )}
                                            {dossier?.founded && (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-full border border-slate-200">
                                                    📅 Est. {dossier.founded}
                                                </span>
                                            )}
                                            {dossier?.employees && (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-full border border-slate-200">
                                                    👥 {dossier.employees}
                                                </span>
                                            )}
                                            {dossier?.annualRevenue && (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white px-3 py-1.5 rounded-full border border-slate-200">
                                                    💰 {dossier.annualRevenue}
                                                </span>
                                            )}
                                            {dossier?.website && !dossier.website.toLowerCase().includes("n/a") && (
                                                <a href={dossier.website.startsWith('http') ? dossier.website : `https://${dossier.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-si-blue-primary bg-si-blue-primary/10 px-3 py-1.5 rounded-full border border-si-blue-primary/20 hover:bg-si-blue-primary/20 transition-colors">
                                                    <ExternalLink className="w-3 h-3" /> {dossier.website.replace(/https?:\/\//, '')}
                                                </a>
                                            )}
                                            {dossier?.shodanIntelligence && (
                                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200" title="Technical OSINT performed via Shodan">
                                                    <ShieldCheck className="w-3 h-3" /> Shodan OSINT Verified
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-700 leading-relaxed">{dossier?.description}</p>
                                    </div>

                                    {/* 2. LEADERSHIP & LEGACY */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">② Leadership & Control</span>
                                            <p className="text-sm font-bold text-slate-800 leading-relaxed">{dossier?.leadership || "Authorized Signatory"}</p>
                                        </div>
                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Track Record & Legacy</span>
                                            <p className="text-sm text-slate-700 leading-relaxed">{dossier?.legacy || "Tier 1 Capabilities"}</p>
                                        </div>
                                    </div>

                                    {/* 3. BUSINESS MODEL */}
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">③ Business Model & Operational Scale</span>
                                        <p className="text-sm text-slate-700 leading-relaxed font-medium">{dossier?.businessModel || "Critical operator within the supply chain network."}</p>
                                    </div>

                                    {/* 4. REVENUE STREAMS */}
                                    {Array.isArray(dossier?.revenueStreams) && dossier.revenueStreams.length > 0 && (
                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">④ Revenue Streams</span>
                                            <div className="space-y-3">
                                                {dossier.revenueStreams.map((stream: {label: string; description: string}, idx: number) => (
                                                    <div key={idx} className="bg-white rounded-xl p-4 border border-slate-200">
                                                        <p className="text-xs font-black text-si-navy uppercase tracking-wide mb-1">{stream.label}</p>
                                                        <p className="text-xs text-slate-600 leading-relaxed">{stream.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 5. INDUSTRIES SERVED + NOTABLE CLIENTS */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {Array.isArray(dossier?.industriesServed) && dossier.industriesServed.length > 0 && (
                                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">⑤ Industries Served</span>
                                                <div className="flex flex-wrap gap-2">
                                                    {dossier.industriesServed.map((ind: string, idx: number) => (
                                                        <span key={idx} className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg">{ind}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {Array.isArray(dossier?.notableClients) && dossier.notableClients.length > 0 && (
                                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Notable Clients</span>
                                                <div className="space-y-2">
                                                    {dossier.notableClients.map((client: string, idx: number) => (
                                                        <div key={idx} className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-si-blue-primary flex-shrink-0" />
                                                            <span className="text-xs font-semibold text-slate-700">{client}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* 6. OPERATIONAL REACH */}
                                    {Array.isArray(dossier?.operationalReach) && dossier.operationalReach.length > 0 && (
                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">⑥ Operational Geographic Reach</span>
                                            <div className="flex flex-wrap gap-2">
                                                {dossier.operationalReach.map((loc: string, idx: number) => (
                                                    <span key={idx} className="text-[10px] font-semibold text-si-blue-primary bg-si-blue-primary/10 border border-si-blue-primary/20 px-2.5 py-1 rounded-lg">{loc}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 7. KEY MILESTONES */}
                                    {Array.isArray(dossier?.keyMilestones) && dossier.keyMilestones.length > 0 && (
                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">⑦ Key Corporate Milestones</span>
                                            <div className="relative pl-4 border-l-2 border-slate-200 space-y-4">
                                                {dossier.keyMilestones.map((m: {year: string; event: string}, idx: number) => (
                                                    <div key={idx} className="relative">
                                                        <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-si-blue-primary border-2 border-white shadow" />
                                                        <span className="text-[10px] font-black text-si-blue-primary uppercase tracking-widest">{m.year}</span>
                                                        <p className="text-xs text-slate-700 font-medium leading-relaxed mt-0.5">{m.event}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 8. PRODUCT PORTFOLIO */}
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">⑧ Core Product & Service Portfolio</span>
                                        <div className="flex flex-wrap gap-2">
                                            {(Array.isArray(dossier?.portfolio) ? dossier.portfolio : ["Standardized Infrastructure", "Secure Network Ops"]).map((item: string, idx: number) => (
                                                <div key={idx} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 shadow-sm flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-si-blue-primary flex-shrink-0" />
                                                    {item}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 9. DIGITAL ASSETS AT RISK */}
                                    {Array.isArray(dossier?.digitalAssets) && dossier.digitalAssets.length > 0 && (
                                        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200">
                                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-3">⑨ Digital Assets at Risk</span>
                                            <div className="space-y-2">
                                                {dossier.digitalAssets.map((asset: string, idx: number) => (
                                                    <div key={idx} className="flex items-start gap-2">
                                                        <span className="text-amber-500 mt-0.5 flex-shrink-0">⚠</span>
                                                        <span className="text-xs text-slate-700 font-medium leading-relaxed">{asset}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 10. SUPPLY CHAIN EXPOSURE */}
                                    {dossier?.supplyChainExposure && (
                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">⑩ Supply Chain & Vendor Exposure</span>
                                            <p className="text-sm text-slate-700 leading-relaxed">{dossier.supplyChainExposure}</p>
                                        </div>
                                    )}

                                    {/* 11. REGULATORY ENVIRONMENT */}
                                    {dossier?.regulatoryEnvironment && (
                                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">⑪ Regulatory & Compliance Environment</span>
                                            <p className="text-sm text-slate-700 leading-relaxed">{dossier.regulatoryEnvironment}</p>
                                        </div>
                                    )}

                                    {/* 12. WHY CYBER INSURANCE */}
                                    {dossier?.cyberThreatNarrative && (
                                        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-200">
                                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-2">⑫ Why Cyber Insurance is Critical</span>
                                            <p className="text-sm text-slate-700 leading-relaxed font-medium">{dossier.cyberThreatNarrative}</p>
                                        </div>
                                    )}

                                    {/* 12.5 EXTERNAL TECHNICAL VERIFICATION (SHODAN) */}
                                    {dossier?.shodanIntelligence && (
                                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-emerald-500/20 transition-colors" />
                                            <div className="relative z-10">
                                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-4 flex items-center gap-2">
                                                    <ShieldCheck className="w-4 h-4" /> Technical OSINT Surface Scan
                                                </span>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Exposed Assets</p>
                                                        <p className="text-2xl font-black text-white">{dossier.shodanIntelligence.assetCount}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Open Ports</p>
                                                        <p className="text-2xl font-black text-amber-400">{dossier.shodanIntelligence.openPorts?.length || 0}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">CVEs Detected</p>
                                                        <p className={`text-2xl font-black ${(dossier.shodanIntelligence.vulnerabilities?.length || 0) > 0 ? "text-rose-500" : "text-emerald-400"}`}>
                                                            {dossier.shodanIntelligence.vulnerabilities?.length || 0}
                                                        </p>
                                                    </div>
                                                </div>
                                                {dossier.shodanIntelligence.openPorts && dossier.shodanIntelligence.openPorts.length > 0 && (
                                                    <div className="mb-3">
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Exposed Services</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {dossier.shodanIntelligence.openPorts.slice(0, 10).map((port, idx) => (
                                                                <span key={idx} className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded border border-slate-700 font-mono">Port {port}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {dossier.shodanIntelligence.techStack && dossier.shodanIntelligence.techStack.length > 0 && (
                                                    <div>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Passive Stack Identification</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {dossier.shodanIntelligence.techStack.slice(0, 8).map((tech, idx) => (
                                                                <span key={idx} className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded border border-slate-700 font-mono">{tech}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* 13. CYBER RISK EXPOSURE BARS */}
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">⑬ Quantified Cyber Risk Exposure</span>
                                        <p className="text-xs text-slate-400 mb-5">Sector-calibrated threat intelligence scores. Red ≥ 70% (Critical) · Amber ≥ 55% (High) · Blue (Moderate).</p>
                                        <div className="space-y-5">
                                            {(Array.isArray(dossier?.cyberStats) ? dossier.cyberStats : [
                                                { label: "Business Interruption Risk", value: 85, reasoning: "High operational dependency on synchronized digital infrastructure. Any downtime triggers immediate downstream loss." },
                                                { label: "Supply Chain Vulnerability", value: 72, reasoning: "Risk propagated from third-party vendor interfaces and digital procurement dependencies." },
                                                { label: "Data Exfiltration Threat", value: 64, reasoning: "Inherent risk to organizational IP and confidential project records." }
                                            ]).map((stat: { label: string; value: number; reasoning: string }, idx: number) => {
                                                const color = stat.value >= 70 ? '#f43f5e' : stat.value >= 55 ? '#f59e0b' : '#3b82f6'
                                                const barGradient = stat.value >= 70
                                                    ? 'linear-gradient(to right, #f87171, #f43f5e)'
                                                    : stat.value >= 55
                                                    ? 'linear-gradient(to right, #fbbf24, #f97316)'
                                                    : 'linear-gradient(to right, #3b82f6, #60a5fa)'
                                                const severity = stat.value >= 70 ? 'CRITICAL' : stat.value >= 55 ? 'HIGH' : 'MODERATE'
                                                return (
                                                    <div key={idx}>
                                                        <div className="flex justify-between items-center mb-1.5">
                                                            <span className="text-sm text-slate-700 font-semibold">{stat.label}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ color, backgroundColor: `${color}20` }}>{severity}</span>
                                                                <span className="font-black text-base" style={{ color }}>{stat.value}%</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${stat.value}%` }}
                                                                transition={{ duration: 1.4, delay: 0.3 + idx * 0.15, ease: "easeOut" }}
                                                                style={{ background: barGradient }}
                                                                className="h-full rounded-full"
                                                            />
                                                        </div>
                                                        <p className="text-[10px] text-slate-700 font-medium italic mt-2 leading-relaxed border-l-2 border-si-blue-primary/30 pl-2">
                                                            {stat.reasoning}
                                                        </p>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                </div>

                                {/* Footer Actions */}
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 mt-8 border-t border-slate-100">
                                    <p className="text-sm text-slate-500 max-w-md leading-relaxed">
                                        By confirming, you acknowledge that this profile accurately reflects your organization's operational scope for the purpose of cyber risk evaluation.
                                    </p>
                                    <div className="flex items-center gap-3 w-full sm:w-auto flex-shrink-0">
                                        <Link href="/settings" className="w-full sm:w-auto px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-2 border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                                              onClick={() => setShowDossierModal(false)}>
                                            Update Details
                                        </Link>
                                        <button
                                            onClick={handleConfirmDossier}
                                            className="w-full sm:w-auto px-8 py-4 bg-si-blue-primary text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-si-blue-primary/20 flex items-center justify-center gap-2 hover:bg-si-navy transition-all active:scale-95"
                                        >
                                            <CheckCircle2 className="w-5 h-5" />
                                            Confirm Details
                                        </button>
                                    </div>
                                </div>
                                </>)}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <img src="/share-india-new.png" alt="Share India" className="h-9 w-auto" />
                    <div className="h-8 w-[1px] bg-slate-200" />
                    <div>
                        <h1 className="text-lg font-black text-si-navy font-outfit tracking-tight leading-none">
                            {siteConfig.name}<span className="text-si-blue-primary">.</span>
                        </h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Elite Audit</p>
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

                            <motion.div 
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="mt-16 pt-12 border-t border-slate-100"
                            >
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-1 bg-si-blue-primary rounded-full" />
                                    <h3 className="text-sm font-black text-si-navy uppercase tracking-[0.2em]">The Strategic Utility of Risk Transfer</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        {
                                            title: "Balance Sheet Protection",
                                            desc: "Insulate your operational capital from catastrophic ransomware demands and business interruption losses that can freeze cash flows.",
                                            icon: Lock,
                                            color: "bg-blue-50 text-blue-600"
                                        },
                                        {
                                            title: "Contractual Credibility",
                                            desc: "Meet mandatory cybersecurity coverage required by Fortune 500 MNCs and government agencies to secure premium B2B contracts.",
                                            icon: Building2,
                                            color: "bg-indigo-50 text-indigo-600"
                                        },
                                        {
                                            title: "Crisis Response Mastery",
                                            desc: "Gain immediate access to elite digital forensic teams, legal counsel, and PR stabilization the moment a breach occurs.",
                                            icon: AlertCircle,
                                            color: "bg-rose-50 text-rose-600"
                                        },
                                        {
                                            title: "Total Risk Resilience",
                                            desc: "Combine technical defenses with financial risk transfer to create a multi-layered security posture that protects both data and equity.",
                                            icon: ShieldCheck,
                                            color: "bg-emerald-50 text-emerald-600"
                                        }
                                    ].map((item, idx) => (
                                        <div key={idx} className="group p-6 bg-white rounded-[32px] border border-slate-100 hover:border-si-blue-primary/30 hover:shadow-2xl hover:shadow-si-blue-primary/5 transition-all duration-500">
                                            <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500`}>
                                                <item.icon className="w-6 h-6" />
                                            </div>
                                            <h4 className="text-lg font-black text-si-navy mb-2">{item.title}</h4>
                                            <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                                {item.desc}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
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

                                {(() => {
                                    // PRIORITY 1: Dynamic Dossier from API (Current Session)
                                    // PRIORITY 2: Persisted Dossier from Profile (Database)
                                    // PRIORITY 3: Static Template (Hardcoded legacy data)
                                    const activeDossier = dossier || userProfile?.company_dossier || getDossier(userProfile?.organization_name);

                                    // LOADING STATE: Show high-fidelity skeleton while AI is synthesizing
                                    if (isDossierLoading) {
                                        return (
                                            <div className="space-y-8 animate-pulse">
                                                <div className="flex items-center gap-5 opacity-50">
                                                    <div className="w-14 h-14 bg-white/10 rounded-2xl" />
                                                    <div className="space-y-2">
                                                        <div className="h-6 w-48 bg-white/10 rounded" />
                                                        <div className="h-3 w-32 bg-white/10 rounded" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {[1, 2].map(i => <div key={i} className="h-16 bg-white/5 rounded-2xl border border-white/5" />)}
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="h-3 w-24 bg-white/10 rounded" />
                                                    <div className="flex gap-2">
                                                        {[1, 2, 3].map(i => <div key={i} className="h-8 w-20 bg-white/5 rounded-lg" />)}
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="h-3 w-32 bg-white/10 rounded" />
                                                    <div className="h-20 bg-white/5 rounded-2xl" />
                                                </div>
                                                <p className="text-[10px] text-si-blue-primary font-black uppercase tracking-widest text-center animate-bounce">
                                                    Synthesizing OSINT Intelligence...
                                                </p>
                                            </div>
                                        );
                                    }

                                    if (activeDossier) {
                                        const isGeneric = activeDossier.leadership === "Authorized Signatory" || !activeDossier.revenueStreams;

                                        return (
                                            <div className="space-y-8">
                                                <div>
                                                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-4">Organizational Legacy</span>
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center text-si-blue-primary group-hover:bg-si-blue-primary group-hover:text-white transition-all duration-500 flex-shrink-0">
                                                            <Building2 className="w-7 h-7" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h2 className="text-xl font-black font-outfit tracking-tight mb-0.5 italic text-white leading-tight underline decoration-si-blue-primary/30 truncate">
                                                                {activeDossier.name}
                                                            </h2>
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-si-blue-primary" />
                                                                <span className="text-[9px] font-bold text-white/40 uppercase tracking-tighter truncate">
                                                                    {activeDossier.founded ? `Est. ${activeDossier.founded}` : 'Established Node'} • {activeDossier.hq || 'Global Reach'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 shadow-sm">
                                                        <span className="text-[8px] font-black text-white/30 uppercase tracking-wider block mb-1.5">Leadership</span>
                                                        <p className="text-[10px] font-bold text-white/70 truncate">{activeDossier.leadership || 'Verified Stakeholders'}</p>
                                                        <p className="text-[8px] text-white/40 mt-0.5 uppercase">Corporate Control</p>
                                                    </div>
                                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5 shadow-sm">
                                                        <span className="text-[8px] font-black text-white/30 uppercase tracking-wider block mb-1.5">Market Status</span>
                                                        <p className="text-[10px] font-bold text-white/70 truncate">{activeDossier.annualRevenue || activeDossier.employees || 'Active Scale'}</p>
                                                        <p className="text-[8px] text-white/40 mt-0.5 uppercase">Operational Magnitude</p>
                                                    </div>
                                                </div>

                                                <div>
                                                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-3">Core Portfolio</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {(activeDossier.portfolio && activeDossier.portfolio.length > 0 ? activeDossier.portfolio.slice(0, 4) : ["Standardized Infrastructure", "Secure Network Ops"]).map((item: string, idx: number) => (
                                                            <div key={idx} className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[9px] font-bold text-white/60 tracking-tight whitespace-nowrap hover:bg-si-blue-primary/10 hover:border-si-blue-primary/30 transition-colors">
                                                                {item}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-3">Business Model</span>
                                                    <p className="text-[10px] font-medium text-white/50 leading-relaxed italic line-clamp-3">
                                                        {activeDossier.businessModel || "Critical operator within the supply chain network managing interconnected vendor operations."}
                                                    </p>
                                                </div>

                                                <div>
                                                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest block mb-4">Inherent Cyber Risk Factors</span>
                                                    <div className="space-y-4">
                                                        {(activeDossier.cyberStats || [
                                                            { label: "Business Interruption Risk", value: 85, reasoning: "Operational dependency on uptime." },
                                                            { label: "Supply Chain Vulnerability", value: 72, reasoning: "Exposure to vendor breaches." },
                                                            { label: "Data Exfiltration Threat", value: 64, reasoning: "Asset security risk." }
                                                        ]).map((stat: { label: string, value: number, reasoning: string }, idx: number) => (
                                                            <div key={idx} className="space-y-1">
                                                                <div className="flex justify-between text-[9px] items-center mb-0.5">
                                                                    <span className="text-white/50 font-bold uppercase tracking-tighter">{stat.label}</span>
                                                                    <span className={`${stat.value > 70 ? 'text-rose-500' : 'text-si-blue-primary'} font-black uppercase text-[8px]`}>{stat.value}% RISK</span>
                                                                </div>
                                                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                                    <motion.div 
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${stat.value}%` }}
                                                                        transition={{ duration: 1, delay: 0.5 + (idx * 0.1) }}
                                                                        className={`h-full bg-gradient-to-r ${stat.value > 70 ? 'from-rose-500 to-rose-600' : 'from-si-blue-primary to-si-blue-secondary'} rounded-full`}
                                                                    />
                                                                </div>
                                                                <p className="text-[7px] text-white italic leading-[1.3] mt-1.5 pb-1">{stat.reasoning}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-si-blue-primary/10 rounded-lg flex items-center justify-center text-si-blue-primary border border-si-blue-primary/20">
                                                            <Globe className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-[9px] font-medium text-white/40 leading-tight italic max-w-[200px]">
                                                                {isGeneric ? "Generic profile active. Enhancing..." : "Verified organizational profile active."}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {((activeDossier.website && !activeDossier.website.toLowerCase().includes("n/a")) || userProfile?.organization_website) && (
                                                        <a
                                                            href={(activeDossier.website && !activeDossier.website.toLowerCase().includes("n/a") ? activeDossier.website : userProfile?.organization_website) || "#"}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2.5 bg-white/5 hover:bg-si-blue-primary/20 rounded-xl border border-white/5 transition-colors group/link"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5 text-white/40 group-hover/link:text-si-blue-primary transition-colors" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }

                                    // ABSOLUTE FALLBACK (Should rarely happen now)
                                    return (
                                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-white/20">
                                                <Building2 className="w-8 h-8" />
                                            </div>
                                            <p className="text-xs text-white/40 font-medium">Initializing Organizational Synthesis...</p>
                                        </div>
                                    );
                                })()}
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
