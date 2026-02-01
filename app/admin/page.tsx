"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
    ShieldCheck,
    LogOut,
    Users,
    FileText,
    BarChart3,
    Edit3,
    ChevronRight,
    Zap,
    Scale,
    AlertTriangle,
    Activity,
    LayoutDashboard,
    Key,
    Clock,
    ShieldAlert
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useUnderwriting } from "@/context/underwriting-context"

export default function AdminPage() {
    const router = useRouter()
    const supabase = createClient()
    const { isAdmin } = useUnderwriting()

    const [stats, setStats] = useState({
        clients: 0,
        reports: 0,
        avgScore: 0,
        killerFailures: 0
    })
    const [recentSubmissions, setRecentSubmissions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const handleLogout = async () => {
        await supabase.auth.signOut()
        window.location.href = '/login'
    }

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true)
            const [profilesRes, assessRes, allAssessRes] = await Promise.all([
                supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'client'),
                supabase.from('assessments').select('*').order('created_at', { ascending: false }).limit(6),
                supabase.from('assessments').select('total_score, auto_declined')
            ])

            const allAssess = allAssessRes.data || []
            const totalScore = allAssess.reduce((sum, a) => sum + Number(a.total_score), 0)
            const killerFailures = allAssess.filter(a => a.auto_declined).length
            const avg = allAssess.length ? (totalScore / allAssess.length).toFixed(1) : 0

            setStats({
                clients: profilesRes.count || 0,
                reports: allAssess.length,
                avgScore: Number(avg),
                killerFailures
            })
            setRecentSubmissions(assessRes.data || [])
            setIsLoading(false)
        }
        fetchDashboardData()
    }, [supabase])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="w-12 h-12 text-si-navy animate-pulse" />
                    <span className="text-[10px] font-black text-si-navy/40 uppercase tracking-[0.4em]">Syncing Terminal...</span>
                </div>
            </div>
        )
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <ShieldAlert className="w-12 h-12 text-si-red mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-si-navy">Access Denied</h1>
                    <p className="text-slate-500 mt-2">Only administrators can access the Command Console.</p>
                    <Link href="/" className="mt-6 inline-block px-6 py-2 bg-si-navy text-white rounded-xl">Return Home</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white font-inter text-slate-900 pb-20">
            {/* Header */}
            <header className="bg-si-navy border-b border-white/5 px-8 py-6 flex items-center justify-between sticky top-0 z-50 shadow-2xl">
                <div className="flex items-center gap-6">
                    <img src="/share-india-new.png" alt="Share India" className="h-8 w-auto brightness-0 invert" />
                    <div className="h-8 w-[1px] bg-white/10" />
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.3em]">Operational Level: Admin</span>
                        </div>
                        <span className="text-sm font-bold text-white font-outfit">Risk Protocol Command Terminal</span>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="hidden lg:flex items-center gap-4 text-white/40">
                        <div className="flex flex-col items-end">
                            <span className="text-[8px] font-black uppercase tracking-[0.2em]">Encryption</span>
                            <span className="text-[10px] font-bold text-white/60 uppercase">AES-256 Active</span>
                        </div>
                        <Key className="w-4 h-4 opacity-50" />
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-3 bg-white/5 text-white/60 hover:text-white hover:bg-si-red transition-all rounded-xl border border-white/10 group"
                    >
                        <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto p-12">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
                    {[
                        { label: 'Active Nodes', val: stats.clients, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/5' },
                        { label: 'Protocol Reports', val: stats.reports, icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
                        { label: 'Avg Risk Exposure', val: `${stats.avgScore}%`, icon: BarChart3, color: 'text-si-blue-primary', bg: 'bg-si-blue-primary/5' },
                        { label: 'Killer Failures', val: stats.killerFailures, icon: Zap, color: 'text-si-red', bg: 'bg-si-red/5' },
                    ].map((s, i) => (
                        <div key={i} className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 relative overflow-hidden group">
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-2xl flex items-center justify-center`}>
                                        <s.icon className="w-6 h-6" />
                                    </div>
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">{s.label}</span>
                                </div>
                                <p className="text-4xl font-black text-si-navy font-outfit tracking-tighter italic">{s.val}</p>
                            </div>
                            <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                                <s.icon className="w-24 h-24" />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Operational Modules */}
                    <div className="lg:col-span-4 space-y-8">
                        <h3 className="text-xs font-black text-si-navy/30 uppercase tracking-[0.5em] px-2">Operational Modules</h3>

                        <Link href="/admin/content" className="block group">
                            <div className="bg-si-navy text-white p-10 rounded-[40px] shadow-2xl shadow-si-navy/20 hover:bg-si-blue-primary transition-all duration-500 relative overflow-hidden h-full">
                                <div className="relative z-10 h-full flex flex-col justify-between">
                                    <div>
                                        <div className="w-14 h-14 bg-white/10 rounded-2x border border-white/10 flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
                                            <Scale className="w-7 h-7" />
                                        </div>
                                        <h4 className="text-3xl font-black font-outfit tracking-tighter italic mb-4">Weight <br />Processor.</h4>
                                        <p className="text-sm text-white/50 font-medium leading-relaxed max-w-[200px]">Adjust domain multipliers and strategic risk weights.</p>
                                    </div>
                                    <div className="mt-12 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] group-hover:gap-4 transition-all">
                                        Access Controls <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Scale className="w-48 h-48" />
                                </div>
                            </div>
                        </Link>

                        <Link href="/admin/content" className="block group">
                            <div className="bg-white border-[3px] border-si-red p-10 rounded-[40px] hover:bg-si-red group transition-all duration-500 relative overflow-hidden h-full">
                                <div className="relative z-10 h-full flex flex-col justify-between">
                                    <div>
                                        <div className="w-14 h-14 bg-si-red/10 group-hover:bg-white/20 rounded-2xl flex items-center justify-center mb-10 text-si-red group-hover:text-white transition-colors duration-500">
                                            <AlertTriangle className="w-7 h-7" />
                                        </div>
                                        <h4 className="text-3xl font-black font-outfit tracking-tighter italic mb-4 text-si-navy group-hover:text-white transition-colors">Killer <br />Units.</h4>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-[200px] group-hover:text-white/60 transition-colors">Manage critical failures and system-auto-decline triggers.</p>
                                    </div>
                                    <div className="mt-12 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-si-red group-hover:text-white group-hover:gap-4 transition-all">
                                        Access Units <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="absolute -right-10 -bottom-10 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                    <AlertTriangle className="w-48 h-48" />
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Protocol Audit Log */}
                    <div className="lg:col-span-8">
                        <div className="bg-slate-50 rounded-[48px] border border-slate-100 overflow-hidden h-full flex flex-col">
                            <div className="p-10 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-si-navy text-white rounded-2xl flex items-center justify-center">
                                        <Activity className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-si-navy font-outfit tracking-tighter italic">Protocol Audit Log</h3>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Live Assessment Feed</p>
                                    </div>
                                </div>
                                <Link href="/admin/submissions" className="text-[10px] font-black text-si-blue-primary uppercase tracking-[0.3em] hover:text-si-navy hover:underline transition-all">
                                    Full Archives →
                                </Link>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                {recentSubmissions.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 p-20 text-center">
                                        <LayoutDashboard className="w-16 h-16 mb-6 opacity-20" />
                                        <p className="font-bold uppercase tracking-widest text-[10px]">No recent data packets detected.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {recentSubmissions.map((sub, idx) => (
                                            <Link
                                                href={`/admin/submissions/${sub.id}`}
                                                key={sub.id}
                                                className="block p-8 bg-white rounded-[32px] border border-slate-100 hover:border-si-blue-primary transition-all group relative overflow-hidden"
                                            >
                                                <div className="flex items-center justify-between relative z-10">
                                                    <div className="flex items-center gap-6">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm italic transition-all duration-500 ${sub.auto_declined ? 'bg-si-red text-white' : 'bg-slate-100 text-si-navy group-hover:bg-si-navy group-hover:text-white'}`}>
                                                            {sub.total_score}%
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <span className="text-sm font-black text-si-navy">{sub.industry_id.replace(/_/g, ' ')}</span>
                                                                {sub.auto_declined && (
                                                                    <span className="text-[8px] font-black bg-si-red/10 text-si-red px-2 py-0.5 rounded uppercase tracking-widest">Protocol Failed</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Node: {sub.user_id.substring(0, 8)}</span>
                                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(sub.created_at).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-si-blue-primary group-hover:text-white transition-all transform group-hover:translate-x-2">
                                                        <ChevronRight className="w-5 h-5" />
                                                    </div>
                                                </div>
                                                {/* Progress highlight */}
                                                <div className="absolute bottom-0 left-0 h-1 bg-si-blue-primary/10 w-full">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ${sub.auto_declined ? 'bg-si-red' : 'bg-emerald-400'}`}
                                                        style={{ width: `${sub.total_score}%` }}
                                                    />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
