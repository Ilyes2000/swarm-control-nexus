import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Edit, TrendingDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMission } from "@/contexts/MissionContext";

export function MissionSummary() {
  const { summary } = useMission();

  return (
    <AnimatePresence>
      {summary.visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", damping: 20 }}
          className="glass-panel p-5 neon-glow"
        >
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-3">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                Mission Complete
              </h2>
              <p className="text-xs text-foreground/80 leading-relaxed">{summary.result}</p>

              {/* Optimization Visualization */}
              {summary.optimization && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-muted/30 rounded-lg p-3 border border-success/20"
                >
                  <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3 text-success" />
                    Optimization Engine
                  </h3>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-center">
                      <p className="text-[9px] text-muted-foreground font-mono">Original</p>
                      <p className="text-sm font-mono text-foreground/50 line-through">{summary.optimization.originalCost}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-success" />
                    <div className="text-center">
                      <p className="text-[9px] text-muted-foreground font-mono">Optimized</p>
                      <p className="text-sm font-mono text-success font-bold">{summary.optimization.optimizedCost}</p>
                    </div>
                    <div className="ml-2 px-2 py-1 bg-success/15 rounded text-center">
                      <p className="text-[9px] text-success font-mono">Saved</p>
                      <p className="text-sm font-mono text-success font-bold">{summary.optimization.savedAmount}</p>
                      <p className="text-[8px] text-success/70 font-mono">{summary.optimization.savedPercent}</p>
                    </div>
                  </div>
                  {summary.optimization.tradeoffs.length > 0 && (
                    <div className="space-y-1 pt-2 border-t border-border/20">
                      <p className="text-[8px] uppercase tracking-widest text-muted-foreground">Trade-offs</p>
                      {summary.optimization.tradeoffs.map((t, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] font-mono">
                          <span className="text-muted-foreground w-20 truncate">{t.label}</span>
                          <span className="text-foreground/50 line-through">{t.original}</span>
                          <ArrowRight className="w-2.5 h-2.5 text-success" />
                          <span className="text-foreground">{t.optimized}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {summary.costBreakdown.map((item, i) => (
                  <div key={i} className={`text-center ${i === summary.costBreakdown.length - 1 ? "font-bold" : ""}`}>
                    <p className="text-[10px] text-muted-foreground font-mono">{item.label}</p>
                    <p className={`text-sm font-mono ${item.amount.startsWith("-") ? "text-success" : "text-foreground"}`}>
                      {item.amount}
                    </p>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-muted-foreground font-mono">⏱ Completed in {summary.timeTaken}</p>
            </div>

            <div className="flex gap-2 shrink-0">
              <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground">
                <CheckCircle className="w-3 h-3" />
                Confirm
              </Button>
              <Button size="sm" variant="outline">
                <Edit className="w-3 h-3" />
                Modify
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
