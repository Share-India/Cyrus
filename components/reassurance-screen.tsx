"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, ShieldCheck } from "lucide-react"

interface ReassuranceScreenProps {
    onDismiss: () => void
}

export function ReassuranceScreen({ onDismiss }: ReassuranceScreenProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-xl"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", duration: 0.8 }}
                className="max-w-md w-full mx-6 p-8 bg-white rounded-3xl shadow-2xl border border-si-blue-primary/10 relative overflow-hidden text-center"
            >
                {/* Background Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-si-blue-primary/5 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-si-navy/5 rounded-tr-full -ml-8 -mb-8 pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 bg-si-blue-primary/10 rounded-2xl flex items-center justify-center mb-6 text-si-blue-primary">
                        <ShieldCheck className="w-8 h-8" />
                    </div>

                    <h2 className="text-2xl font-black text-si-navy mb-4 font-outfit tracking-tight leading-tight">
                        Compliance Check
                    </h2>

                    <p className="text-slate-600 font-medium text-lg leading-relaxed mb-8">
                        “This questionnaire looks long — that’s normal for cyber insurance”
                    </p>

                    <motion.button
                        onClick={onDismiss}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 bg-si-navy hover:bg-si-blue-primary text-white rounded-xl font-bold tracking-widest uppercase transition-all shadow-xl shadow-si-navy/20 flex items-center justify-center gap-2 group"
                    >
                        <span>Proceed to Assessment</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    )
}
