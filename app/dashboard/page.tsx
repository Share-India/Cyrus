"use client"

import { useUnderwriting } from "@/context/underwriting-context"
import { RiskEngine } from "@/components/risk-engine"
import { DecisionPanel } from "@/components/decision-panel"
import { motion } from "framer-motion"
import { ArrowLeft, ArrowRight, Download, FileText } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { downloadPDFSummary } from "@/lib/pdf-report-generator"
import { INDUSTRY_PROFILES } from "@/lib/scoring-engine"

export default function DashboardPage() {
    const router = useRouter()
    const { result, domains, completionStats, isAdmin, clientName, selectedIndustry } = useUnderwriting()

    // Get industry name from ID
    const industryName = INDUSTRY_PROFILES.find(p => p.id === selectedIndustry)?.name || ''

    // Redirect if no data
    if (completionStats.percentage === 0) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Link href="/assessment" className="text-si-blue-primary font-bold hover:underline">
                    Please complete the assessment first.
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 font-inter text-slate-900">
            <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/assessment" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-si-navy">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">
                            {isAdmin ? "Admin Analysis" : "Risk Intelligence"}
                        </span>
                        <span className="text-sm font-bold text-si-navy font-outfit">
                            {isAdmin ? "Admin Analytics Terminal" : "Dashboard View"}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => downloadPDFSummary(result, domains, clientName, industryName)}
                        className="group px-5 py-2.5 bg-white border-2 border-si-navy text-si-navy text-xs font-black uppercase tracking-widest rounded-xl hover:bg-si-navy hover:text-white transition-all duration-300 shadow-lg shadow-si-navy/10 flex items-center gap-2"
                        title="Download PDF Summary"
                    >
                        <FileText className="w-4 h-4" />
                        <span className="hidden md:inline">PDF Summary</span>
                    </button>
                    <button
                        onClick={() => router.push("/submission")}
                        className="group px-6 py-2.5 bg-si-blue-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-si-blue-secondary transition-colors shadow-lg shadow-si-blue-primary/20 flex items-center gap-2"
                    >
                        <span>Finalize Protocol</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                    {/* Visual Analytics */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2 px-1">
                            <div className="w-8 h-8 rounded-lg bg-si-navy/5 flex items-center justify-center text-si-navy">
                                <FileText className="w-4 h-4" />
                            </div>
                            <h2 className="text-lg font-black text-si-navy font-outfit uppercase tracking-tight">Risk Analysis</h2>
                        </div>
                        <div className="si-card overflow-hidden h-[800px]">
                            <RiskEngine result={result} domains={domains} />
                        </div>
                    </div>

                    {/* Decision Factors */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2 px-1">
                            <div className="w-8 h-8 rounded-lg bg-si-navy/5 flex items-center justify-center text-si-navy">
                                <FileText className="w-4 h-4" />
                            </div>
                            <h2 className="text-lg font-black text-si-navy font-outfit uppercase tracking-tight">Decision Protocol</h2>
                        </div>
                        <div className="si-card overflow-hidden h-[800px]">
                            <DecisionPanel
                                result={result}
                                domains={domains}
                                completionPercentage={completionStats.percentage}
                                onNavigateToDomain={() => router.push("/assessment")} // Redirect back to edit
                            />
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    )
}
