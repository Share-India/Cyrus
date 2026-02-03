"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ShieldCheck, ArrowLeft, FileText, ExternalLink, Calendar, User, BarChart } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

interface Submission {
    id: string
    user_id: string
    industry_id: string
    total_score: number
    risk_tier: string
    premium_loading: string
    created_at: string
    profiles: {
        email: string
    }
}

export default function SubmissionsDashboard() {
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchSubmissions = async () => {
            // Fetch all assessments
            const { data: assessmentsData, error: assessmentsError } = await supabase
                .from('assessments')
                .select('*')
                .order('created_at', { ascending: false })

            if (assessmentsError) {
                console.error("Error fetching submissions:", assessmentsError)
                alert(`Error: ${assessmentsError.message}`)
                setIsLoading(false)
                return
            }

            if (assessmentsData && assessmentsData.length > 0) {
                // Fetch all unique user profiles
                const userIds = [...new Set(assessmentsData.map(a => a.user_id))]
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, email')
                    .in('id', userIds)

                // Create a map of user_id to email
                const profileMap = new Map(
                    profilesData?.map(p => [p.id, { email: p.email }]) || []
                )

                // Combine the data
                const combinedData = assessmentsData.map(assessment => ({
                    ...assessment,
                    profiles: profileMap.get(assessment.user_id) || { email: 'Unknown' }
                }))

                setSubmissions(combinedData as any)
            }
            setIsLoading(false)
        }

        fetchSubmissions()
    }, [supabase])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="w-12 h-12 border-4 border-si-navy/10 border-t-si-navy rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 font-inter text-slate-900">
            <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-400" />
                    </Link>
                    <div className="h-6 w-[1px] bg-slate-200" />
                    <div>
                        <span className="text-[10px] text-si-red font-bold uppercase tracking-widest block">Admin Console</span>
                        <span className="text-sm font-bold text-si-navy font-outfit">Detailed Submissions</span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-si-navy font-outfit mb-2">Risk Protocol Reports</h1>
                        <p className="text-slate-500 font-medium">Review and analyze finalized client underwriting submissions.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-bold text-si-navy">{submissions.length} Total Submissions</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-si-navy/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Client / Identifier</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Industry</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Score</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Tier</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Submission Date</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center text-slate-400">
                                            No assessments have been submitted yet.
                                        </td>
                                    </tr>
                                ) : (
                                    submissions.map((sub, idx) => (
                                        <motion.tr
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            key={sub.id}
                                            className="group hover:bg-slate-50/50 transition-colors"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-si-navy text-xs uppercase group-hover:bg-si-navy group-hover:text-white transition-colors duration-300">
                                                        {sub.profiles?.email?.substring(0, 2) || 'CL'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-si-navy">{sub.profiles?.email}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">ID: {sub.id.substring(0, 8)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-sm font-bold text-slate-600 capitalize">{sub.industry_id.replace(/_/g, ' ')}</span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className="inline-block px-3 py-1 bg-si-blue-primary/10 rounded-lg">
                                                    <span className="text-sm font-black text-si-blue-primary">{sub.total_score}%</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <div className={`inline-block px-3 py-1 rounded-lg font-black text-xs ${sub.risk_tier === 'A' ? 'bg-emerald-50 text-emerald-600' :
                                                    sub.risk_tier === 'B' ? 'bg-blue-50 text-blue-600' :
                                                        sub.risk_tier === 'C' ? 'bg-orange-50 text-orange-600' :
                                                            'bg-red-50 text-red-600'
                                                    }`}>
                                                    Tier {sub.risk_tier}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-600">
                                                        {new Date(sub.created_at).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">
                                                        {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <Link
                                                    href={`/admin/submissions/${sub.id}`}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 hover:bg-si-navy hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95"
                                                >
                                                    View Report
                                                    <ExternalLink className="w-3 h-3" />
                                                </Link>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    )
}
