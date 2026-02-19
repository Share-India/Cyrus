"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import {
    DOMAINS,
    calculateScore,
    INDUSTRY_PROFILES,
    getIndustryWeights,
    type Domain,
    type ScoringResult,
    type IndustryProfile,
} from "@/lib/scoring-engine"
import { createClient } from "@/lib/supabase/client"

interface UnderwritingContextType {
    // State
    userRole: string | null
    isAdmin: boolean
    domains: Domain[]
    selectedIndustry: string
    clientName: string
    manualOverrideEnabled: boolean
    result: ScoringResult
    completionStats: { total: number; answered: number; percentage: number }
    currentStep: number
    isLoading: boolean
    isIndustryLocked: boolean
    userProfile: any | null
    currentDomainIndex: number
    currentQuestionIndex: number
    hasDraft: boolean
    lastSavedTimestamp: string | null
    isSaving: boolean

    // Actions
    setDomains: React.Dispatch<React.SetStateAction<Domain[]>>
    setSelectedIndustry: (industryId: string) => void
    setClientName: (name: string) => void
    setManualOverrideEnabled: (enabled: boolean) => void
    handleDomainWeightChange: (domainId: string, newWeight: number) => void
    handleQuestionChange: (domainId: string, questionId: string, response: number) => void
    handleKillerToggle: (domainId: string, questionId: string, isKiller: boolean) => void
    handleReset: () => void
    saveDraft: () => Promise<{ success: boolean; error?: string }>
    autoSaveDraft: () => Promise<void>
    submitAssessment: () => Promise<{ success: boolean; assessmentId?: string; error?: string }>
    refreshData: () => Promise<void>
    updateProfile: (updates: any) => Promise<{ success: boolean; error?: string }>
    signOut: () => Promise<void>
    setCurrentDomainIndex: (index: number) => void
    setCurrentQuestionIndex: (index: number) => void
}

const UnderwritingContext = createContext<UnderwritingContextType | undefined>(undefined)

