"use client"

import { motion } from "framer-motion"
import type { ScoringResult } from "@/lib/scoring-engine"
import { CheckCircle, AlertCircle, XCircle } from "lucide-react"

interface DecisionBadgeProps {
  result: ScoringResult
}

export function DecisionBadge({ result }: DecisionBadgeProps) {
  const getDecisionConfig = (tier: string, autoDeclined: boolean) => {
    if (autoDeclined) {
      return {
        color: "bg-red-50 border-red-300",
        textColor: "text-red-700",
        icon: XCircle,
        label: "AUTO-DECLINED",
        description: "Critical controls failed - coverage unavailable",
      }
    }

    switch (tier) {
      case "A":
        return {
          color: "bg-emerald-50 border-emerald-300",
          textColor: "text-emerald-700",
          icon: CheckCircle,
          label: "APPROVED - TIER A",
          description: "Excellent controls - Base rate",
        }
      case "B":
        return {
          color: "bg-amber-50 border-amber-300",
          textColor: "text-amber-700",
          icon: AlertCircle,
          label: "APPROVED - TIER B",
          description: "Good controls - +20% premium loading",
        }
      case "C":
        return {
          color: "bg-orange-50 border-orange-300",
          textColor: "text-orange-700",
          icon: AlertCircle,
          label: "APPROVED - TIER C",
          description: "Fair controls - +50% premium loading",
        }
      case "D":
        return {
          color: "bg-red-50 border-red-300",
          textColor: "text-red-700",
          icon: XCircle,
          label: "DECLINED",
          description: "Poor controls - Coverage declined",
        }
      default:
        return {
          color: "bg-slate-50 border-slate-200",
          textColor: "text-slate-700",
          icon: AlertCircle,
          label: "PENDING",
          description: "Assessment in progress",
        }
    }
  }

  const config = getDecisionConfig(result.riskTier, result.autoDeclined)
  const IconComponent = config.icon

  return (
    <motion.div
      className={`p-6 rounded-lg border-2 ${config.color} cursor-pointer`}
      animate={{
        boxShadow: result.autoDeclined ? "0 0 20px rgba(220, 38, 38, 0.2)" : "none",
      }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 10 }}
    >
      <motion.div className="flex items-center gap-3 mb-3" animate={{ scale: result.autoDeclined ? 1.05 : 1 }}>
        <IconComponent className={`w-8 h-8 ${config.textColor}`} />
        <div>
          <div className={`text-lg font-bold ${config.textColor}`}>{config.label}</div>
          <div className={`text-xs ${config.textColor} opacity-75`}>{config.description}</div>
        </div>
      </motion.div>

      <motion.div
        className="mt-4 pt-4 border-t border-current border-opacity-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-sm font-semibold text-slate-700 mb-2">Premium Loading</div>
        <motion.div
          className={`text-3xl font-bold ${config.textColor}`}
          animate={{
            scale: result.autoDeclined ? 1.1 : 1,
          }}
        >
          {result.premiumLoading}
        </motion.div>
        <p className="text-xs text-slate-500 mt-1">Risk tier assignment</p>
      </motion.div>
    </motion.div>
  )
}
