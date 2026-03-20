import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, User, Brain, History } from "lucide-react";
import { useMission, MemoryEntry } from "@/contexts/MissionContext";

const typeConfig: Record<MemoryEntry["type"], { icon: React.ReactNode; color: string }> = {
  preference: { icon: <User className="w-2.5 h-2.5" />, color: "bg-primary/15 text-primary border-primary/20" },
  context: { icon: <Database className="w-2.5 h-2.5" />, color: "bg-secondary/15 text-secondary border-secondary/20" },
  decision: { icon: <History className="w-2.5 h-2.5" />, color: "bg-warning/15 text-warning border-warning/20" },
};

export function MemoryPanel() {
  const { memory } = useMission();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [memory.length]);

  const grouped = {
    preference: memory.filter((m) => m.type === "preference"),
    context: memory.filter((m) => m.type === "context"),
    decision: memory.filter((m) => m.type === "decision"),
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1 mb-3 flex items-center gap-1.5">
        <Brain className="w-3.5 h-3.5 text-secondary" />
        Agent Memory
      </h2>

      <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 space-y-3">
        {(["preference", "context", "decision"] as const).map((type) => {
          const items = grouped[type];
          if (items.length === 0) return null;
          const config = typeConfig[type];
          return (
            <div key={type}>
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1">
                {config.icon}
                {type === "preference" ? "User Preferences" : type === "context" ? "Context" : "Past Decisions"}
              </p>
              <AnimatePresence>
                {items.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded p-2 mb-1.5 border ${config.color}`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-semibold">{entry.label}</span>
                      <span className="text-[8px] font-mono text-muted-foreground">{entry.timestamp}</span>
                    </div>
                    <p className="text-[10px] font-mono text-foreground/70 leading-relaxed">{entry.value}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          );
        })}

        {memory.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs font-mono gap-2">
            <Database className="w-6 h-6 opacity-30" />
            <span>No memory data yet...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
