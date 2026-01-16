"use client"

import { motion } from "framer-motion"
import type { ScoringResult } from "@/lib/scoring-engine"
import { TrendingUp } from "lucide-react"

interface RiskTierCardProps {
  result: ScoringResult
}

export function RiskTierCard({ result }: RiskTierCardProps) {
  const getTierConfig = (tier: string) => {
    switch (tier) {
      case "A":
        return {
          bgColor: "bg-emerald-50 hover:bg-emerald-100",
          borderColor: "border-emerald-300 hover:border-emerald-400",
          textColor: "text-emerald-700",
          badgeColor: "bg-emerald-100 text-emerald-700",
          scoreColor: "text-emerald-600",
          description: "Excellent Controls",
          tooltip: "Score 90-100: Strong cyber posture with comprehensive controls",
        }
      case "B":
        return {
          bgColor: "bg-amber-50 hover:bg-amber-100",
          borderColor: "border-amber-300 hover:border-amber-400",
          textColor: "text-amber-700",
          badgeColor: "bg-amber-100 text-amber-700",
          scoreColor: "text-amber-600",
          description: "Good Controls",
          tooltip: "Score 75-89: Good controls with minor gaps requiring attention",
        }
      case "C":
        return {
          bgColor: "bg-orange-50 hover:bg-orange-100",
          borderColor: "border-orange-300 hover:border-orange-400",
          textColor: "text-orange-700",
          badgeColor: "bg-orange-100 text-orange-700",
          scoreColor: "text-orange-600",
          description: "Fair Controls",
          tooltip: "Score 60-74: Moderate risk with significant control gaps",
        }
      case "D":
        return {
          bgColor: "bg-red-50 hover:bg-red-100",
          borderColor: "border-red-300 hover:border-red-400",
          textColor: "text-red-700",
          badgeColor: "bg-red-100 text-red-700",
          scoreColor: "text-red-600",
          description: "Poor Controls",
          tooltip: "Score <60: Significant gaps - coverage declined",
        }
      default:
        return {
          bgColor: "bg-slate-50",
          borderColor: "border-slate-200",
          textColor: "text-slate-700",
          badgeColor: "bg-slate-100 text-slate-700",
          scoreColor: "text-slate-600",
          description: "Pending",
          tooltip: "Assessment in progress",
        }
    }
  }

  const config = getTierConfig(result.riskTier)

  return (
    <motion.div
      className={`p-6 rounded-lg border-2 transition-all duration-200 cursor-pointer group ${config.bgColor} ${config.borderColor}`}
      whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)" }}
      whileTap={{ scale: 0.98 }}
      title={config.tooltip}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-slate-600 mb-2">RISK TIER ASSIGNMENT</p>
          <motion.div
            className={`text-5xl font-bold ${config.scoreColor}`}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {result.riskTier}
          </motion.div>
        </div>
        <motion.div
          className={`px-3 py-1 rounded-full text-xs font-semibold ${config.badgeColor}`}
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {result.totalScore.toFixed(1)}/100
        </motion.div>
      </div>

      {/* Tier Description */}
      <motion.p
        className={`text-sm font-medium ${config.textColor} mb-3`}
        animate={{ opacity: [0.8, 1] }}
        transition={{ delay: 0.1 }}
      >
        {config.description}
      </motion.p>

      {/* Score Range Information */}
      <motion.div
        className="mb-4 p-2 rounded-md bg-white bg-opacity-50 border border-current border-opacity-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-xs text-slate-600 font-mono">
          {result.riskTier === "A" && "Range: 90 - 100"}
          {result.riskTier === "B" && "Range: 75 - 89"}
          {result.riskTier === "C" && "Range: 60 - 74"}
          {result.riskTier === "D" && "Range: Below 60"}
        </div>
      </motion.div>

      {/* Premium Loading */}
      <div className="pt-3 border-t border-current border-opacity-10">
        <p className="text-xs text-slate-600 mb-1 font-medium">PREMIUM LOADING</p>
        <motion.p
          className={`text-2xl font-bold ${config.scoreColor}`}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {result.premiumLoading}
        </motion.p>
      </div>

      {/* Hover Indicator */}
      <motion.div
        className="mt-4 flex items-center gap-2 text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
        animate={{ x: [0, 2, 0] }}
        transition={{ duration: 0.6 }}
      >
        <TrendingUp size={14} />
        <span>Hover for tier info</span>
      </motion.div>
    </motion.div>
  )
}
