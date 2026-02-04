"use client"

import { useState, useEffect, useCallback } from "react"
import { useUnderwriting } from "@/context/underwriting-context"
import { ControlsPanel } from "@/components/controls-panel"
import { ReassuranceScreen } from "@/components/reassurance-screen"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, Save, Loader2, ShieldCheck, Settings, LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function AssessmentPage() {
    const router = useRouter()
    const {
        domains,
        selectedIndustry,
        manualOverrideEnabled,
        setSelectedIndustry,
        setManualOverrideEnabled,
        handleDomainWeightChange,
        handleQuestionChange,
        handleKillerToggle,
        saveDraft,
        autoSaveDraft,
        submitAssessment,
        handleReset,
        completionStats,
        isLoading,
        isAdmin,
        isSaving,
        lastSavedTimestamp
    } = useUnderwriting()

    const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set())
    const [showReassurance, setShowReassurance] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    // Auto-expand first domain on load
    useEffect(() => {
        if (domains.length > 0 && expandedDomains.size === 0) {
            setExpandedDomains(new Set([domains[0].id]))
        }
    }, [domains, expandedDomains.size])

    // Reassurance Logic
    useEffect(() => {
        if (isLoading) return
        const sessionDismissed = sessionStorage.getItem("reassurance_dismissed")
        if (!sessionDismissed && completionStats.percentage === 0) {
            setShowReassurance(true)
        }
    }, [completionStats.percentage, isLoading])

    // Auto-save effect (debounced)
    useEffect(() => {
        const timer = setTimeout(() => {
            autoSaveDraft()
        }, 2000) // 2 second debounce

        return () => clearTimeout(timer)
    }, [domains, selectedIndustry, manualOverrideEnabled, autoSaveDraft])

    const handleDomainToggle = useCallback((domainId: string) => {
        setExpandedDomains((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(domainId)) {
                newSet.delete(domainId)
            } else {
                newSet.add(domainId)
            }
            return newSet
        })
    }, [])

    const onResetClick = () => {
        if (window.confirm("Are you sure you want to reset the assessment? All answers will be cleared.")) {
            handleReset()
            window.location.reload()
        }
    }

    const handleFinalize = async () => {
        if (completionStats.percentage < 100) {
            router.push("/dashboard")
            return
        }

        if (window.confirm("Ready to submit for official underwriting? This will finalize your risk assessment.")) {
            setIsSubmitting(true)
            const res = await submitAssessment()
            setIsSubmitting(false)
            if (res.success) {
                setSubmitted(true)
            } else {
                alert(`Submission failed: ${res.error}`)
            }
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-inter">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-si-blue-primary/20 border-t-si-blue-primary rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-si-navy rounded-full animate-pulse" />
                        </div>
                    </div>
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-si-navy font-outfit mb-2">Initializing CYRUS.PRO</h2>
                        <p className="text-sm text-slate-400 font-medium">Fetching global risk assessment protocols...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-12 rounded-[40px] shadow-2xl shadow-si-navy/10 max-w-2xl w-full text-center border border-slate-100"
                >
                    <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[32px] flex items-center justify-center mx-auto mb-10">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                    <h1 className="text-4xl font-black text-si-navy font-outfit mb-6 tracking-tight">Assessment Submitted.</h1>
                    <p className="text-lg text-slate-500 font-medium leading-relaxed mb-12 px-8">
                        Your technical risk assessment has been securely transmitted. Our underwriting team will review the parameters and issue an official risk profile shortly.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={() => router.push("/dashboard")}
                            className="flex-1 py-4 bg-si-blue-primary text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-si-navy transition-all duration-300 shadow-xl shadow-si-blue-primary/20 flex items-center justify-center gap-2"
                        >
                            <ShieldCheck className="w-4 h-4" />
                            View Risk Analysis
                        </button>
                        <button
                            onClick={() => router.push("/")}
                            className="flex-1 py-4 bg-white border border-slate-200 text-si-navy text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-slate-50 transition-all duration-300"
                        >
                            Return Home
                        </button>
                    </div>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-inter text-slate-900 font-medium tracking-tight">
            <AnimatePresence>
                {showReassurance && (
                    <ReassuranceScreen
                        onDismiss={() => {
                            setShowReassurance(false)
                            sessionStorage.setItem("reassurance_dismissed", "true")
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Simplified Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-4">
                    <Link href="/welcome" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-si-navy">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] block mb-0.5">
                            {isAdmin ? "Command Protocol" : "Assessment Protocol"}
                        </span>
                        <span className="text-sm font-black text-si-navy font-outfit tracking-tight">
                            {isAdmin ? "Admin Command Mode" : "Active Underwriting Session"}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end mr-4">
                        <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-si-blue-primary">{completionStats.percentage}% Protocol Compliance</span>
                        </div>
                        <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${completionStats.percentage}%` }}
                                className="h-full bg-si-blue-primary shadow-[0_0_8px_rgba(42,126,254,0.4)]"
                            />
                        </div>
                    </div>

                    <div className="flex items-center bg-slate-50 p-1 rounded-xl border border-slate-100">
                        <button
                            onClick={onResetClick}
                            className="text-[10px] font-black text-slate-400 hover:text-si-red uppercase tracking-widest px-4 py-2 hover:bg-white rounded-lg transition-all duration-200"
                        >
                            Reset
                        </button>
                        <div className="w-[1px] h-4 bg-slate-200 mx-1" />
                        <button
                            onClick={async () => {
                                const result = await saveDraft()
                                if (result.success) {
                                    alert("Progress saved successfully!")
                                } else {
                                    alert(`Save failed: ${result.error}`)
                                }
                            }}
                            className="text-slate-400 hover:text-si-blue-primary p-2 hover:bg-white rounded-lg transition-all duration-200 relative group"
                            title="Save Progress"
                        >
                            <Save className="w-5 h-5" />
                            {/* Save Status Indicator */}
                            {isSaving && (
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-si-navy text-white text-[9px] font-bold px-2 py-1 rounded whitespace-nowrap">
                                    Saving...
                                </div>
                            )}
                            {!isSaving && lastSavedTimestamp && (
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[9px] font-bold px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                    Saved {new Date(lastSavedTimestamp).toLocaleTimeString()}
                                </div>
                            )}
                        </button>
                    </div>

                    {completionStats.percentage < 100 ? (
                        <button
                            onClick={handleFinalize}
                            disabled={isSubmitting}
                            className="px-6 py-2.5 bg-si-navy text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-si-blue-primary transition-all duration-300 shadow-xl shadow-si-navy/20 active:scale-95 group flex items-center gap-2"
                        >
                            Analyze Risk
                            <motion.span
                                animate={{ x: [0, 4, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                                →
                            </motion.span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push("/dashboard")}
                                className="hidden sm:flex px-6 py-2.5 bg-white border border-slate-200 text-si-navy text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-slate-50 transition-all duration-300 flex items-center gap-2"
                            >
                                Analyze Risk
                                <ArrowRight className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleFinalize}
                                disabled={isSubmitting}
                                className="px-6 py-2.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-emerald-500 transition-all duration-300 shadow-xl shadow-emerald-500/20 active:scale-95 group flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        Finalize & Submit
                                        <ShieldCheck className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    <div className="w-[1px] h-6 bg-slate-100 hidden md:block" />

                    <button
                        onClick={async () => {
                            const { createClient } = await import('@/lib/supabase/client')
                            const supabase = createClient()
                            await supabase.auth.signOut()
                            window.location.href = '/login'
                        }}
                        className="flex items-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-si-red hover:border-si-red/30 transition-all active:scale-95"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden lg:inline">Exit Session</span>
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
                {/* Left Rail: Navigation */}
                <div className="hidden lg:block col-span-3 sticky top-28 self-start h-fit max-h-[calc(100vh-10rem)] overflow-y-auto pr-4 custom-scrollbar">
                    <div className="mb-4 px-4 py-2 bg-slate-100/50 rounded-lg border border-slate-200/50">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Navigation Map</span>
                    </div>
                    <nav className="space-y-1.5">
                        {domains.map((d, idx) => {
                            const isComplete = d.questions.every(q => q.response !== -1)
                            const isActive = expandedDomains.has(d.id)

                            return (
                                <button
                                    key={d.id}
                                    onClick={() => {
                                        handleDomainToggle(d.id)
                                        document.getElementById(`domain-${d.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                    }}
                                    className={`w-full text-left px-4 py-4 rounded-xl flex items-center justify-between group transition-all duration-300 ${isActive
                                        ? 'bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-200 scale-[1.02]'
                                        : 'hover:bg-white/80 text-slate-500 hover:shadow-sm'
                                        }`}
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-si-blue-primary' : isComplete ? 'text-emerald-600' : 'text-slate-400'}`}>
                                            Domain {String(idx + 1).padStart(2, '0')}
                                        </span>
                                        <span className={`text-xs font-bold ${isActive ? 'text-si-navy' : 'text-slate-600'}`}>
                                            {d.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isComplete ? (
                                            <div className="w-5 h-5 bg-emerald-50 rounded-full flex items-center justify-center">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                            </div>
                                        ) : (
                                            <Circle className={`w-4 h-4 shrink-0 transition-colors duration-300 ${isActive ? 'text-si-blue-primary' : 'text-slate-200'}`} />
                                        )}
                                    </div>
                                </button>
                            )
                        })}
                    </nav>
                </div>

                {/* Main Content: Questionnaire */}
                <div className="col-span-1 lg:col-span-9 space-y-8 pb-32">
                    <ControlsPanel
                        domains={domains}
                        selectedIndustryId={selectedIndustry}
                        manualOverrideEnabled={manualOverrideEnabled}
                        expandedDomains={expandedDomains}
                        onDomainToggle={handleDomainToggle}
                        onIndustryChange={setSelectedIndustry}
                        onOverrideToggle={setManualOverrideEnabled}
                        onDomainWeightChange={handleDomainWeightChange}
                        onQuestionChange={handleQuestionChange}
                        onKillerToggle={handleKillerToggle}
                    />
                </div>
            </main>
        </div>
    )
}
