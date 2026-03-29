// =============================================================
// AI SUGGESTION PANEL - Real-time category & anomaly feedback
// =============================================================
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, AlertTriangle, Copy, Zap, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CategorySuggestion, DuplicateAlert, AnomalyAlert } from '@/lib/aiEngine';

interface AISuggestionPanelProps {
  categorySuggestion: CategorySuggestion | null;
  duplicateAlerts: DuplicateAlert[];
  anomalyAlerts: AnomalyAlert[];
  onAcceptCategory: (id: string) => void;
  isAnalyzing: boolean;
}

const severityColors = {
  low: 'from-amber-500/10 to-yellow-500/5 border-amber-500/20 text-amber-400',
  medium: 'from-orange-500/10 to-red-500/5 border-orange-500/20 text-orange-400',
  high: 'from-red-500/15 to-rose-500/5 border-red-500/25 text-red-400',
};

export const AISuggestionPanel: React.FC<AISuggestionPanelProps> = ({
  categorySuggestion,
  duplicateAlerts,
  anomalyAlerts,
  onAcceptCategory,
  isAnalyzing,
}) => {
  const hasContent = categorySuggestion || duplicateAlerts.length > 0 || anomalyAlerts.length > 0 || isAnalyzing;

  return (
    <AnimatePresence>
      {hasContent && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3"
        >
          {/* Analyzing indicator */}
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-indigo-500/8 border border-indigo-500/15"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              >
                <Brain className="w-4 h-4 text-indigo-400" />
              </motion.div>
              <span className="text-xs text-indigo-300 font-medium">AI analyzing your expense...</span>
              <div className="ml-auto flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 h-1 rounded-full bg-indigo-400"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Category Suggestion */}
          <AnimatePresence>
            {categorySuggestion && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/5 border border-indigo-500/20"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-indigo-300 mb-0.5">AI Category Suggestion</p>
                  <p className="text-xs text-zinc-400 truncate">{categorySuggestion.reason}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Confidence bar */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${categorySuggestion.confidence * 100}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500 tabular-nums">
                      {Math.round(categorySuggestion.confidence * 100)}%
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onAcceptCategory(categorySuggestion.categoryId)}
                    className="h-7 px-3 text-xs bg-indigo-600/80 hover:bg-indigo-500 text-white border-0 rounded-lg"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {categorySuggestion.categoryName}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Anomaly Alerts */}
          <AnimatePresence>
            {anomalyAlerts.map((alert, i) => (
              <motion.div
                key={`anomaly-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-start gap-3 px-4 py-3 rounded-xl bg-gradient-to-r border ${severityColors[alert.severity]}`}
              >
                <div className="w-7 h-7 rounded-lg bg-current/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs font-semibold">Anomaly Detected</p>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wide ${
                      alert.severity === 'high' ? 'bg-red-500/20' : alert.severity === 'medium' ? 'bg-orange-500/20' : 'bg-amber-500/20'
                    }`}>{alert.severity}</span>
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed">{alert.message}</p>
                  <p className="text-[11px] opacity-60 mt-0.5 leading-relaxed">{alert.context}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Duplicate Alerts */}
          <AnimatePresence>
            {duplicateAlerts.map((alert, i) => (
              <motion.div
                key={`dup-${alert.expense.id}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: i * 0.05 }}
                className="px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/20"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-amber-300">Possible Duplicate</p>
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-bold">
                        {Math.round(alert.similarity * 100)}% match
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">{alert.reasons.join(' · ')}</p>
                  </div>
                </div>
                {/* Side by side comparison */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/5">
                    <p className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wide font-semibold">Existing</p>
                    <p className="text-xs text-zinc-300 font-medium truncate">{alert.expense.description}</p>
                    <p className="text-sm font-bold text-amber-400 mt-1">${alert.expense.amount.toFixed(2)}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">{new Date(alert.expense.expenseDate).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-indigo-500/[0.06] rounded-lg p-2.5 border border-indigo-500/15">
                    <p className="text-[10px] text-indigo-400 mb-1 uppercase tracking-wide font-semibold">This expense</p>
                    <p className="text-xs text-zinc-300 font-medium">New submission</p>
                    <p className="text-[10px] text-indigo-400 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Review before submitting
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
