"use client"

import type { Domain, IndustryProfile } from "@/lib/scoring-engine"
import { INDUSTRY_PROFILES } from "@/lib/scoring-engine"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { QuestionRow } from "./question-row"
import { Switch } from "@/components/ui/switch"
import { ShieldCheck, CloudLightning, Globe, ChevronDown, Building2, Settings } from "lucide-react"
import { useUnderwriting } from "@/context/underwriting-context"

interface ControlsPanelProps {
  domains: Domain[]
  selectedIndustryId: string | null
  manualOverrideEnabled: boolean
  expandedDomains: Set<string>
  onDomainToggle: (domainId: string) => void
  onIndustryChange: (industryId: string) => void
  onOverrideToggle: (enabled: boolean) => void
  onDomainWeightChange: (domainId: string, weight: number) => void
  onQuestionChange: (domainId: string, questionId: string, response: number) => void
  onKillerToggle: (domainId: string, questionId: string, isKiller: boolean) => void
}

export function ControlsPanel({
  domains,
  selectedIndustryId,
  manualOverrideEnabled,
  expandedDomains,
  onDomainToggle,
  onIndustryChange,
  onOverrideToggle,
  onDomainWeightChange,
  onQuestionChange,
  onKillerToggle,
}: ControlsPanelProps) {
  const { isAdmin, isIndustryLocked } = useUnderwriting()

  return (
    <div className="flex flex-col bg-white text-si-navy font-inter relative rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Premium Header */}
      <div className="p-8 border-b border-slate-100 bg-gradient-to-b from-white to-slate-50">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-2.5 bg-si-navy text-white rounded-xl shadow-lg shadow-si-navy/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-si-navy tracking-tight uppercase font-outfit">Control Audit</h2>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em]">Active Risk Determinants</p>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-si-blue-primary bg-si-blue-primary/10 px-2 py-1 rounded border border-si-blue-primary/20">LIVE</span>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8 bg-slate-50/50">
        {/* Industry Selector - High Visibility */}
        {!isIndustryLocked && (
          <div className="space-y-3">
            <label className="text-[11px] font-black text-si-navy uppercase tracking-[0.2em] flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-si-blue-primary" />
              Target Industry
            </label>
            <div className="relative group">
              <select
                value={selectedIndustryId || ""}
                onChange={(e) => {
                  onIndustryChange(e.target.value)
                }}
                className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-si-navy font-bold text-sm focus:ring-2 focus:ring-si-blue-primary focus:border-si-blue-primary transition-all shadow-sm group-hover:bg-white"
              >
                <option value="">Select Industry...</option>
                {INDUSTRY_PROFILES.map((industry) => (
                  <option key={industry.id} value={industry.id}>
                    {industry.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Manual Override Toggle - Restricted to Admin */}
        {isAdmin && (
          <div className="p-6 rounded-2xl bg-white shadow-lg border border-slate-100 overflow-hidden relative">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-si-blue-primary animate-spin-[10s]" />
                  <span className="text-[11px] font-black text-si-navy uppercase tracking-widest">Weight Processor</span>
                </div>
                <Switch
                  checked={manualOverrideEnabled}
                  onCheckedChange={onOverrideToggle}
                  className="data-[state=checked]:bg-si-blue-primary"
                />
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Manual Domain Calibration</p>
            </div>

            <AnimatePresence>
              {manualOverrideEnabled && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-6 pt-6 border-t border-slate-100 space-y-4"
                >
                  {domains.map((domain) => (
                    <div key={domain.id} className="flex items-center justify-between gap-4">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter truncate flex-1">{domain.name}</label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={domain.activeWeight}
                          onChange={(e) => onDomainWeightChange(domain.id, Number.parseFloat(e.target.value))}
                          className="w-20 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-black text-si-blue-primary text-center focus:outline-none focus:border-si-blue-primary/50 transition-all"
                        />
                        <span className="absolute right-2 text-[10px] font-bold text-slate-400">%</span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 mt-2 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Weight Status</span>
                    <span className={`text-sm font-black ${domains.reduce((sum, d) => sum + d.activeWeight, 0).toFixed(1) === "100.0" ? "text-emerald-400" : "text-si-red animate-pulse"}`}>
                      {domains.reduce((sum, d) => sum + d.activeWeight, 0).toFixed(1)}%
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute top-0 right-0 w-32 h-32 bg-si-blue-primary/10 blur-3xl -mr-16 -mt-16 pointer-events-none" />
          </div>
        )}

        {/* Domains List */}
        <div className="space-y-6 pb-20">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] px-1">Infrastructure Domains</h3>
          {domains.map((domain) => (
            <motion.div
              key={domain.id}
              id={`domain-${domain.id}`}
              className="si-card !bg-white border border-slate-200 overflow-hidden group/domain"
              whileHover={{ borderColor: "rgba(45, 169, 255, 0.4)", y: -2 }}
              transition={{ duration: 0.3 }}
            >
              <button
                onClick={() => onDomainToggle(domain.id)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-white/[0.02] transition-all duration-300"
              >
                <div>
                  <h4 className="font-black text-si-navy group-hover/domain:text-si-blue-primary transition-colors font-outfit uppercase tracking-tight text-sm">
                    {domain.name}
                  </h4>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${domain.questions.filter(q => q.response !== -1).length === domain.questions.length
                      ? "text-emerald-500"
                      : "text-slate-400"
                      }`}>
                      {domain.questions.filter(q => q.response !== -1).length}/{domain.questions.length} COMPLETED
                    </span>
                    {isAdmin && (
                      <>
                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="text-[10px] font-black text-si-blue-primary uppercase tracking-widest">WEIGHT: {domain.activeWeight}%</span>
                      </>
                    )}
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: expandedDomains.has(domain.id) ? 180 : 0 }}
                  className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/domain:text-si-blue-primary group-hover/domain:bg-si-blue-primary/10 transition-all border border-slate-200"
                >
                  <ChevronDown className="w-5 h-5" />
                </motion.div>
              </button>

              <AnimatePresence>
                {expandedDomains.has(domain.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-100"
                  >
                    <div className="p-6 space-y-6 bg-slate-50/50">
                      {domain.explanation && (
                        <div className="mb-2 px-1 text-xs font-medium text-slate-500 italic flex items-center gap-2">
                          <span className="w-1 h-4 bg-si-blue-primary/30 rounded-full" />
                          {domain.explanation}
                        </div>
                      )}
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
    </div>
  )
}
