import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, PhoneCall } from "lucide-react";
import { useMission } from "@/contexts/MissionContext";

export function LiveCallView() {
  const { call } = useMission();

  const statusConfig = {
    ringing: { icon: <Phone className="w-4 h-4" />, label: "Ringing...", color: "text-warning" },
    connected: { icon: <PhoneCall className="w-4 h-4" />, label: "Connected", color: "text-success" },
    ended: { icon: <PhoneOff className="w-4 h-4" />, label: "Call Ended", color: "text-muted-foreground" },
  };

  const config = statusConfig[call.status];

  return (
    <div className="space-y-2">
      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
        📞 Live Call
      </h3>

      {call.active ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-3 neon-glow-blue space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={config.color}>{config.icon}</span>
              <span className={`text-xs font-mono font-semibold ${config.color}`}>{config.label}</span>
            </div>
            {call.status === "connected" && (
              <span className="text-[10px] font-mono text-muted-foreground">
                {call.duration}s
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
            <span>{call.caller}</span>
            <span>→</span>
            <span>{call.receiver}</span>
          </div>

          {/* Transcript */}
          <div className="max-h-32 overflow-y-auto scrollbar-thin space-y-1 pt-1">
            <AnimatePresence>
              {call.transcript.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[11px] font-mono"
                >
                  <span className="text-primary font-semibold">{t.speaker}: </span>
                  <span className="text-foreground/70">{t.text}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      ) : (
        <div className="glass-panel p-4 flex items-center justify-center text-muted-foreground text-xs font-mono">
          No active calls
        </div>
      )}
    </div>
  );
}
