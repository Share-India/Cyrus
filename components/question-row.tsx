"use client"

import { useState } from "react"
import type { UnderwritingQuestion } from "@/lib/scoring-engine"
import { motion } from "framer-motion"
import { Switch } from "@/components/ui/switch"

interface QuestionRowProps {
  question: UnderwritingQuestion
  onResponseChange: (value: number) => void
  onKillerToggle: (isKiller: boolean) => void
}

export function QuestionRow({ question, onResponseChange, onKillerToggle }: QuestionRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const questionWeight = question.isKiller ? 3 : 1
  const weightedScore = question.response * questionWeight

  return (
    <motion.div className="border border-slate-200 rounded-lg p-4 bg-white hover:bg-slate-50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">{question.id}</span>
            {question.isKiller && (
              <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">KILLER CONTROL</span>
            )}
          </div>
          <p className="text-sm text-slate-900 font-medium">{question.text}</p>
        </div>

        {/* Killer Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Killer</span>
          <Switch
            checked={question.isKiller}
            onCheckedChange={onKillerToggle}
            className="data-[state=checked]:bg-red-600"
          />
        </div>
      </div>

      {/* Response Control */}
      <div className="mt-4 flex items-end gap-4">
        <div className="flex-1">
          {question.type === "binary" && (
            <div className="flex gap-2">
              <button
                onClick={() => onResponseChange(1)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  question.response === 1
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => onResponseChange(0)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  question.response === 0 ? "bg-red-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                No
              </button>
            </div>
          )}

          {(question.type === "frequency" ||
            question.type === "multiple" ||
            question.type === "coverage" ||
            question.type === "governance") && (
            <select
              value={question.response}
              onChange={(e) => onResponseChange(Number.parseFloat(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value={0}>Select option...</option>
              {question.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Weighted Score Display */}
        <div className="text-right min-w-max">
          <div className="text-xs text-slate-500 mb-1">Weighted Score</div>
          <div className={`text-lg font-bold ${weightedScore > 0 ? "text-emerald-600" : "text-red-600"}`}>
            {weightedScore.toFixed(2)}
          </div>
          <div className="text-xs text-slate-500">
            {question.response} × {questionWeight}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
