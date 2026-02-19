"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    Users,
    ArrowLeft,
    Search,
    Calendar,
    Shield,
    Mail,
    Activity,
    ExternalLink,
    Clock,
    UserCheck,
    UserMinus
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

interface Profile {
    id: string
    email: string
    name: string
    organization_name: string
    industry: string
    role: string
    created_at: string
    last_audit_at?: string
    audit_count: number
}

export default function UserManagementPage() {
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const supabase = createClient()

    useEffect(() => {
        const fetchUsers = async () => {
            const [profilesRes, assessmentsRes] = await Promise.all([
                supabase.from('profiles').select('*').order('created_at', { ascending: false }),
                supabase.from('assessments').select('user_id, created_at')
            ])

            if (profilesRes.data) {
                const assessments = assessmentsRes.data || []

                const users = profilesRes.data.map(p => {
                    const userAudits = assessments.filter(a => a.user_id === p.id)
                    return {
                        ...p,
                        audit_count: userAudits.length,
                        last_audit_at: userAudits.length > 0 ? userAudits[0].created_at : undefined
                    }
                })
                setProfiles(users)
            }
            setIsLoading(false)
        }

        fetchUsers()
    }, [supabase])

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return profiles
        const lowTerm = searchTerm.toLowerCase()
        return profiles.filter(p =>
            p.email?.toLowerCase().includes(lowTerm) ||
            p.name?.toLowerCase().includes(lowTerm) ||
            p.organization_name?.toLowerCase().includes(lowTerm)
        )
    }, [profiles, searchTerm])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="w-12 h-12 border-4 border-si-navy/10 border-t-si-navy rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 font-inter text-slate-900 pb-20">
            <header className="bg-si-navy border-b border-white/5 px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
                <div className="flex items-center gap-6">
                    <Link href="/admin" className="p-3 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 rounded-xl border border-white/10 transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <Shield className="w-3 h-3 text-si-blue-primary" />
                            <span className="text-[10px] text-si-blue-primary font-black uppercase tracking-[0.3em]">Master Directory</span>
                        </div>
                        <h1 className="text-xl font-black text-white font-outfit uppercase tracking-tight">User Management</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-12">
                <div className="mb-12 flex items-center justify-between">
                    <div>
                        <h2 className="text-4xl font-black text-si-navy font-outfit tracking-tighter italic mb-2 uppercase">Participant Registry</h2>
                        <p className="text-slate-500 font-medium">Monitor and manage all clients authorized within the audit framework.</p>
                    </div>
                    <div className="relative w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by Name, Email or Org..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-si-blue-primary/10 transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredUsers.map((user, idx) => (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden"
                        >
                            <div className="flex items-center gap-4 mb-6 relative z-10">
                                <div className="w-14 h-14 bg-si-navy text-white rounded-2xl flex items-center justify-center font-bold text-lg uppercase shadow-lg shadow-si-navy/20 group-hover:bg-si-blue-primary transition-colors">
                                    {user.name?.substring(0, 2) || user.email?.substring(0, 2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-black text-si-navy truncate">{user.name || user.email}</h3>
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-3 h-3 text-slate-400" />
                                        <span className="text-[10px] font-bold text-slate-400 truncate">{user.email}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8 relative z-10">
                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <span>Organization</span>
                                    <span className="text-si-navy">{user.organization_name || "N/A"}</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    <span>Sector</span>
                                    <span className="text-si-navy">{user.industry || "N/A"}</span>
                                </div>
                                <div className="h-[1px] bg-slate-50 w-full" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Audits</span>
                                        <span className="text-lg font-black text-si-navy font-outfit italic">{user.audit_count}</span>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Last Active</span>
                                        <span className="text-[10px] font-bold text-si-navy leading-none block mt-2">
                                            {user.last_audit_at ? new Date(user.last_audit_at).toLocaleDateString() : "Never"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 relative z-10">
                                <button className="flex-1 px-4 py-2.5 bg-slate-50 hover:bg-si-navy hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-100">
                                    View Activity
                                </button>
                                <button className="p-2.5 bg-slate-50 hover:bg-si-red hover:text-white rounded-xl text-slate-400 transition-all border border-slate-100">
                                    <UserMinus className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-si-blue-primary/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 group-hover:bg-si-blue-primary/10 transition-colors" />
                        </motion.div>
                    ))}

                    {filteredUsers.length === 0 && (
                        <div className="col-span-full py-32 text-center">
                            <Users className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                            <h4 className="text-xl font-black text-si-navy uppercase tracking-widest">No Participants Found</h4>
                            <p className="text-slate-400 font-medium mt-2">Try adjusting your search terms.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
