"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
    ShieldCheck,
    LogOut,
    Users,
    FileText,
    Edit3,
    ChevronRight,
    Zap,
    Scale,
    AlertTriangle,
    Activity,
    LayoutDashboard,
    Key,
    Clock,
    ShieldAlert,
    Settings
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useUnderwriting } from "@/context/underwriting-context"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis
} from 'recharts'

export default function AdminPage() {
    const router = useRouter()
    const supabase = createClient()
    const { isAdmin, signOut } = useUnderwriting()

    const [stats, setStats] = useState({
        clients: 0,
        reports: 0,
        killerFailures: 0
    })
    const [recentSubmissions, setRecentSubmissions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [trendData, setTrendData] = useState<any[]>([])
    const [radarData, setRadarData] = useState<any[]>([])
    const [sectorData, setSectorData] = useState<any[]>([])



    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true)
            const [profilesRes, assessRes, allAssessRes] = await Promise.all([
                supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'client'),
                supabase.from('assessments').select('*, profiles(organization_name, username, industry, email, name)').order('created_at', { ascending: false }).limit(6),
                supabase.from('assessments').select('total_score, auto_declined, created_at, submission_data, industry_id, profiles(industry)')
            ])

            const allAssess = allAssessRes.data || []
            const killerFailures = allAssess.filter(a => a.auto_declined).length

            setStats({
                clients: profilesRes.count || 0,
                reports: allAssess.length,
                killerFailures
            })
            setRecentSubmissions(assessRes.data || [])

            // Process Trend Data (Last 7 Days)
            const days = Array.from({ length: 7 }, (_, i) => {
                const date = new Date()
                date.setDate(date.getDate() - (6 - i))
                return date.toISOString().split('T')[0]
            })

            const trends = days.map(day => {
                const count = allAssess.filter(a => a.created_at.startsWith(day)).length
                return { name: new Date(day).toLocaleDateString([], { weekday: 'short' }), count }
            })
            setTrendData(trends)

            // Process Radar Data (Global Averages)
            const domainTotals: Record<string, { total: number, count: number }> = {}
            allAssess.forEach(a => {
                const domains = (a.submission_data as any)?.result?.domainScores || []
                domains.forEach((ds: any) => {
                    if (!domainTotals[ds.domain]) domainTotals[ds.domain] = { total: 0, count: 0 }
                    domainTotals[ds.domain].total += ds.score
                    domainTotals[ds.domain].count += 1
                })
            })

            const radar = Object.entries(domainTotals).map(([name, stats]) => ({
                subject: name.split(' ').map(w => w[0]).join(''), // Abbreviate for radar
                fullName: name,
                A: Math.round(stats.total / stats.count),
                fullMark: 100
            })).slice(0, 6) // Top 6 domains for clarity
            setRadarData(radar)

            // Process Sector Data
            const sectorCounts: Record<string, number> = {}
            allAssess.forEach(a => {
                const industry = (a.profiles as any)?.industry || a.industry_id.replace(/_/g, ' ')
                sectorCounts[industry] = (sectorCounts[industry] || 0) + 1
            })
            const topSectors = Object.entries(sectorCounts)
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 4)
            setSectorData(topSectors)

            setIsLoading(false)
        }

        fetchDashboardData()

        // Realtime Subscription for Live Updates
        const channel = supabase
            .channel('admin_dashboard')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'assessments'
            }, () => {
                fetchDashboardData()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Activity className="w-12 h-12 text-si-navy animate-pulse" />
                    <span className="text-[10px] font-black text-si-navy/40 uppercase tracking-[0.4em]">Loading Dashboard...</span>
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
                    <p className="text-slate-500 mt-2">Only administrators can access the Audit Console.</p>
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
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.3em]">Access Level: Admin</span>
                        </div>
                        <span className="text-sm font-bold text-white font-outfit">Cyber Insurance Audit Portal</span>
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
                    <Link
                        href="/admin/settings"
                        className="p-3 bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all rounded-xl border border-white/10 group"
                    >
                        <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                    </Link>
                    <button
                        onClick={signOut}
                        className="p-3 bg-white/5 text-white/60 hover:text-white hover:bg-si-red transition-all rounded-xl border border-white/10 group"
                    >
                        <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </header>

            <main className="max-w-[1600px] mx-auto p-12">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {[
                        { label: 'Active Nodes', val: stats.clients, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/5' },
                        { label: 'Audit Reports', val: stats.reports, icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
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

                {/* Data Insights Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
                    {/* Trend Analysis */}
                    <div className="lg:col-span-7 bg-slate-50 p-8 rounded-[48px] border border-slate-100 relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <Activity className="w-5 h-5 text-si-blue-primary" />
                                <h3 className="text-xs font-black text-si-navy uppercase tracking-[0.4em]">Submission Velocity</h3>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">Last 7 Days</span>
                        </div>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                        dy={10}
                                    />
                                    <YAxis hide />
                                    <RechartsTooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                                        labelStyle={{ display: 'none' }}
                                    />
                                    <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Risk Profile Radar */}
                    <div className="lg:col-span-5 bg-si-navy p-8 rounded-[48px] border border-white/5 relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="flex items-center gap-3">
                                <Zap className="w-5 h-5 text-si-blue-primary" />
                                <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.4em]">Global Risk Factor</h3>
                            </div>
                        </div>
                        <div className="h-[280px] w-full relative z-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="#ffffff10" />
                                    <PolarAngleAxis
                                        dataKey="subject"
                                        tick={{ fill: '#ffffff40', fontSize: 8, fontWeight: 900 }}
                                    />
                                    <Radar
                                        name="Global Avg"
                                        dataKey="A"
                                        stroke="#2563eb"
                                        fill="#2563eb"
                                        fillOpacity={0.6}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', color: '#1e293b' }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Background Decoration */}
                        <div className="absolute inset-0 bg-gradient-to-br from-si-blue-primary/10 to-transparent pointer-events-none" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Operational Modules */}
                    <div className="lg:col-span-4 space-y-8">
                        <h3 className="text-xs font-black text-si-navy/30 uppercase tracking-[0.5em] px-2">Dashboard Modules</h3>

                        <Link href="/admin/content" className="block group">
                            <div className="bg-gradient-to-br from-si-navy to-si-navy/90 text-white p-10 rounded-[40px] shadow-2xl shadow-si-navy/20 hover:from-si-blue-primary hover:to-si-navy transition-all duration-500 relative overflow-hidden h-full">
                                <div className="relative z-10 h-full flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className="w-14 h-14 bg-white/10 rounded-2xl border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Scale className="w-7 h-7" />
                                            </div>
                                            <div className="w-14 h-14 bg-si-red/20 rounded-2xl border border-si-red/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <AlertTriangle className="w-7 h-7 text-si-red" />
                                            </div>
                                        </div>
                                        <h4 className="text-3xl font-black font-outfit tracking-tighter italic mb-4">Risk <br />Configuration.</h4>
                                        <div className="space-y-2">
                                            <p className="text-sm text-white/50 font-medium leading-relaxed max-w-[280px]">
                                                Adjust domain multipliers, strategic risk weights, and manage killer units.
                                            </p>
                                            <div className="flex flex-wrap gap-2 mt-4">
                                                <span className="text-[9px] font-bold bg-white/10 px-3 py-1 rounded-full uppercase tracking-wider">Weights</span>
                                                <span className="text-[9px] font-bold bg-si-red/20 text-si-red px-3 py-1 rounded-full uppercase tracking-wider">Killer Units</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-12 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] group-hover:gap-4 transition-all">
                                        Configure Settings <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="absolute right-[-20px] top-[-20px] w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none group-hover:bg-white/10 transition-colors" />
                            </div>
                        </Link>

                        {/* Top Sectors Grid */}
                        <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-100">
                            <h3 className="text-[10px] font-black text-si-navy/30 uppercase tracking-[0.4em] mb-6 px-2">Top Performance Segments</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {sectorData.map((sector, i) => (
                                    <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm group hover:border-si-blue-primary/30 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 truncate">{sector.name}</span>
                                            <div className="flex items-end justify-between">
                                                <span className="text-xl font-black text-si-navy font-outfit italic">{sector.count}</span>
                                                <div className="w-8 h-8 rounded-lg bg-si-blue-primary/10 flex items-center justify-center text-si-blue-primary group-hover:bg-si-blue-primary group-hover:text-white transition-colors">
                                                    <ChevronRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {sectorData.length === 0 && (
                                    <div className="col-span-2 py-8 text-center text-slate-300 text-xs font-bold uppercase tracking-widest italic">
                                        No sector data available
                                    </div>
                                )}
                            </div>
                        </div>

                        <Link href="/admin/submissions" className="block group">
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
                                        <h3 className="text-2xl font-black text-si-navy font-outfit tracking-tighter italic">Audit Activity Log</h3>
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
                                                                <span className="text-sm font-black text-si-navy">
                                                                    {sub.profiles?.organization_name || sub.industry_id.replace(/_/g, ' ')}
                                                                </span>
                                                                {sub.auto_declined && (
                                                                    <span className="text-[8px] font-black bg-si-red/10 text-si-red px-2 py-0.5 rounded uppercase tracking-widest">Audit Failed</span>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                                <span className="flex items-center gap-1">
                                                                    <Users className="w-3 h-3" />
                                                                    {sub.profiles?.name || sub.profiles?.username || sub.profiles?.email || `Node: ${sub.user_id.substring(0, 8)}`}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <LayoutDashboard className="w-3 h-3" />
                                                                    {sub.profiles?.industry || sub.industry_id.replace(/_/g, ' ')}
                                                                </span>
                                                                <span className="flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" />
                                                                    {new Date(sub.created_at).toLocaleDateString()} {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
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
