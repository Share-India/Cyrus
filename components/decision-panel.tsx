"use client"

import { useState } from "react"
import type { ScoringResult } from "@/lib/scoring-engine"
import { DecisionBadge } from "./decision-badge"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, Info } from "lucide-react"

interface DecisionPanelProps {
  result: ScoringResult
}

export function DecisionPanel({ result }: DecisionPanelProps) {
  const [expandedReasons, setExpandedReasons] = useState<boolean>(false)

  const getReasons = (): string[] => {
    const reasons: string[] = []

    if (result.autoDeclined) {
      reasons.push("Multiple critical killer controls have failed - automatic decline triggered")
      return reasons
    }

    if (result.declineNarrative) {
      reasons.push(result.declineNarrative)
    }

    if (result.totalScore < 60) {
      reasons.push("Overall cyber posture is below minimum standards for coverage")
    } else if (result.totalScore < 75) {
      reasons.push("Additional security measures required before full approval")
    }

    const weakDomains = result.domainScores.filter((d) => d.score < 50)
    if (weakDomains.length > 0) {
      reasons.push(`Critical gaps in: ${weakDomains.map((d) => d.domain).join(", ")}`)
    }

    if (result.riskTier === "B") {
      reasons.push("Risk tier B warrants +20% premium loading due to control gaps")
    } else if (result.riskTier === "C") {
      reasons.push("Risk tier C warrants +50% premium loading due to significant control gaps")
    }

    return reasons.slice(0, 4)
  }

  const reasons = getReasons()

  return (
    <motion.div
      className={`h-full flex flex-col p-8 overflow-y-auto`}
      animate={{
        backgroundColor: result.autoDeclined ? "#fef2f2" : "#ffffff",
      }}
    >
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Underwriting Decision</h2>

      <DecisionBadge result={result} />

      <AnimatePresence>
        {reasons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <button
              onClick={() => setExpandedReasons(!expandedReasons)}
              className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
            >
              <Info size={16} />
              <span>Decision Factors</span>
              <motion.div animate={{ rotate: expandedReasons ? 180 : 0 }}>▼</motion.div>
            </button>

            <AnimatePresence>
              {expandedReasons && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 space-y-2"
                >
                  {reasons.map((reason, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200"
                    >
                      <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-slate-700">{reason}</p>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Killer Controls Status */}
      {result.failedKillers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 rounded-lg bg-red-50 border-2 border-red-300"
        >
          <p className="font-bold text-red-900 text-sm mb-2">Failed Critical Controls:</p>
          <ul className="space-y-1">
            {result.failedKillers.map((killer) => (
              <li key={killer.id} className="text-xs text-red-700 flex items-start gap-2">
                <span className="font-bold text-red-600 mt-1">•</span>
                <div>
                  <p className="font-semibold">{killer.id}</p>
                  <p className="text-red-600">{killer.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      <div className="mt-auto pt-6 border-t border-slate-200">
        <div className="text-xs text-slate-500 text-center">
          <p>Deterministic underwriting engine</p>
          <p className="mt-1">All decisions are fully explainable and based on 95 weighted control questions</p>
        </div>
      </div>
    </motion.div>
  )
}
