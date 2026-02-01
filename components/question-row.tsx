"use client"

import type { UnderwritingQuestion } from "@/lib/scoring-engine"
import { motion } from "framer-motion"
import { Switch } from "@/components/ui/switch"
import { useUnderwriting } from "@/context/underwriting-context"

interface QuestionRowProps {
  question: UnderwritingQuestion
  onResponseChange: (value: number) => void
  onKillerToggle: (isKiller: boolean) => void
}

export function QuestionRow({ question, onResponseChange, onKillerToggle }: QuestionRowProps) {
  const questionWeight = question.isKiller ? 3 : 1
  const weightedScore = question.response * questionWeight
  const { isAdmin } = useUnderwriting()

  return (
    <motion.div
      className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-si-blue-primary/30 transition-all duration-300 group/row"
      whileHover={{ y: -2 }}
    >
      <div className="flex items-start justify-between gap-5">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[9px] font-black text-si-blue-primary bg-si-blue-primary/10 px-2.5 py-1 rounded-lg tracking-widest uppercase border border-si-blue-primary/20">
              {question.id}
            </span>
            {isAdmin && question.isKiller && (
              <span className="text-[9px] font-black text-white bg-si-red px-2.5 py-1 rounded-lg tracking-widest uppercase shadow-lg shadow-si-red/20">
                Killer Control
              </span>
            )}
            {!isAdmin && question.isKiller && question.response === 0 && (
              <span className="text-[9px] font-black text-white bg-si-red px-2.5 py-1 rounded-lg tracking-widest uppercase shadow-lg shadow-si-red/20 animate-pulse">
                Critical Failure
              </span>
            )}
          </div>
          <p className="text-[13px] text-si-navy font-bold leading-relaxed transition-colors tracking-tight">
            {question.text}
          </p>
        </div>

        {/* Killer Toggle - Restricted to Admin */}
        {isAdmin && (
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 h-fit">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Killer</span>
            <Switch
              checked={question.isKiller}
              onCheckedChange={onKillerToggle}
              className="data-[state=checked]:bg-si-red scale-75"
            />
          </div>
        )}
      </div>

      {/* Response Control */}
      <div className="mt-6 flex items-center justify-between gap-8">
        <div className="flex-1">
          {question.type === "binary" ? (
            <div className="flex gap-3">
              <button
                onClick={() => onResponseChange(question.response === 1 ? -1 : 1)}
                className={`flex-1 px-5 py-3 rounded-xl text-[11px] font-black tracking-widest transition-all duration-300 transform min-h-[44px] ${question.response === 1
                  ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 ring-2 ring-emerald-500 ring-offset-2"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 border border-slate-200"
                  }`}
                aria-pressed={question.response === 1}
              >
                YES
              </button>
              <button
                onClick={() => onResponseChange(question.response === 0 ? -1 : 0)}
                className={`flex-1 px-5 py-3 rounded-xl text-[11px] font-black tracking-widest transition-all duration-300 transform min-h-[44px] ${question.response === 0
                  ? "bg-si-red text-white shadow-xl shadow-si-red/20 ring-2 ring-si-red ring-offset-2"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 border border-slate-200"
                  }`}
                aria-pressed={question.response === 0}
              >
                NO
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <div className="flex-1 relative group/select">
                <select
                  value={question.response <= 0 ? "" : question.response}
                  onChange={(e) => {
                    const val = e.target.value
                    onResponseChange(val === "" ? -1 : Number.parseFloat(val))
                  }}
                  className={`w-full pl-4 pr-10 py-3 rounded-xl border text-[11px] font-black focus:outline-none focus:ring-2 focus:ring-si-blue-primary transition-all appearance-none cursor-pointer min-h-[44px] ${question.response > -1
                    ? "bg-slate-50 border-si-blue-primary text-si-navy"
                    : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}
                  aria-label="Select maturity level"
                >
                  <option value="">Select maturity level (Clear)</option>
                  {question.options?.filter(opt => opt.value !== 0).map((opt) => (
                    <option key={opt.value} value={opt.value} className="text-si-navy">
                      {opt.label}
                    </option>
                  ))}
                  {/* Ensure 0 option exists as a fallback in dropdown if needed */}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover/select:text-si-blue-primary transition-colors text-[10px]">
                  ▼
                </div>
              </div>
              <button
                onClick={() => onResponseChange(question.response === 0 ? -1 : 0)}
                className={`flex-1 px-5 py-3 rounded-xl text-[11px] font-black tracking-widest transition-all duration-300 transform min-h-[44px] max-w-[120px] ${question.response === 0
                  ? "bg-si-red text-white shadow-xl shadow-si-red/20 ring-2 ring-si-red ring-offset-2"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 border border-slate-200"
                  }`}
                aria-pressed={question.response === 0}
              >
                NO
              </button>
            </div>
          )}
        </div>

        {/* Score Display - Restricted to Admin */}
        {isAdmin && (
          <div className="flex flex-col items-end min-w-[90px]">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Impact Factor</span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-black font-outfit ${weightedScore > 0 ? "text-si-blue-primary" : "text-slate-200"}`}>
                {weightedScore.toFixed(1)}
              </span>
              <span className="text-[10px] font-bold text-slate-300">pts</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
