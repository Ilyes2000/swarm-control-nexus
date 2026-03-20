import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ChevronRight, Sparkles, TrendingUp } from "lucide-react";
import { useMission, ReasoningEntry } from "@/contexts/MissionContext";

function ConfidenceBar({ value }: { value: number }) {
  const color =
    value >= 90 ? "bg-success" : value >= 70 ? "bg-primary" : value >= 50 ? "bg-warning" : "bg-destructive";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{value}%</span>
    </div>
  );
}

function ReasoningCard({ entry }: { entry: ReasoningEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-panel p-3 cursor-pointer hover:border-primary/30 transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-2">
        <span className="text-base mt-0.5">{entry.agentEmoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-semibold text-foreground/70">{entry.agentName}</span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-mono text-muted-foreground">{entry.timestamp}</span>
              <ChevronRight
                className={`w-3 h-3 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`}
              />
            </div>
          </div>

          <p className="text-[11px] font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-primary shrink-0" />
            {entry.decision}
          </p>

          <div className="mb-1.5">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">Confidence</p>
            <ConfidenceBar value={entry.confidence} />
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-2 border-t border-border/30 space-y-2">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                      <Brain className="w-2.5 h-2.5" /> Reasoning
                    </p>
                    <p className="text-[11px] text-foreground/70 leading-relaxed font-mono">{entry.reasoning}</p>
                  </div>

                  {entry.alternatives.length > 0 && (
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                        <TrendingUp className="w-2.5 h-2.5" /> Alternatives Considered
                      </p>
                      <ul className="space-y-0.5">
                        {entry.alternatives.map((alt, i) => (
                          <li key={i} className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
                            {alt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export function ExplainabilityPanel() {
  const { reasoning } = useMission();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [reasoning.length]);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1 mb-3 flex items-center gap-1.5">
        <Brain className="w-3.5 h-3.5 text-primary" />
        Agent Reasoning
      </h2>

      <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 space-y-2">
        <AnimatePresence>
          {reasoning.map((entry) => (
            <ReasoningCard key={entry.id} entry={entry} />
          ))}
        </AnimatePresence>

        {reasoning.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs font-mono gap-2">
            <Brain className="w-6 h-6 opacity-30" />
            <span>No reasoning data yet...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
