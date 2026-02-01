"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Mail, Phone, ShieldCheck, ArrowRight, CheckCircle2, ShieldAlert, Lock, User, Shield, ChevronRight, Building2, Briefcase } from "lucide-react"
import { INDUSTRY_PROFILES } from "@/lib/scoring-engine"

type AuthStep = "identifier" | "verification"
type AuthMode = "otp" | "password"
type UserRole = "client" | "admin"

export default function LoginPage() {
    const [identifier, setIdentifier] = useState("")
    const [password, setPassword] = useState("")
    const [selectedRole, setSelectedRole] = useState<UserRole>("client")
    const [isSignUp, setIsSignUp] = useState(false)
    const [otp, setOtp] = useState(["", "", "", "", "", ""])
    const [step, setStep] = useState<AuthStep>("identifier")
    const [authMode, setAuthMode] = useState<AuthMode>("password")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isIdentifierEmail, setIsIdentifierEmail] = useState(true)

    // New State for Client Details
    const [organizationName, setOrganizationName] = useState("")
    const [industry, setIndustry] = useState("")
    const [name, setName] = useState("")
    const [username, setUsername] = useState("")

    const otpRefs = useRef<(HTMLInputElement | null)[]>([])

    // Simple detection for email vs phone
    useEffect(() => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        setIsIdentifierEmail(emailRegex.test(identifier) || !identifier.match(/^\+?[\d\s-]{8,}$/))
    }, [identifier])

    // Pre-fill from Cookie
    useEffect(() => {
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`
            const parts = value.split(`; ${name}=`)
            if (parts.length === 2) return parts.pop()?.split(';').shift()
            return null
        }

        const draftData = localStorage.getItem("cyrus_draft_v2")
        if (draftData) {
            try {
                const parsed = JSON.parse(draftData)
                if (parsed.clientName) setOrganizationName(parsed.clientName)
                if (parsed.selectedIndustry) {
                    // Start by matching ID, but if not found, it might be the name
                    const profile = INDUSTRY_PROFILES.find(p => p.id === parsed.selectedIndustry)
                    setIndustry(profile ? profile.name : parsed.selectedIndustry)
                }
            } catch (e) {
                console.error("Failed to parse draft data", e)
            }
        }
    }, [])

    const handleInitiate = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const supabase = createClient()

        if (isSignUp) {
            // Sign Up Flow
            const signUpParams: any = {
                password: password,
                options: {
                    data: {
                        role: selectedRole,
                        organization_name: organizationName,
                        industry: industry,
                        name: name,
                        username: username
                    }
                }
            }

            if (isIdentifierEmail) {
                signUpParams.email = identifier
            } else {
                signUpParams.phone = identifier
            }

            const { data, error } = await supabase.auth.signUp(signUpParams)

            if (error) {
                // Check for existing user error
                if (error.message.includes("already registered") || error.message.includes("User already exists")) {
                    alert("This identifier is already registered. Switching you to Login mode.")
                    setIsSignUp(false)
                    setAuthMode('password')
                } else {
                    setError(error.message)
                }
                setIsLoading(false)
            } else {
                if (data.session) {
                    // Success! Redirect based on role
                    // Client -> Welcome (to start assessment), Admin -> Admin Area
                    window.location.href = selectedRole === 'admin' ? '/admin' : '/welcome'
                } else {
                    // Confirmation required
                    alert("Authorization Node Initialized. WARNING: Identity verification required. Please check your email/phone for a confirmation link before attempting to authorize.")
                    setIsSignUp(false)
                    setAuthMode('password')
                    setIsLoading(false)
                }
            }
        } else {
            // Login Flow
            if (authMode === "otp") {
                const { error } = await (isIdentifierEmail
                    ? supabase.auth.signInWithOtp({
                        email: identifier,
                        options: { emailRedirectTo: `${location.origin}/auth/callback` }
                    })
                    : supabase.auth.signInWithOtp({
                        phone: identifier
                    }))

                if (error) {
                    setError(error.message)
                    setIsLoading(false)
                } else {
                    setStep("verification")
                    setIsLoading(false)
                }
            } else {
                // Password Login
                const credentials = isIdentifierEmail
                    ? { email: identifier, password }
                    : { phone: identifier, password };

                const { data, error } = await supabase.auth.signInWithPassword(credentials as any)

                if (error) {
                    // Improved error feedback
                    if (error.message.toLowerCase().includes("invalid login credentials")) {
                        setError("Invalid credentials. If you just signed up, ensure you have confirmed your identity via the link sent to your identifier.")
                    } else {
                        setError(error.message)
                    }
                    setIsLoading(false)
                } else if (data.user) {
                    // Fetch profile to redirect correctly
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', data.user.id)
                        .single()

                    if (profileError || !profile) {
                        setError("Terminal Identity Mismatch: Profile not found. Please ensure backend initialization (SQL) has been completed.")
                        setIsLoading(false)
                        return
                    }

                    // Client -> Welcome, Admin -> Admin Panel
                    window.location.href = profile.role === 'admin' ? '/admin' : '/welcome'
                }
            }
        }
    }

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        const supabase = createClient()
        const token = otp.join("")

        let verifyParams: any;
        if (isIdentifierEmail) {
            verifyParams = { email: identifier, token, type: 'email' }
        } else {
            verifyParams = { phone: identifier, token, type: 'sms' }
        }

        const { data, error } = await supabase.auth.verifyOtp(verifyParams)

        if (error) {
            setError(error.message)
            setIsLoading(false)
        } else if (data.user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', data.user.id)
                .single()

            window.location.href = profile?.role === 'admin' ? '/admin' : '/welcome'
        }
    }

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) value = value[0]
        if (!/^\d*$/.test(value)) return

        const newOtp = [...otp]
        newOtp[index] = value
        setOtp(newOtp)

        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus()
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus()
        }
    }

    return (
        <div className="min-h-screen bg-white flex flex-col md:flex-row font-inter text-slate-900 overflow-hidden relative">
            {/* Visual Section */}
            <div className="hidden md:flex md:w-[50%] lg:w-[55%] bg-si-navy relative overflow-hidden p-16 flex-col justify-between border-r border-white/5">
                <div className="absolute inset-0 z-0">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.4, 0.3] }}
                        transition={{ duration: 25, repeat: Infinity }}
                        className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] bg-si-blue-primary/20 rounded-full blur-[160px]"
                    />
                </div>

                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center gap-6 mb-24">
                        <img src="/share-india-new.png" alt="Share India" className="h-10 w-auto brightness-0 invert" />
                        <div className="h-8 w-[1px] bg-white/10" />
                        <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em]">Risk Division</span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                        <h1 className="text-6xl lg:text-8xl font-black text-white font-outfit tracking-tighter leading-[0.9] mb-12 italic">
                            Command <br />
                            <span className="text-si-blue-primary not-italic">Interface.</span>
                        </h1>
                        <p className="text-xl text-white/40 font-medium max-w-md leading-relaxed">
                            Initialize your operational session. Authorized personnel only. Protocol AES-256 active.
                        </p>
                    </div>

                    <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-12">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Status</span>
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Terminal Active
                            </span>
                        </div>
                        <img src="/share-india-monogram.png" alt="Share India" className="w-12 h-12 opacity-10" />
                    </div>
                </div>
            </div>

            {/* Form Section */}
            <div className="flex-1 bg-white relative flex flex-col items-center justify-center p-8 md:p-16 lg:p-24 overflow-y-auto">
                <AnimatePresence mode="wait">
                    {step === "identifier" ? (
                        <motion.div
                            key="id-step"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full max-w-md space-y-12"
                        >
                            <div className="flex justify-between items-end">
                                <div>
                                    <h2 className="text-5xl font-black text-si-navy mb-2 tracking-tighter font-outfit">
                                        {isSignUp ? "Enroll." : (selectedRole === 'admin' ? "Admin Access." : "Authorize.")}
                                    </h2>
                                    <p className="text-lg text-slate-400 font-medium">
                                        {isSignUp ? "Create a new node identifier." : (selectedRole === 'admin' ? "Secure administrative terminal." : "Access your node identifier.")}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsSignUp(!isSignUp)
                                        if (!isSignUp) setAuthMode('password')
                                    }}
                                    className="text-[11px] font-black text-si-blue-primary uppercase tracking-widest hover:text-si-navy transition-colors mb-2"
                                >
                                    {isSignUp ? "Login" : "Sign Up"}
                                </button>
                            </div>


                            <form onSubmit={handleInitiate} className="space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-si-navy/40 uppercase tracking-[0.4em] px-2">Operational Mode</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedRole("client")}
                                            className={`p-5 rounded-2xl border-2 transition-all flex flex-col gap-3 ${selectedRole === "client" ? "border-si-blue-primary bg-si-blue-primary/5 text-si-navy shadow-inner" : "border-slate-100 text-slate-300 hover:border-slate-200"}`}
                                        >
                                            <User className={`w-6 h-6 ${selectedRole === "client" ? "text-si-blue-primary" : "text-slate-200"}`} />
                                            <span className="text-xs font-black uppercase tracking-widest">Client</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedRole("admin")}
                                            className={`p-5 rounded-2xl border-2 transition-all flex flex-col gap-3 ${selectedRole === "admin" ? "border-si-blue-primary bg-si-blue-primary/5 text-si-navy shadow-inner" : "border-slate-100 text-slate-300 hover:border-slate-200"}`}
                                        >
                                            <Shield className={`w-6 h-6 ${selectedRole === "admin" ? "text-si-blue-primary" : "text-slate-200"}`} />
                                            <span className="text-xs font-black uppercase tracking-widest">Admin</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <label className="text-[10px] font-black text-si-navy/40 uppercase tracking-[0.4em]">Node Identifier</label>
                                        {!isSignUp && (
                                            <div className="flex gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setAuthMode('otp')}
                                                    className={`text-[9px] font-black uppercase tracking-widest transition-colors ${authMode === 'otp' ? 'text-si-blue-primary' : 'text-slate-300'}`}
                                                >OTP</button>
                                                <button
                                                    type="button"
                                                    onClick={() => setAuthMode('password')}
                                                    className={`text-[9px] font-black uppercase tracking-widest transition-colors ${authMode === 'password' ? 'text-si-blue-primary' : 'text-slate-300'}`}
                                                >Password</button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative group">
                                        {isIdentifierEmail ? (
                                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-si-blue-primary transition-colors" />
                                        ) : (
                                            <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-si-blue-primary transition-colors" />
                                        )}
                                        <input
                                            type="text"
                                            value={identifier}
                                            onChange={(e) => setIdentifier(e.target.value)}
                                            placeholder={isIdentifierEmail ? "aditya.l@shareindia.com" : "+91 XXXXX XXXXX"}
                                            className="w-full pl-16 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-3xl text-lg font-black text-si-navy focus:ring-8 focus:ring-si-blue-primary/5 focus:border-si-blue-primary focus:bg-white transition-all duration-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {isSignUp && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-4 overflow-hidden"
                                        >
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-si-navy/40 uppercase tracking-[0.4em] px-2">Full Name</label>
                                                    <div className="relative group">
                                                        <User className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-si-blue-primary transition-colors" />
                                                        <input
                                                            type="text"
                                                            value={name}
                                                            onChange={(e) => setName(e.target.value)}
                                                            placeholder="Aditya Ladge"
                                                            className="w-full pl-16 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black text-si-navy focus:ring-8 focus:ring-si-blue-primary/5 focus:border-si-blue-primary focus:bg-white transition-all duration-500"
                                                            required={isSignUp}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-si-navy/40 uppercase tracking-[0.4em] px-2">Username</label>
                                                    <div className="relative group">
                                                        <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-si-blue-primary transition-colors" />
                                                        <input
                                                            type="text"
                                                            value={username}
                                                            onChange={(e) => setUsername(e.target.value)}
                                                            placeholder="@cyber_unit"
                                                            className="w-full pl-16 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black text-si-navy focus:ring-8 focus:ring-si-blue-primary/5 focus:border-si-blue-primary focus:bg-white transition-all duration-500"
                                                            required={isSignUp}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <AnimatePresence>
                                    {isSignUp && selectedRole === 'client' && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-4 overflow-hidden"
                                        >
                                            <div className="grid gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-si-navy/40 uppercase tracking-[0.4em] px-2">Organization</label>
                                                    <div className="relative group">
                                                        <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-si-blue-primary transition-colors" />
                                                        <input
                                                            type="text"
                                                            value={organizationName}
                                                            onChange={(e) => setOrganizationName(e.target.value)}
                                                            placeholder="Company / Entity Name"
                                                            className="w-full pl-16 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black text-si-navy focus:ring-8 focus:ring-si-blue-primary/5 focus:border-si-blue-primary focus:bg-white transition-all duration-500"
                                                            required={isSignUp && selectedRole === 'client'}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-si-navy/40 uppercase tracking-[0.4em] px-2">Industry Sector</label>
                                                    <div className="relative group">
                                                        <Briefcase className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-si-blue-primary transition-colors pointer-events-none" />
                                                        <select
                                                            value={industry}
                                                            onChange={(e) => setIndustry(e.target.value)}
                                                            className="w-full pl-16 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-black text-si-navy focus:ring-8 focus:ring-si-blue-primary/5 focus:border-si-blue-primary focus:bg-white transition-all duration-500 appearance-none cursor-pointer"
                                                            required={isSignUp && selectedRole === 'client'}
                                                        >
                                                            <option value="" disabled>Select Sector</option>
                                                            {INDUSTRY_PROFILES.map((p) => (
                                                                <option key={p.id} value={p.name}>{p.name}</option>
                                                            ))}
                                                        </select>
                                                        <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 rotate-90 pointer-events-none" />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {(authMode === "password" || isSignUp) && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                                        <div className="px-2">
                                            <label className="text-[10px] font-black text-si-navy/40 uppercase tracking-[0.4em]">Access Key</label>
                                        </div>
                                        <div className="relative group">
                                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300 group-focus-within:text-si-blue-primary transition-colors" />
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full pl-16 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-3xl text-lg font-black text-si-navy focus:ring-8 focus:ring-si-blue-primary/5 focus:border-si-blue-primary focus:bg-white transition-all duration-500"
                                                required
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {error && (
                                    <p className="text-xs font-bold text-si-red bg-red-50 p-4 rounded-xl border border-red-100 flex items-center gap-3">
                                        <ShieldAlert className="w-4 h-4" /> {error}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-7 bg-si-navy text-white rounded-3xl font-black uppercase tracking-[0.4em] text-[11px] hover:bg-si-blue-primary transition-all duration-700 shadow-xl disabled:opacity-70 flex items-center justify-center gap-4 group"
                                >
                                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                        <>
                                            {isSignUp ? 'Initialize Node' : (authMode === 'otp' ? 'Transmit OTP' : (selectedRole === 'admin' ? 'Elevate Auth' : 'Authorize Node'))}
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="otp-step"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full max-w-md space-y-12 text-center"
                        >
                            <div>
                                <h2 className="text-5xl font-black text-si-navy mb-4 tracking-tighter font-outfit">Verification.</h2>
                                <p className="text-lg text-slate-400 font-medium leading-relaxed">Code transmitted to {identifier}. Enter 6-digit sequence.</p>
                            </div>

                            <form onSubmit={handleVerifyOtp} className="space-y-10">
                                <div className="flex justify-between gap-3">
                                    {otp.map((digit, idx) => (
                                        <input
                                            key={idx}
                                            ref={(el) => { otpRefs.current[idx] = el }}
                                            type="text"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(idx, e)}
                                            className="w-14 h-20 text-3xl font-black text-center text-si-navy bg-slate-50 border border-slate-100 rounded-2xl focus:ring-8 focus:ring-si-blue-primary/5 focus:border-si-blue-primary focus:bg-white transition-all outline-none"
                                        />
                                    ))}
                                </div>

                                {error && (
                                    <p className="text-xs font-bold text-si-red bg-red-50 p-4 rounded-xl border border-red-100">{error}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading || otp.join("").length < 6}
                                    className="w-full py-7 bg-si-navy text-white rounded-3xl font-black uppercase tracking-[0.4em] text-[11px] hover:bg-si-blue-primary transition-all duration-700 shadow-xl disabled:opacity-50 flex items-center justify-center gap-4"
                                >
                                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirm Identity'}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setStep("identifier")}
                                    className="text-[10px] font-black text-slate-300 hover:text-si-navy uppercase tracking-[0.3em] transition-colors"
                                >
                                    Modify Identifier
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div >
    )
}
