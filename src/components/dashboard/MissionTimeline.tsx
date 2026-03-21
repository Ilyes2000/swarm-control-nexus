import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, X, RefreshCw, ArrowRight } from "lucide-react";
import { useMission, TimelineEntry } from "@/contexts/MissionContext";

const statusIcon: Record<TimelineEntry["status"], React.ReactNode> = {
  success: <Check className="w-3 h-3 text-success" />,
  pending: <Clock className="w-3 h-3 text-warning" />,
  failed: <X className="w-3 h-3 text-destructive" />,
  retrying: <RefreshCw className="w-3 h-3 text-warning animate-spin" />,
  fallback: <ArrowRight className="w-3 h-3 text-secondary" />,
};

const statusBg: Record<TimelineEntry["status"], string> = {
  success: "border-success/30",
  pending: "border-warning/30",
  failed: "border-destructive/30 bg-destructive/5",
  retrying: "border-warning/30 bg-warning/5",
  fallback: "border-secondary/30 bg-secondary/5",
};

export function MissionTimeline() {
  const { timeline } = useMission();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [timeline.length]);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1 mb-3">
        Mission Timeline
      </h2>
      <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 relative">
        {timeline.length > 0 && (
          <div className="absolute left-[15px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/60 via-primary/30 to-transparent" />
        )}

        <AnimatePresence>
          {timeline.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -12, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.4, type: "spring", damping: 20 }}
              className={`flex gap-3 mb-3 relative rounded-lg p-1.5 ${
                entry.status === "failed" || entry.status === "retrying" || entry.status === "fallback"
                  ? statusBg[entry.status]
                  : ""
              } ${entry.description.includes("Learning from failure") || entry.description.includes("New skill") ? "learning-active" : ""}`}
            >
              <div className={`w-8 h-8 rounded-full bg-muted border flex items-center justify-center text-sm shrink-0 z-10 ${
                entry.status === "failed" ? "border-destructive/50" : "border-border"
              }`}>
                {entry.agentEmoji}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-mono text-muted-foreground">{entry.timestamp}</span>
                  <span className="text-[10px] font-semibold text-foreground/70">{entry.agentName}</span>
                  {statusIcon[entry.status]}
                  {entry.retryCount && entry.retryCount > 0 && (
                    <span className="text-[8px] font-mono text-warning bg-warning/10 px-1 rounded">
                      retry #{entry.retryCount}
                    </span>
                  )}
                </div>
                <p className={`text-xs leading-relaxed ${
                  entry.status === "failed" ? "text-destructive/80 line-through" : "text-foreground/80"
                }`}>{entry.description}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {timeline.length === 0 && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs font-mono">
            Awaiting mission start...
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
