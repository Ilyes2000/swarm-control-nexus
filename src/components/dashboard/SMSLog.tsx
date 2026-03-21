import { motion, AnimatePresence } from "framer-motion";
import { useMission } from "@/contexts/MissionContext";

export function SMSLog() {
  const { smsLog } = useMission();

  return (
    <div className="space-y-2">
      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
        💬 Coach Feed
      </h3>

      <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
        <AnimatePresence>
          {smsLog.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.direction === "sent" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-[11px] ${
                  msg.direction === "sent"
                    ? "bg-primary/20 text-foreground border border-primary/20"
                    : "bg-muted text-foreground border border-border"
                }`}
              >
                <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                <p className="text-[9px] text-muted-foreground mt-1 font-mono">{msg.timestamp}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {smsLog.length === 0 && (
          <div className="glass-panel p-4 flex items-center justify-center text-muted-foreground text-xs font-mono">
            No coach nudges yet
          </div>
        )}
      </div>
    </div>
  );
}
