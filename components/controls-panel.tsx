"use client"

import type { Domain, IndustryProfile } from "@/lib/scoring-engine"
import { INDUSTRY_PROFILES } from "@/lib/scoring-engine"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { QuestionRow } from "./question-row"
import { Switch } from "@/components/ui/switch"

interface ControlsPanelProps {
  domains: Domain[]
  selectedIndustry: IndustryProfile | null
  manualOverrideEnabled: boolean
  onIndustryChange: (industry: IndustryProfile | null) => void
  onOverrideToggle: (enabled: boolean) => void
  onDomainWeightChange: (domainId: string, weight: number) => void
  onQuestionChange: (domainId: string, questionId: string, response: number) => void
  onKillerToggle: (domainId: string, questionId: string, isKiller: boolean) => void
}

export function ControlsPanel({
  domains,
  selectedIndustry,
  manualOverrideEnabled,
  onIndustryChange,
  onOverrideToggle,
  onDomainWeightChange,
  onQuestionChange,
  onKillerToggle,
}: ControlsPanelProps) {
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set(domains.map((d) => d.id)))

  const toggleDomain = (domainId: string) => {
    const newExpanded = new Set(expandedDomains)
    if (newExpanded.has(domainId)) {
      newExpanded.delete(domainId)
    } else {
      newExpanded.add(domainId)
    }
    setExpandedDomains(newExpanded)
  }

  return (
    <div className="h-full overflow-y-auto p-6 bg-white">
      {/* Header */}
      <div className="mb-8 sticky top-0 bg-white pt-2 pb-4 z-10">
        <h2 className="text-2xl font-bold text-slate-900">Cyber Risk Assessment</h2>
        <p className="text-sm text-slate-500 mt-1">All 95 questions across 19 domains</p>
      </div>

      <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <label className="block text-sm font-semibold text-slate-700 mb-3">Select Industry</label>
        <select
          value={selectedIndustry?.id || ""}
          onChange={(e) => {
            const industry = INDUSTRY_PROFILES.find((ind) => ind.id === e.target.value) || null
            onIndustryChange(industry)
          }}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          {INDUSTRY_PROFILES.map((ind) => (
            <option key={ind.id} value={ind.id}>
              {ind.name}
            </option>
          ))}
        </select>
        {selectedIndustry && <p className="text-xs text-slate-600 mt-2">Selected: {selectedIndustry.name}</p>}
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-semibold text-slate-700">Enable Manual Weight Override</label>
            <p className="text-xs text-slate-600 mt-1">Adjust domain weights individually</p>
          </div>
          <Switch
            checked={manualOverrideEnabled}
            onCheckedChange={onOverrideToggle}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>

        {manualOverrideEnabled && (
          <div className="mt-4 space-y-3">
            {domains.map((domain) => (
              <div key={domain.id} className="flex items-center justify-between gap-3">
                <label className="text-xs font-medium text-slate-700 flex-1 truncate">{domain.name}</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={domain.activeWeight}
                  onChange={(e) => onDomainWeightChange(domain.id, Number.parseFloat(e.target.value))}
                  className="w-16 px-2 py-1 rounded border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
            <div className="pt-2 mt-3 border-t border-blue-200">
              <p className="text-xs text-slate-600">
                Total Weight:{" "}
                <span
                  className={
                    domains.reduce((sum, d) => sum + d.activeWeight, 0) !== 100
                      ? "text-red-600 font-bold"
                      : "text-green-600 font-bold"
                  }
                >
                  {domains.reduce((sum, d) => sum + d.activeWeight, 0).toFixed(1)}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Domains and Questions */}
      <div className="space-y-3">
        {domains.map((domain) => (
          <motion.div key={domain.id} className="border border-slate-300 rounded-lg overflow-hidden">
            {/* Domain Header */}
            <button
              onClick={() => toggleDomain(domain.id)}
              className="w-full flex items-center justify-between p-4 bg-slate-100 hover:bg-slate-150 transition-colors border-b border-slate-300"
            >
              <div className="text-left">
                <h3 className="font-bold text-slate-900">{domain.name}</h3>
                <p className="text-xs text-slate-600">
                  {domain.questions.length} questions • Weight: {domain.activeWeight}%
                </p>
              </div>
              <motion.div
                animate={{ rotate: expandedDomains.has(domain.id) ? 180 : 0 }}
                className="text-slate-500 text-lg"
              >
                ▼
              </motion.div>
            </button>

            {/* Questions */}
            <AnimatePresence>
              {expandedDomains.has(domain.id) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-white border-t border-slate-200"
                >
                  <div className="p-4 space-y-4">
                    {domain.questions.map((question) => (
                      <QuestionRow
                        key={question.id}
                        question={question}
                        onResponseChange={(response) => onQuestionChange(domain.id, question.id, response)}
                        onKillerToggle={(isKiller) => onKillerToggle(domain.id, question.id, isKiller)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
