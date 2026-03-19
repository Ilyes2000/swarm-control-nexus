import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, X } from "lucide-react";
import { useMission } from "@/contexts/MissionContext";

const statusIcon = {
  success: <Check className="w-3 h-3 text-success" />,
  pending: <Clock className="w-3 h-3 text-warning" />,
  failed: <X className="w-3 h-3 text-destructive" />,
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
        {/* Glowing vertical line */}
        {timeline.length > 0 && (
          <div className="absolute left-[15px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/60 via-primary/30 to-transparent" />
        )}

        <AnimatePresence>
          {timeline.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="flex gap-3 mb-4 relative"
            >
              {/* Dot */}
              <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-sm shrink-0 z-10">
                {entry.agentEmoji}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-mono text-muted-foreground">{entry.timestamp}</span>
                  <span className="text-[10px] font-semibold text-foreground/70">{entry.agentName}</span>
                  {statusIcon[entry.status]}
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">{entry.description}</p>
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
