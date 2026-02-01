"use client"

import { useState, useEffect, useCallback } from "react"
import { useUnderwriting } from "@/context/underwriting-context"
import { ControlsPanel } from "@/components/controls-panel"
import { ReassuranceScreen } from "@/components/reassurance-screen"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, CheckCircle2, Circle, Save, Loader2, ShieldCheck } from "lucide-react"
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
        submitAssessment,
        handleReset,
        completionStats,
        isLoading,
        isAdmin
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

    const handleFinish = async () => {
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
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => router.push("/")}
                            className="w-full py-4 bg-si-navy text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-si-blue-primary transition-all duration-300 shadow-xl shadow-si-navy/20"
                        >
                            Return to Command Center
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
                            onClick={saveDraft}
                            className="text-slate-400 hover:text-si-blue-primary p-2 hover:bg-white rounded-lg transition-all duration-200"
                            title="Save Progress"
                        >
                            <Save className="w-5 h-5" />
                        </button>
                    </div>

                    <button
                        onClick={handleFinish}
                        disabled={isSubmitting}
                        className={`px-6 py-2.5 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300 shadow-xl active:scale-95 group flex items-center gap-2 ${completionStats.percentage === 100
                            ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
                            : 'bg-si-navy hover:bg-si-blue-primary shadow-si-navy/20'
                            }`}
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : completionStats.percentage === 100 ? (
                            <>
                                Finalize & Submit
                                <ShieldCheck className="w-4 h-4" />
                            </>
                        ) : (
                            <>
                                Analyze Risk
                                <motion.span
                                    animate={{ x: [0, 4, 0] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                >
                                    →
                                </motion.span>
                            </>
                        )}
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
