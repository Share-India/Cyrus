"use client"

import type { Domain, ScoringResult } from "@/lib/scoring-engine"
import { motion } from "framer-motion"
import { RiskTierCard } from "./risk-tier-card"

interface RiskEngineProps {
  result: ScoringResult
  domains: Domain[]
}

export function RiskEngine({ result, domains }: RiskEngineProps) {
  return (
    <motion.div className="h-full flex flex-col p-8 bg-slate-50 overflow-y-auto">
      <h2 className="text-2xl font-bold text-slate-900 mb-8">Risk Assessment Engine</h2>

      {/* Overall Score Display */}
      <motion.div
        className="bg-white rounded-lg border-2 border-slate-200 p-6 mb-8 text-center"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <p className="text-sm text-slate-600 mb-2">OVERALL SCORE</p>
        <motion.div
          className="text-6xl font-bold mb-2"
          animate={{
            color:
              result.totalScore >= 85
                ? "#059669"
                : result.totalScore >= 70
                  ? "#f59e0b"
                  : result.totalScore >= 50
                    ? "#ea580c"
                    : "#dc2626",
          }}
        >
          {result.totalScore.toFixed(2)}
        </motion.div>
        <p className="text-sm text-slate-600">/100</p>
      </motion.div>

      {/* Risk Tier Assignment */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <RiskTierCard result={result} />
      </motion.div>

      {/* Auto-Decline Warning */}
      {result.autoDeclined && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-8"
        >
          <p className="font-bold text-red-900 mb-2">Auto-Decline Triggered</p>
          <p className="text-sm text-red-800 mb-3">2 or more critical killer controls have failed:</p>
          <ul className="space-y-1 text-sm text-red-700">
            {result.failedKillers.map((killer) => (
              <li key={killer.id} className="flex items-start gap-2">
                <span className="text-red-600 font-bold mt-1">•</span>
                <span>{killer.id}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Domain Scores with Weight Comparison */}
      <div className="bg-white rounded-lg border-2 border-slate-200 p-6">
        <p className="text-sm font-bold text-slate-900 mb-4">DOMAIN BREAKDOWN</p>
        <div className="space-y-3">
          {result.domainScores.map((domain) => (
            <motion.div
              key={domain.domain}
              className="p-3 rounded-lg border border-slate-200 hover:border-emerald-400 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-slate-900 text-sm">{domain.domain}</p>
                  <p className="text-xs text-slate-500">
                    Default: {domain.defaultWeight}% | Active: {domain.activeWeight}%
                  </p>
                </div>
                <p className="text-sm font-bold text-slate-900">{domain.score.toFixed(2)}%</p>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                <motion.div
                  className="h-full bg-emerald-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(domain.score, 100)}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <p className="text-slate-500">
                  Earned: {domain.earnedScore.toFixed(1)}/{domain.maxScore}
                </p>
                <p className="text-slate-600 font-semibold">Contribution: {domain.contribution.toFixed(2)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
