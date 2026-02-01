"use client"

import { motion } from "framer-motion"
import { ShieldCheck, ArrowRight, Play, FileText, BarChart3, Lock } from "lucide-react"
import Link from "next/link"
import { useUnderwriting } from "@/context/underwriting-context"
import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

export default function WelcomePage() {
    const {
        completionStats,
    } = useUnderwriting()

    return (
        <div className="min-h-screen bg-slate-50 font-inter text-slate-900 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <img src="/share-india-new.png" alt="Share India" className="h-9 w-auto" />
                    <div className="h-8 w-[1px] bg-slate-200" />
                    <div>
                        <h1 className="text-xl font-black text-si-navy font-outfit tracking-tight">CYRUS<span className="text-si-blue-primary">.PRO</span></h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Risk Protocol</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Authorized Access</p>
                    </div>
                    <button
                        onClick={() => {
                            // Sign out logic
                            const supabase = createClient()
                            supabase.auth.signOut().then(() => {
                                window.location.href = '/login'
                            })
                        }}
                        className="px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-si-red hover:border-si-red/30 transition-all active:scale-95"
                    >
                        Exit Session
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1 max-w-5xl mx-auto w-full p-8 md:p-16 flex flex-col justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-si-blue-primary/10 rounded-full text-si-blue-primary font-bold text-xs uppercase tracking-widest mb-8">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Underwriting v2.0 Live</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-si-navy font-outfit tracking-tight mb-8 leading-tight">
                        Comprehensive <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-si-blue-primary to-si-blue-secondary">Cyber Risk Profiling</span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-600 max-w-2xl leading-relaxed mb-8">
                        This protocol assesses your organization's cybersecurity posture across 19 critical infrastructure domains. The output is a definitive risk tier rating and premium loading determination.
                    </p>

                    <div className="flex flex-col md:flex-row gap-6 items-start">
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
                                        {completionStats.percentage > 0 ? "RESUME SESSION" : "INITIALIZE PROTOCOL"}
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
                                    <p className="text-xs font-bold text-si-navy uppercase">Progress</p>
                                    <p className="text-[10px] text-slate-500 font-medium">{completionStats.answered} / {completionStats.total} Answered</p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 border-t border-slate-200 pt-16"
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
                            Get immediate feedback on risk drivers, control gaps, and estimated premium loading.
                        </p>
                    </div>
                </motion.div>
            </main>
        </div>
    )
}
