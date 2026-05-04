"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, ArrowRight, CheckCircle2, ShieldAlert, User, Shield, ChevronRight, Building2, Briefcase, Globe, Fingerprint, MailOpen, ShieldCheck, Lock } from "lucide-react"
import { INDUSTRY_PROFILES } from "@/lib/scoring-engine"
import { siteConfig } from "@/lib/site-config"
import { useUnderwriting } from "@/context/underwriting-context"

type AuthStep = "identifier" | "password" | "verification" | "magic_link_sent"
type UserRole = "client" | "admin"

export default function LoginPage() {
    const [identifier, setIdentifier] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [selectedRole, setSelectedRole] = useState<UserRole>("client")
    const [isSignUp, setIsSignUp] = useState(false)
    const [otp, setOtp] = useState(["", "", "", "", "", ""])
    const [step, setStep] = useState<AuthStep>("identifier")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [showDevBypass, setShowDevBypass] = useState(false)

    // New State for Client Details
    const [organizationName, setOrganizationName] = useState("")
    const [organizationWebsite, setOrganizationWebsite] = useState("")
    const [industry, setIndustry] = useState("")
    const [name, setName] = useState("")
    const [username, setUsername] = useState("")
    const [resendCountdown, setResendCountdown] = useState(0)
    const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password")
    const [otpDestination, setOtpDestination] = useState("")

    const otpRefs = useRef<(HTMLInputElement | null)[]>([])
    const { isMfaVerified, setMfaVerified, signOut } = useUnderwriting()

    // Detect if input is phone or email
    const sanitizedIdentifier = identifier.replace(/[\s\-()]/g, "")
    const isPhone = /^\+?\d+$/.test(sanitizedIdentifier) && sanitizedIdentifier.length >= 10

    useEffect(() => {
        if (resendCountdown > 0) {
            const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [resendCountdown])

    // Session Resumption Logic
    useEffect(() => {
        const resumeSession = async () => {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            
            // If user is already MFA verified, skip login entirely
            if (session?.user && isMfaVerified) {
                console.log("🛡️ [Login Resilience]: User is already verified. Redirecting to app.")
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single()
                
                const role = profile?.role || 'client'
                window.location.href = role === 'admin' ? '/admin' : '/welcome'
                return
            }

            // If user has a valid Supabase session but hasn't cleared the local MFA gate,
            // we simply ensure they are at the start of the flow if they aren't already verifying.
            if (session?.user && !isMfaVerified && step === "identifier") {
                console.log("🔄 [Login Resilience]: Partial session detected. Ready for authorization.")
            }
        }
        
        if (!isLoading) {
            resumeSession()
        }
    }, [isLoading, isMfaVerified])

    const handleInitiate = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccessMessage(null)
        
        if (isSignUp) {
            setStep("password")
        } else {
            // Default to password if Enter is pressed
            handleMethodChoice("password")
        }
    }

    const handleMethodChoice = (method: "password" | "otp") => {
        if (!identifier || identifier.length < 3) {
            setError("Please enter a valid email or phone number first.")
            return
        }
        
        setError(null)
        setLoginMethod(method)
        if (method === "password") {
            setStep("password")
        } else {
            handleOtpLoginInitiate()
        }
    }

    const handleOtpLoginInitiate = async () => {
        setIsLoading(true)
        setError(null)
        const supabase = createClient()

        let normalizedIdentifier = identifier.replace(/[\s\-()]/g, "")
        if (isPhone && /^\d{10}$/.test(normalizedIdentifier)) {
            normalizedIdentifier = `+91${normalizedIdentifier}`
        }

        try {
            const { error } = await supabase.auth.signInWithOtp({
                [isPhone ? 'phone' : 'email']: normalizedIdentifier,
                options: { 
                    shouldCreateUser: true, // Allow new users to sign up via this path
                    emailRedirectTo: !isPhone ? `${window.location.origin}/auth/callback` : undefined
                }
            })

            if (error) throw error

            if (isPhone) {
                setOtpDestination(normalizedIdentifier)
                setStep("verification")
            } else {
                setOtpDestination(normalizedIdentifier)
                setStep("magic_link_sent")
            }
        } catch (err: any) {
            setError(err.message || "Failed to send OTP.")
        } finally {
            setIsLoading(false)
        }
    }

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setSuccessMessage(null)

        const supabase = createClient()

        // Normalize identifier
        let normalizedIdentifier = identifier.replace(/[\s\-()]/g, "")
        if (isPhone && /^\d{10}$/.test(normalizedIdentifier)) {
            normalizedIdentifier = `+91${normalizedIdentifier}`
        }

        try {
            if (isSignUp) {
                // Validate passwords match
                if (password !== confirmPassword) {
                    throw new Error("Passwords do not match.")
                }
                if (password.length < 8) {
                    throw new Error("Password must be at least 8 characters.")
                }

                const options: any = {
                    data: {
                        role: selectedRole,
                        organization_name: organizationName,
                        organization_website: organizationWebsite,
                        industry: industry,
                        name: name,
                        username: username,
                        phone: isPhone ? normalizedIdentifier : undefined
                    },
                };

                if (!isPhone) {
                    options.emailRedirectTo = `${window.location.origin}/auth/callback`
                }

                const payload: any = { 
                    password,
                    options 
                }

                if (isPhone) {
                    payload.phone = normalizedIdentifier
                } else {
                    payload.email = normalizedIdentifier
                }

                const { data, error } = await supabase.auth.signUp(payload)
                if (error) throw error

                // After signup, we need to verify the identifier
                if (isPhone) {
                    setStep("verification")
                } else {
                    setStep("magic_link_sent")
                }
            } else {
                // LOGIN FLOW (L1: Password)
                const payload: any = { password }
                if (isPhone) {
                    payload.phone = normalizedIdentifier
                } else {
                    payload.email = normalizedIdentifier
                }

                const { data: authData, error: authError } = await supabase.auth.signInWithPassword(payload)
                
                if (authError) {
                    if (authError.message.toLowerCase().includes("invalid login credentials")) {
                        throw new Error("Invalid credentials. Please verify your email/phone and password.")
                    }
                    throw authError
                }

                // PASSWORD SUCCESS -> Factor 2: Send OTP to REGISTERED EMAIL
                const registeredEmail = authData.user?.email
                if (!registeredEmail) {
                    throw new Error("No registered email found for MFA. Please contact support.")
                }

                setOtpDestination(registeredEmail)
                console.log("🔒 [MFA Initiation]: Sending Factor 2 to registered email:", registeredEmail);
                
                const { error: otpError } = await supabase.auth.signInWithOtp({
                    email: registeredEmail,
                    options: { 
                        shouldCreateUser: false,
                        emailRedirectTo: `${window.location.origin}/auth/callback`
                    }
                })

                if (otpError) {
                    console.error("❌ [MFA Error]:", otpError.message);
                    if (otpError.status === 429 || otpError.message.toLowerCase().includes("rate limit")) {
                        throw new Error("MFA Rate Limit Exceeded: Supabase's default emailer is limited to 3 emails per hour. Please wait or configure a custom SMTP provider in your Supabase Dashboard.")
                    }
                    if (otpError.status === 500) {
                        if (process.env.NODE_ENV === 'development') setShowDevBypass(true)
                        throw new Error("MFA delivery failed. This usually happens when the Supabase SMTP limit is reached. Use Dev Bypass or try again later.")
                    }
                    throw otpError
                }
                
                // For email OTP/Magic Link, we go to magic_link_sent
                // Note: The user can still enter a code if Supabase sends one
                setStep("magic_link_sent")
            }
        } catch (err: any) {
            console.error("🔥 [Login Crash]:", err.message);
            setError(err.message || "Authentication phase failed.")
        } finally {
            setIsLoading(false)
        }
    }


    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setSuccessMessage(null)

        const supabase = createClient()
        const token = otp.join("")
        
        let normalizedIdentifier = identifier.replace(/[\s\-()]/g, "")
        if (isPhone && /^\d{10}$/.test(normalizedIdentifier)) {
            normalizedIdentifier = `+91${normalizedIdentifier}`
        }

        try {
            const { data, error } = await supabase.auth.verifyOtp({
                [isPhone ? 'phone' : 'email']: normalizedIdentifier,
                token,
                type: isPhone ? 'sms' : 'email'
            })

            if (error) throw error
            
            if (data.user) {
                // If it was a sign-up attempt, ensure the profile is updated
                if (isSignUp) {
                    await supabase
                        .from('profiles')
                        .update({
                            organization_name: organizationName,
                            organization_website: organizationWebsite,
                            industry: industry,
                            name: name,
                            username: username,
                            phone: normalizedIdentifier
                        })
                        .eq('id', data.user.id)
                }

                // MFA Success: Unlock the session gate
                sessionStorage.setItem("cyrus_mfa_authenticated", "true")
                
                // Set cookie for cross-tab persistence
                if (typeof document !== 'undefined') {
                    document.cookie = "cyrus_mfa_verified=true; path=/; max-age=86400" // 24h
                }
                
                setMfaVerified(true)

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .single()

                const role = profile?.role || 'client'
                window.location.href = role === 'admin' ? '/admin' : '/welcome'
            }
        } catch (err: any) {
            setError(err.message || "Invalid verification code.")
        } finally {
            setIsLoading(false)
        }
    }



    const handleResendOtp = async () => {
        if (resendCountdown > 0) return
        setError(null)
        setIsLoading(true)

        const supabase = createClient()
        
        try {
            if (loginMethod === "password") {
                // For password MFA, always send to the registered email
                const { data: { user } } = await supabase.auth.getUser()
                const email = user?.email
                if (!email) throw new Error("No registered email found.")
                
                const { error } = await supabase.auth.signInWithOtp({
                    email,
                    options: { 
                        shouldCreateUser: false,
                        emailRedirectTo: `${window.location.origin}/auth/callback`
                    }
                })
                if (error) throw error
            } else {
                // For direct OTP, send to the initial identifier
                let normalizedIdentifier = identifier.replace(/[\s\-()]/g, "")
                if (isPhone && /^\d{10}$/.test(normalizedIdentifier)) {
                    normalizedIdentifier = `+91${normalizedIdentifier}`
                }
                
                const { error } = await supabase.auth.signInWithOtp({
                    [isPhone ? 'phone' : 'email']: normalizedIdentifier,
                    options: { shouldCreateUser: false }
                })
                if (error) throw error
            }
            
            setResendCountdown(30)
        } catch (err: any) {
            setError(err.message || "Failed to resend code.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleForgotPassword = async () => {
        setError(null)
        setSuccessMessage(null)
        setIsLoading(true)

        const supabase = createClient()
        let normalizedIdentifier = identifier.replace(/[\s\-()]/g, "")
        if (isPhone && /^\d{10}$/.test(normalizedIdentifier)) {
            normalizedIdentifier = `+91${normalizedIdentifier}`
        }

        try {
            if (isPhone) {
                const { error } = await supabase.auth.signInWithOtp({
                    phone: normalizedIdentifier,
                    options: {
                        shouldCreateUser: false
                    }
                })
                if (error) throw error
                setSuccessMessage("Identity verification code sent. Verify to proceed and then update your password in settings.")
                setStep("verification")
            } else {
                const { error } = await supabase.auth.resetPasswordForEmail(normalizedIdentifier, {
                    redirectTo: `${window.location.origin}/auth/callback?next=/settings`
                })
                if (error) throw error
                setSuccessMessage("Password reset link has been dispatched to your email.")
            }
        } catch (err: any) {
            setError(err.message || "Failed to initiate password reset.")
        } finally {
            setIsLoading(false)
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
        <div className="min-h-screen bg-[#FDFDFD] flex flex-col md:flex-row font-inter text-slate-900 overflow-hidden relative selection:bg-si-blue-primary/20">
            {/* Visual Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#0A1128 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

            {/* Visual Section - Premium Presentation */}
            <div className="hidden md:flex md:w-[45%] lg:w-[50%] bg-si-navy relative overflow-hidden p-16 flex-col justify-between border-r border-slate-800 shadow-2xl z-10">
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <motion.div
                        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-[20%] -left-[10%] w-[100%] h-[100%] bg-gradient-to-tr from-si-blue-primary/10 to-transparent rounded-full blur-[150px]"
                    />
                    <motion.div
                        animate={{ opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                        className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-gradient-to-bl from-teal-500/10 to-transparent rounded-full blur-[120px]"
                    />
                </div>

                <div className="relative z-10 flex flex-col h-full mix-blend-screen">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-6 mb-24">
                        <img src="/share-india-new.png" alt={siteConfig.name} className="h-10 w-auto brightness-0 invert" />
                        <div className="h-8 w-[1px] bg-white/20" />
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">{siteConfig.tagline.split(' ')[0]} Division</span>
                    </motion.div>

                    <div className="flex-1 flex flex-col justify-center">
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="text-5xl lg:text-7xl font-black text-white font-outfit tracking-tighter leading-[1] mb-8"
                        >
                            Advanced Risk <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-si-blue-primary to-emerald-400">Underwriting.</span>
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                            className="text-xl text-white/50 font-medium max-w-md leading-relaxed"
                        >
                            Log in or create an account instantly using passwordless authentication. Secure, encrypted, and frictionless.
                        </motion.p>
                    </div>

                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-auto flex items-center justify-between border-t border-white/10 pt-12">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-1.5">Network Status</span>
                            <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                                End-to-End Encrypted
                            </span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Form Section */}
            <div className="flex-1 bg-transparent relative flex flex-col justify-center p-8 md:p-16 lg:p-24 overflow-y-auto z-10 w-full max-w-2xl mx-auto">
                <AnimatePresence mode="wait">
                    {step === "identifier" ? (
                        <motion.div
                            key="id-step"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                            className="w-full max-w-md mx-auto space-y-10"
                        >
                            <div className="flex flex-col space-y-3 pt-10 md:pt-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-2xl bg-si-blue-primary/10 flex items-center justify-center text-si-blue-primary border border-si-blue-primary/20">
                                        <Fingerprint className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-black text-si-navy/40 uppercase tracking-[0.3em]">Identity Gateway</span>
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black text-si-navy tracking-tighter font-outfit">
                                    {isSignUp ? "Join Network." : "Welcome Back."}
                                </h2>
                                <p className="text-slate-500 font-medium">
                                    {isSignUp ? "Register with your email or phone for instant access." : "Enter your email or phone to proceed to authorization."}
                                </p>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); handleMethodChoice("password"); }} className="space-y-8">
                                <div className="space-y-2">
                                    <div className="relative group">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center justify-center text-slate-400 group-focus-within:text-si-blue-primary transition-colors">
                                            {identifier.length === 0 ? <Fingerprint className="w-5 h-5" /> : (isPhone ? <span className="font-black text-sm">+91</span> : <MailOpen className="w-5 h-5" />)}
                                        </div>
                                        <input
                                            type="text"
                                            value={identifier}
                                            onChange={(e) => setIdentifier(e.target.value)}
                                            placeholder="Email address or Phone number"
                                            className="w-full pl-16 pr-8 py-5 bg-white border-2 border-slate-100 rounded-3xl text-lg font-bold text-si-navy focus:outline-none focus:ring-4 focus:ring-si-blue-primary/10 focus:border-si-blue-primary shadow-sm transition-all duration-300 placeholder:font-normal placeholder:text-slate-300"
                                            required
                                        />
                                    </div>
                                </div>

                                {error && step === "identifier" && (
                                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-start gap-3 text-sm font-medium">
                                        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                                        <p>{error}</p>
                                    </div>
                                )}

                                {isSignUp ? (
                                    <button
                                        type="submit"
                                        className="w-full py-5 bg-si-navy text-white rounded-3xl font-black uppercase tracking-[0.3em] text-xs hover:bg-si-blue-primary transition-all duration-500 shadow-xl shadow-si-navy/20 flex items-center justify-center gap-3 group relative overflow-hidden"
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-3">
                                            Register & Continue
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                                        </span>
                                    </button>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => handleMethodChoice("password")}
                                            disabled={isLoading}
                                            className="py-5 bg-si-navy text-white rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-si-blue-primary transition-all duration-500 shadow-lg shadow-si-navy/10 flex items-center justify-center gap-3 group disabled:opacity-50"
                                        >
                                            {isLoading && loginMethod === "password" ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                                <>
                                                    Via Password
                                                    <Lock className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                                </>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleMethodChoice("otp")}
                                            disabled={isLoading}
                                            className="py-5 bg-white border-2 border-slate-100 text-si-navy rounded-3xl font-black uppercase tracking-widest text-[10px] hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-500 shadow-sm flex items-center justify-center gap-3 group disabled:opacity-50"
                                        >
                                            {isLoading && loginMethod === "otp" ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                                <>
                                                    Instant Access
                                                    <Fingerprint className="w-3 h-3 group-hover:scale-110 transition-transform" />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </form>

                            <div className="pt-8 border-t border-slate-200 text-center">
                                <p className="text-sm font-medium text-slate-500">
                                    {isSignUp ? "Already part of the network?" : "First time here?"}{' '}
                                    <button 
                                        onClick={() => { setIsSignUp(!isSignUp); setError(null); }} 
                                        className="text-si-blue-primary font-black uppercase tracking-widest text-[10px] ml-2 hover:underline decoration-2 underline-offset-4 transition-all"
                                    >
                                        {isSignUp ? "Log In" : "Create Account"}
                                    </button>
                                </p>
                            </div>
                        </motion.div>
                    ) : step === "password" ? (
                        <motion.div
                            key="password-step"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="w-full max-w-md mx-auto space-y-8"
                        >
                            <div className="flex flex-col space-y-3">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-si-blue-primary/10 flex items-center justify-center text-si-blue-primary border border-si-blue-primary/20">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-black text-si-navy/40 uppercase tracking-[0.3em]">{isSignUp ? "Security Setup" : "Authorization"}</span>
                                </div>
                                <h2 className="text-3xl font-black text-si-navy tracking-tighter font-outfit">
                                    {isSignUp ? "Set your password." : "Verify credentials."}
                                </h2>
                                <button onClick={() => setStep("identifier")} className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-si-navy transition-colors">
                                    Change: {identifier}
                                </button>
                            </div>

                            <form onSubmit={handlePasswordSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="relative group">
                                         <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-si-blue-primary" />
                                         <input
                                             type="password"
                                             value={password}
                                             onChange={(e) => setPassword(e.target.value)}
                                             placeholder={isSignUp ? "Choose Password (min 8 chars)" : "Enter Password"}
                                             className="w-full pl-16 pr-8 py-5 bg-white border-2 border-slate-100 rounded-3xl text-lg font-bold text-si-navy focus:outline-none focus:ring-4 focus:ring-si-blue-primary/10 focus:border-si-blue-primary shadow-sm transition-all duration-300 placeholder:font-normal placeholder:text-slate-300"
                                             required
                                         />
                                    </div>

                                    {isSignUp && (
                                        <div className="relative group">
                                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-si-blue-primary" />
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Confirm Password"
                                                className="w-full pl-16 pr-8 py-5 bg-white border-2 border-slate-100 rounded-3xl text-lg font-bold text-si-navy focus:outline-none focus:ring-4 focus:ring-si-blue-primary/10 focus:border-si-blue-primary shadow-sm transition-all duration-300 placeholder:font-normal placeholder:text-slate-300"
                                                required
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end pr-2">
                                    <button 
                                        type="button" 
                                        onClick={handleForgotPassword}
                                        className="text-[10px] font-black text-si-blue-primary uppercase tracking-widest hover:text-si-navy transition-colors"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {isSignUp && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="space-y-4 pt-2"
                                        >
                                             <div className="p-1 bg-slate-100/50 rounded-[20px] inline-flex mb-4">
                                                <button type="button" onClick={() => setSelectedRole("client")} className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${selectedRole === "client" ? "bg-white text-si-navy shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>Client</button>
                                                <button type="button" onClick={() => setSelectedRole("admin")} className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${selectedRole === "admin" ? "bg-white text-si-navy shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>Admin</button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="relative group">
                                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-si-blue-primary" />
                                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:border-si-blue-primary outline-none transition-all" required />
                                                </div>
                                                <div className="relative group">
                                                    <Shield className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-si-blue-primary" />
                                                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:border-si-blue-primary outline-none transition-all" required />
                                                </div>
                                            </div>

                                            {selectedRole === 'client' && (
                                                <div className="space-y-4 pt-2">
                                                    <div className="relative group">
                                                        <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-si-blue-primary" />
                                                        <input type="text" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder="Organization Name" className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:border-si-blue-primary outline-none transition-all" required />
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="relative group">
                                                            <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-si-blue-primary" />
                                                            <input type="url" value={organizationWebsite} onChange={(e) => setOrganizationWebsite(e.target.value)} placeholder="Website (Optional)" className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:border-si-blue-primary outline-none transition-all" />
                                                        </div>
                                                        <div className="relative group">
                                                            <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-si-blue-primary" />
                                                            <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full pl-12 pr-10 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-semibold focus:border-si-blue-primary outline-none transition-all appearance-none text-slate-600" required>
                                                                <option value="" disabled>Select Industry</option>
                                                                {INDUSTRY_PROFILES.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                            </select>
                                                            <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90 pointer-events-none" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {error && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-start gap-3 text-sm font-medium">
                                            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                                            <p>{error}</p>
                                        </div>
                                        
                                        {showDevBypass && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    document.cookie = "cyrus_mfa_verified=true; path=/; max-age=86400"
                                                    sessionStorage.setItem("cyrus_mfa_authenticated", "true")
                                                    window.location.href = "/welcome"
                                                }}
                                                className="w-full py-3 bg-emerald-500/10 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                                            >
                                                ⚠️ Dev Mode: Bypass MFA Gate
                                            </button>
                                        )}
                                    </div>
                                )}

                                {successMessage && (
                                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 flex items-start gap-3 text-sm font-medium">
                                        <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                                        <p>{successMessage}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-5 bg-si-navy text-white rounded-3xl font-black uppercase tracking-[0.3em] text-xs hover:bg-si-blue-primary transition-all duration-500 shadow-xl shadow-si-navy/20 disabled:opacity-50 flex items-center justify-center gap-3 group relative overflow-hidden"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                        <>
                                            {isSignUp ? "Initialize Account" : "Proceed to MFA"}
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    ) : step === "verification" ? (
                        <motion.div
                            key="otp-step"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="w-full max-w-md mx-auto space-y-10 text-center"
                        >
                            <div className="w-16 h-16 bg-si-navy text-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-si-navy/10">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                            
                            <div>
                                <h2 className="text-4xl font-black text-si-navy mb-4 tracking-tighter font-outfit">Identity Verification.</h2>
                                <p className="text-slate-500 font-medium leading-relaxed">
                                    We sent a 6-digit MFA sequence to <br/>
                                    <span className="font-bold text-si-navy tracking-widest">{otpDestination || identifier}</span>
                                </p>
                            </div>

                            <form onSubmit={handleVerifyOtp} className="space-y-10">
                                <div className="flex justify-between gap-2 sm:gap-3">
                                    {otp.map((digit, idx) => (
                                        <input
                                            key={idx}
                                            ref={(el) => { otpRefs.current[idx] = el }}
                                            type="text"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(idx, e)}
                                            className="w-12 h-16 sm:w-14 sm:h-20 text-3xl font-black text-center text-si-navy bg-white border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-si-blue-primary/10 focus:border-si-blue-primary shadow-sm transition-all"
                                        />
                                    ))}
                                </div>

                                {error && (
                                    <p className="text-sm font-bold text-red-600 bg-red-50 p-4 rounded-xl border border-red-100">{error}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading || otp.join("").length < 6}
                                    className="w-full py-5 bg-si-navy text-white rounded-3xl font-black uppercase tracking-[0.3em] text-xs hover:bg-si-blue-primary transition-all duration-500 shadow-xl shadow-si-navy/20 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Identity'}
                                </button>

                                <div className="flex flex-col gap-5 pt-4">
                                    <button
                                        type="button"
                                        disabled={resendCountdown > 0 || isLoading}
                                        onClick={handleResendOtp}
                                        className="text-[10px] font-black text-si-blue-primary uppercase tracking-widest hover:text-si-navy transition-colors disabled:opacity-50"
                                    >
                                        {resendCountdown > 0 ? `Resend Code in ${resendCountdown}s` : 'Resend Verification Code'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setStep("identifier")}
                                        className="text-[10px] font-bold text-slate-400 hover:text-si-navy uppercase tracking-widest transition-colors"
                                    >
                                        Return to login
                                    </button>

                                    <div className="h-px w-8 bg-slate-100 mx-auto" />

                                    <button
                                        type="button"
                                        onClick={async () => {
                                            await signOut()
                                            setStep("identifier")
                                            setIdentifier("")
                                            setPassword("")
                                        }}
                                        className="text-[9px] font-black text-red-400/60 hover:text-red-500 uppercase tracking-[0.2em] transition-colors"
                                    >
                                        Not you? Sign Out
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="magic-link-step"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-full max-w-md mx-auto text-center space-y-8"
                        >
                            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/10">
                                <MailOpen className="w-10 h-10" />
                            </div>
                            
                            <h2 className="text-4xl font-black text-si-navy tracking-tighter font-outfit">Check Your Inbox.</h2>
                            <p className="text-lg text-slate-500 font-medium leading-relaxed">
                                We've sent a secure magic link to <br/>
                                <span className="font-bold text-si-navy">{otpDestination || identifier}</span>
                            </p>

                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 mt-8 text-left space-y-3">
                                <h4 className="font-bold text-sm text-si-navy">Next Steps:</h4>
                                <ul className="text-sm text-slate-500 space-y-2 list-disc pl-5 font-medium">
                                    <li>Open your email client.</li>
                                    <li>Click the <strong>most recent</strong> secure link inside the email.</li>
                                    <li>You will be automatically authorized in a new tab.</li>
                                </ul>
                                <p className="text-[10px] text-slate-400 mt-2 italic">* Links expire after 5 minutes or once used.</p>
                            </div>

                            <div className="flex flex-col gap-6 mt-8">
                                <button
                                    onClick={handleResendOtp}
                                    disabled={resendCountdown > 0 || isLoading}
                                    className="text-[10px] font-black text-si-blue-primary uppercase tracking-widest hover:text-si-navy transition-colors disabled:opacity-50"
                                >
                                    {resendCountdown > 0 ? `Resend Link in ${resendCountdown}s` : 'Resend Magic Link'}
                                </button>

                                <button
                                    type="button"
                                    onClick={async () => {
                                        await signOut()
                                        setStep("identifier")
                                        setError(null)
                                        setSuccessMessage(null)
                                        setIsLoading(false)
                                    }}
                                    className="text-[10px] font-bold text-slate-400 hover:text-si-navy uppercase tracking-widest transition-colors"
                                >
                                    Back to login
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