export function UnderwritingProvider({ children }: { children: React.ReactNode }) {
    const [userRole, setUserRole] = useState<string | null>(null)
    const isAdmin = useMemo(() => userRole === 'admin', [userRole])
    const [domains, setDomains] = useState<Domain[]>([])
    const [manualOverrideEnabled, setManualOverrideEnabled] = useState(false)
    const [selectedIndustry, setSelectedIndustry] = useState<string>("")
    const [clientName, setClientName] = useState<string>("")
    const [isLoading, setIsLoading] = useState(true)
    const [isIndustryLocked, setIsIndustryLocked] = useState(false)
    const [userProfile, setUserProfile] = useState<any | null>(null)
    const [currentDomainIndex, setCurrentDomainIndex] = useState(0)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [hasDraft, setHasDraft] = useState(false)
    const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const fetchQuestionnaire = useCallback(async () => {
        const supabase = createClient()

        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Database timeout after 5s')), 5000)
            )

            const fetchPromise = Promise.all([
                supabase.from('domains').select('*').order('display_order', { ascending: true }),
                supabase.from('questions').select('*')
            ])

            const [domainsRes, questionsRes] = await Promise.race([
                fetchPromise,
                timeoutPromise
            ]) as any

            if (domainsRes.error || questionsRes.error) {
                console.error("Error fetching questionnaire", domainsRes.error || questionsRes.error)
                setDomains(JSON.parse(JSON.stringify(DOMAINS)))
                return
            }

            const rawDomains = domainsRes.data || []
            const rawQuestions = questionsRes.data || []

            const stitchedDomains: Domain[] = rawDomains.map((d: any) => ({
                id: d.id,
                name: d.name,
                defaultWeight: Number(d.default_weight),
                activeWeight: Number(d.default_weight),
                explanation: d.explanation,
                questions: rawQuestions
                    .filter((q: any) => q.domain_id === d.id)
                    .map((q: any) => ({
                        id: q.id,
                        domain: d.name,
                        text: q.text,
                        type: q.type,
                        options: q.options,
                        response: -1,
                        isKiller: q.is_killer
                    }))
            }))

            setDomains(stitchedDomains)
        } catch (error) {
            console.error("❌ Failed to fetch questionnaire:", error)
            setDomains(JSON.parse(JSON.stringify(DOMAINS)))
        }
    }, [])

    // Auth and Data Loading
    useEffect(() => {
        const init = async () => {
            setIsLoading(true)
            const supabase = createClient()

            // 1. Get User Session
            const { data: { session } } = await supabase.auth.getSession()
            console.log("🔍 Session Check:", session ? `Active: ${session.user.id}` : "No Session")

            let cloudDraftData: any = null
            let profileIndustry: string | null = null
            // CRITICAL: Use JSON.parse(JSON.stringify()) for a TRUE deep copy to prevent mutation leakage
            let finalDomains: Domain[] = JSON.parse(JSON.stringify(DOMAINS))

            if (session?.user) {
                // 2. Fetch Profile Role & Draft
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single()

                if (profile) {
                    console.log("👤 Profile Found:", profile.role, "| Has Draft:", !!profile.draft_data)
                    setUserProfile(profile)
                    setUserRole(profile.role || 'client')
                    setClientName(profile.organization_name || "")

                    if (profile.draft_data) {
                        cloudDraftData = profile.draft_data
                    }

                    if (profile.industry) {
                        setSelectedIndustry(profile.industry)
                        setIsIndustryLocked(true)
                        profileIndustry = profile.industry
                    }
                } else {
                    setUserRole('client')
                }
            } else {
                setUserRole(null)
            }

            // 3. Draft Resolution (Cloud -> Local)
            let draftToLoad = cloudDraftData
            const userId = session?.user?.id
            const storageKey = userId ? `cyrus_draft_v2_${userId}` : "cyrus_draft_v2_guest"

            if (!draftToLoad) {
                const localSaved = localStorage.getItem(storageKey)
                if (localSaved) {
                    try {
                        draftToLoad = JSON.parse(localSaved)
                        console.log("📦 Found Local Draft")
                    } catch (e) {
                        console.error("Bad local draft", e)
                    }
                }
            }

            // 4. Apply State
            if (session?.user) {
                if (draftToLoad) {
                    console.log("📦 Applying draft to domains")
                    try {
                        if (draftToLoad.domains) {
                            finalDomains = finalDomains.map((d: Domain) => {
                                const savedD = draftToLoad.domains.find((sd: any) => sd.id === d.id)
                                if (savedD) {
                                    return {
                                        ...d,
                                        activeWeight: d.activeWeight,
                                        questions: d.questions.map((q: any) => {
                                            const savedQ = savedD.questions?.find((sq: any) => sq.id === q.id)
                                            return savedQ ? { ...q, response: savedQ.response } : q
                                        })
                                    }
                                }
                                return d
                            })
                        }
                        if (draftToLoad.selectedIndustry && !profileIndustry) setSelectedIndustry(draftToLoad.selectedIndustry)
                        if (draftToLoad.manualOverrideEnabled) setManualOverrideEnabled(draftToLoad.manualOverrideEnabled)
                        if (draftToLoad.currentDomainIndex !== undefined) setCurrentDomainIndex(draftToLoad.currentDomainIndex)
                        if (draftToLoad.currentQuestionIndex !== undefined) setCurrentQuestionIndex(draftToLoad.currentQuestionIndex)
                        if (draftToLoad.timestamp) setLastSavedTimestamp(draftToLoad.timestamp)
                        setHasDraft(true)
                    } catch (e) {
                        console.error("Error applying draft", e)
                    }
                } else {
                    console.log("✨ Starting fresh assessment for user")
                }
            } else {
                // Guest / No Auth fallback
                console.log("🔒 No active session - forcing clean state")
                localStorage.removeItem("cyrus_draft_v2_guest")
                setSelectedIndustry("")
                setClientName("")
                setManualOverrideEnabled(false)
                setHasDraft(false)
                // Ensure domains are strictly fresh copies of framework defaults
                finalDomains = JSON.parse(JSON.stringify(DOMAINS))
            }

            console.log('📦 Initialized domains')
            setDomains(finalDomains)
            setIsLoading(false)
        }

        init()
    }, [])

    // Derived State
    const result: ScoringResult = useMemo(() => {
        if (domains.length === 0) return {
            totalScore: 0,
            domainScores: [],
            riskTier: "D",
            premiumLoading: "N/A",
            autoDeclined: false,
            failedKillers: [],
            volatilityScore: 0,
            normalizedScore: 0,
            declineNarrative: ""
        }
        return calculateScore(domains)
    }, [domains])

    const completionStats = useMemo(() => {
        if (domains.length === 0) return { total: 0, answered: 0, percentage: 0 }
        const totalQuestions = domains.reduce((sum: number, d: Domain) => sum + d.questions.length, 0)
        const answeredQuestions = domains.reduce(
            (sum: number, d: Domain) => sum + d.questions.filter((q: any) => q.response !== -1).length,
            0
        )
        const percentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
        return { total: totalQuestions, answered: answeredQuestions, percentage }
    }, [domains])

    const currentStep = useMemo(() => {
        if (completionStats.percentage === 0) return 1
        if (completionStats.percentage < 80) return 2
        if (completionStats.percentage < 100) return 3
        return 4
    }, [completionStats.percentage])

    // Actions
    const handleIndustryChange = useCallback((industryId: string) => {
        setSelectedIndustry(industryId)
        const profile = INDUSTRY_PROFILES.find(p => p.id === industryId)
        if (profile) {
            setDomains(prevDomains =>
                prevDomains.map((domain: Domain) => ({
                    ...domain,
                    activeWeight: profile.domainWeights[domain.name] || domain.defaultWeight
                }))
            )
        }
    }, [])

    const handleManualOverrideToggle = useCallback((enabled: boolean) => {
        setManualOverrideEnabled(enabled)
        if (!enabled && selectedIndustry) {
            const profile = INDUSTRY_PROFILES.find(p => p.id === selectedIndustry)
            if (profile) {
                setDomains(prevDomains =>
                    prevDomains.map((domain: Domain) => ({
                        ...domain,
                        activeWeight: profile.domainWeights[domain.name] || domain.defaultWeight
                    }))
                )
            }
        }
    }, [selectedIndustry])

    const handleDomainWeightChange = useCallback((domainId: string, newWeight: number) => {
        setDomains((prevDomains) =>
            prevDomains.map((domain: Domain) => (domain.id === domainId ? { ...domain, activeWeight: newWeight } : domain)),
        )
    }, [])

    const handleQuestionChange = useCallback((domainId: string, questionId: string, response: number) => {
        setDomains((prevDomains) =>
            prevDomains.map((domain: Domain) => {
                if (domain.id === domainId) {
                    return {
                        ...domain,
                        questions: domain.questions.map((question: any) =>
                            question.id === questionId ? { ...question, response } : question,
                        ),
                    }
                }
                return domain
            }),
        )
    }, [])

    const handleKillerToggle = useCallback((domainId: string, questionId: string, isKiller: boolean) => {
        setDomains((prevDomains) =>
            prevDomains.map((domain: Domain) => {
                if (domain.id === domainId) {
                    return {
                        ...domain,
                        questions: domain.questions.map((question: any) =>
                            question.id === questionId ? { ...question, isKiller } : question,
                        ),
                    }
                }
                return domain
            }),
        )
    }, [])

    const handleReset = useCallback(async () => {
        localStorage.removeItem("cyrus_draft_v2")

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                await supabase
                    .from('profiles')
                    .update({ draft_data: null })
                    .eq('id', user.id)
            }
        } catch (e) {
            console.error("Error clearing cloud draft", e)
        }

        await fetchQuestionnaire()
        setSelectedIndustry("")
        setClientName("")
        setManualOverrideEnabled(false)
        setCurrentDomainIndex(0)
        setCurrentQuestionIndex(0)
        setHasDraft(false)
        setLastSavedTimestamp(null)
    }, [fetchQuestionnaire])

    const saveDraft = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
        setIsSaving(true)
        const draft = {
            domains,
            selectedIndustry,
            clientName,
            manualOverrideEnabled,
            currentDomainIndex,
            currentQuestionIndex,
            timestamp: new Date().toISOString()
        }

        try {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            const user = session?.user

            const storageKey = user?.id ? `cyrus_draft_v2_${user.id}` : "cyrus_draft_v2_guest"
            localStorage.setItem(storageKey, JSON.stringify(draft))

            if (user) {
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        draft_data: draft,
                        organization_name: clientName,
                        industry: selectedIndustry
                    })
                    .eq('id', user.id)

                if (error) {
                    console.error("Failed to save cloud draft", error)
                    setIsSaving(false)
                    return { success: false, error: error.message }
                }
            }

            setLastSavedTimestamp(draft.timestamp)
            setHasDraft(true)
            setIsSaving(false)
            return { success: true }
        } catch (e: any) {
            console.error("Error saving draft", e)
            setIsSaving(false)
            return { success: false, error: e.message || "Unknown error" }
        }
    }, [domains, selectedIndustry, clientName, manualOverrideEnabled, currentDomainIndex, currentQuestionIndex])

    const autoSaveDraft = useCallback(async () => {
        const hasResponses = domains.some((d: Domain) => d.questions.some((q: any) => q.response !== -1))
        if (!hasResponses) return

        const draft = {
            domains,
            selectedIndustry,
            clientName,
            manualOverrideEnabled,
            currentDomainIndex,
            currentQuestionIndex,
            timestamp: new Date().toISOString()
        }

        try {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            const user = session?.user

            const storageKey = user?.id ? `cyrus_draft_v2_${user.id}` : "cyrus_draft_v2_guest"
            localStorage.setItem(storageKey, JSON.stringify(draft))

            if (user) {
                await supabase
                    .from('profiles')
                    .update({
                        draft_data: draft,
                        organization_name: clientName,
                        industry: selectedIndustry
                    })
                    .eq('id', user.id)
            }

            setLastSavedTimestamp(draft.timestamp)
            setHasDraft(true)
        } catch (e) {
            console.error("Auto-save failed", e)
        }
    }, [domains, selectedIndustry, clientName, manualOverrideEnabled, currentDomainIndex, currentQuestionIndex])

    const submitAssessment = useCallback(async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { success: false, error: "User not authenticated" }

        const { data: insertedData, error } = await supabase.from('assessments').insert({
            user_id: user.id,
            industry_id: selectedIndustry || 'standard',
            total_score: result.totalScore,
            risk_tier: result.riskTier,
            premium_loading: result.premiumLoading,
            auto_declined: result.autoDeclined,
            submission_data: {
                domains: domains.map((d: Domain) => ({
                    id: d.id,
                    name: d.name,
                    activeWeight: d.activeWeight,
                    questions: d.questions.map((q: any) => ({
                        id: q.id,
                        text: q.text,
                        response: q.response,
                        isKiller: q.isKiller
                    }))
                })),
                result,
                clientName,
                selectedIndustry
            }
        }).select('id').single()

        if (error) {
            console.error("Submission error", error)
            return { success: false, error: error.message }
        }

        const storageKey = user?.id ? `cyrus_draft_v2_${user.id}` : "cyrus_draft_v2_guest"
        localStorage.removeItem(storageKey)

        try {
            const supabase2 = createClient()
            await supabase2
                .from('profiles')
                .update({ draft_data: null })
                .eq('id', user.id)
        } catch (e) {
            console.error("Error clearing cloud draft after submission", e)
        }

        // Clear draft flags and RESET domains to fresh state
        setDomains(JSON.parse(JSON.stringify(DOMAINS)))
        setHasDraft(false)
        setLastSavedTimestamp(null)
        setCurrentDomainIndex(0)
        setCurrentQuestionIndex(0)

        return { success: true, assessmentId: insertedData?.id }
    }, [domains, selectedIndustry, result, clientName])

    const updateProfile = useCallback(async (updates: any) => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return { success: false, error: "Not authenticated" }

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)

        if (error) {
            console.error("Profile update error", error)
            return { success: false, error: error.message }
        }

        setUserProfile((prev: any) => prev ? { ...prev, ...updates } : null)
        if (updates.organization_name) {
            setClientName(updates.organization_name)
        }
        if (updates.industry) {
            setSelectedIndustry(updates.industry)
        }

        return { success: true }
    }, [])

    const signOut = useCallback(async () => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            const storageKey = `cyrus_draft_v2_${user.id}`
            localStorage.removeItem(storageKey)
        }

        localStorage.removeItem("cyrus_draft_v2")
        localStorage.removeItem("cyrus_draft_v2_guest")
        localStorage.removeItem("cyrus_client_name")
        localStorage.removeItem("cyrus_selected_industry")
        sessionStorage.clear()

        await supabase.auth.signOut()
        window.location.href = '/login'
    }, [])

    const value = {
        userRole,
        isAdmin,
        domains,
        selectedIndustry,
        clientName,
        manualOverrideEnabled,
        isIndustryLocked,
        userProfile,
        currentDomainIndex,
        currentQuestionIndex,
        hasDraft,
        lastSavedTimestamp,
        isSaving,
        result,
        completionStats,
        currentStep,
        isLoading,
        setDomains,
        setSelectedIndustry: handleIndustryChange,
        setClientName,
        setManualOverrideEnabled: handleManualOverrideToggle,
        handleDomainWeightChange,
        handleQuestionChange,
        handleKillerToggle,
        handleReset,
        saveDraft,
        autoSaveDraft,
        submitAssessment,
        updateProfile,
        signOut,
        refreshData: fetchQuestionnaire,
        setCurrentDomainIndex,
        setCurrentQuestionIndex
    }

    return <UnderwritingContext.Provider value={value}>{children}</UnderwritingContext.Provider>
}

export function useUnderwriting() {
    const context = useContext(UnderwritingContext)
    if (context === undefined) {
        throw new Error("useUnderwriting must be used within an UnderwritingProvider")
    }
    return context
}
