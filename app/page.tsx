"use client"

import { useState, useCallback, useMemo } from "react"
import {
  DOMAINS,
  calculateScore,
  INDUSTRY_PROFILES,
  getIndustryWeights,
  type Domain,
  type ScoringResult,
  type IndustryProfile,
} from "@/lib/scoring-engine"
import { ControlsPanel } from "@/components/controls-panel"
import { RiskEngine } from "@/components/risk-engine"
import { DecisionPanel } from "@/components/decision-panel"
import { motion } from "framer-motion"

export default function Home() {
  const [domains, setDomains] = useState<Domain[]>(DOMAINS)
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryProfile | null>(INDUSTRY_PROFILES[0])
  const [manualOverrideEnabled, setManualOverrideEnabled] = useState(false)

  const handleIndustryChange = (industry: IndustryProfile | null) => {
    setSelectedIndustry(industry)
    if (!manualOverrideEnabled) {
      const updatedDomains = getIndustryWeights(industry, domains)
      setDomains(updatedDomains)
    }
  }

  const handleOverrideToggle = (enabled: boolean) => {
    setManualOverrideEnabled(enabled)
    if (!enabled) {
      // Reset to industry defaults when disabling override
      const updatedDomains = getIndustryWeights(selectedIndustry, domains)
      setDomains(updatedDomains)
    }
  }

  const handleDomainWeightChange = (domainId: string, newWeight: number) => {
    setDomains((prevDomains) =>
      prevDomains.map((domain) => (domain.id === domainId ? { ...domain, activeWeight: newWeight } : domain)),
    )
  }

  const result: ScoringResult = useMemo(() => {
    return calculateScore(domains)
  }, [domains])

  const handleQuestionChange = useCallback((domainId: string, questionId: string, response: number) => {
    setDomains((prevDomains) =>
      prevDomains.map((domain) => {
        if (domain.id === domainId) {
          return {
            ...domain,
            questions: domain.questions.map((question) =>
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
      prevDomains.map((domain) => {
        if (domain.id === domainId) {
          return {
            ...domain,
            questions: domain.questions.map((question) =>
              question.id === questionId ? { ...question, isKiller } : question,
            ),
          }
        }
        return domain
      }),
    )
  }, [])

  const handleReset = useCallback(() => {
    setDomains(DOMAINS)
    setSelectedIndustry(INDUSTRY_PROFILES[0])
    setManualOverrideEnabled(false)
  }, [])

  return (
    <motion.div className="w-full h-screen bg-white flex flex-col">
      {/* Header */}
      <motion.header className="border-b border-slate-200 bg-white px-8 py-6 flex items-center justify-between">
        <motion.div>
          <h1 className="text-3xl font-bold text-slate-900">CYRUS</h1>
          <p className="text-sm text-slate-500 mt-1">Share India Cyber Underwriting System</p>
        </motion.div>

        <motion.button
          onClick={handleReset}
          className="px-6 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Reset All
        </motion.button>
      </motion.header>

      {/* Main Content - Three Panel Layout */}
      <motion.div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Controls (Questions) */}
        <motion.div
          className="w-1/3 border-r border-slate-200 overflow-y-auto"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <ControlsPanel
            domains={domains}
            selectedIndustry={selectedIndustry}
            manualOverrideEnabled={manualOverrideEnabled}
            onIndustryChange={handleIndustryChange}
            onOverrideToggle={handleOverrideToggle}
            onDomainWeightChange={handleDomainWeightChange}
            onQuestionChange={handleQuestionChange}
            onKillerToggle={handleKillerToggle}
          />
        </motion.div>

        {/* Center Panel - Risk Engine */}
        <motion.div className="w-1/3 border-r border-slate-200 overflow-y-auto">
          <RiskEngine result={result} domains={domains} />
        </motion.div>

        {/* Right Panel - Decision */}
        <motion.div className="w-1/3 overflow-y-auto">
          <DecisionPanel result={result} />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
