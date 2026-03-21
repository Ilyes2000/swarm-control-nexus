import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, ArrowRight, ShieldAlert, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMission } from "@/contexts/MissionContext";

export function MissionSummary() {
  const { summary } = useMission();
  const metricCards = summary.metrics?.length
    ? summary.metrics
    : summary.costBreakdown.map((item) => ({ label: item.label, value: item.amount, tone: "info" as const }));

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
                {summary.missionTitle || "Study Mission Ready"}
              </h2>
              <p className="text-xs text-foreground/80 leading-relaxed">{summary.result}</p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid gap-3 md:grid-cols-[180px_1fr]"
              >
                <div className="rounded-lg border border-success/20 bg-success/10 p-3 text-center">
                  <p className="text-[9px] font-mono uppercase tracking-[0.2em] text-success/80">Readiness</p>
                  <p className="mt-1 text-3xl font-semibold text-success">{summary.readinessScore ?? 0}%</p>
                  <p className="mt-1 text-[10px] font-mono text-muted-foreground">Risk {summary.riskLevel ?? "low"}</p>
                </div>
                <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
                  <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                    <Sparkles className="w-3 h-3 text-primary" />
                    Next Actions
                  </div>
                  <div className="space-y-2">
                    {(summary.nextActions ?? []).slice(0, 3).map((action, index) => (
                      <div key={index} className="flex items-start gap-2 text-[11px] text-foreground/80">
                        <ArrowRight className="mt-0.5 h-3 w-3 text-primary shrink-0" />
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {metricCards.map((item, i) => (
                  <div key={i} className="rounded-lg border border-border/30 bg-muted/20 p-3 text-center">
                    <p className="text-[10px] text-muted-foreground font-mono">{item.label}</p>
                    <p
                      className={`text-sm font-mono ${
                        item.tone === "success"
                          ? "text-success"
                          : item.tone === "warning"
                            ? "text-warning"
                            : "text-foreground"
                      }`}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {!!summary.focusAreas?.length && (
                <div className="rounded-lg border border-border/30 bg-muted/20 p-3">
                  <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                    <Target className="w-3 h-3 text-secondary" />
                    Focus Areas
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {summary.focusAreas.map((area) => (
                      <span key={area} className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-mono text-primary">
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground font-mono">⏱ Completed in {summary.timeTaken}</p>
            </div>

            <div className="flex gap-2 shrink-0">
              <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground">
                <CheckCircle className="w-3 h-3" />
                Sync Plan
              </Button>
              <Button size="sm" variant="outline">
                <ShieldAlert className="w-3 h-3" />
                Replan
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
