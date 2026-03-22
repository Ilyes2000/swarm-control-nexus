import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, PhoneCall, RadioTower } from "lucide-react";
import { useMission } from "@/contexts/MissionContext";

export function LiveCallView() {
  const { call } = useMission();

  const statusConfig = {
    ringing: { icon: <Phone className="w-4 h-4" />, label: "Ringing", color: "text-warning" },
    connected: { icon: <PhoneCall className="w-4 h-4" />, label: "Connected", color: "text-success" },
    ended: { icon: <PhoneOff className="w-4 h-4" />, label: "Call Ended", color: "text-muted-foreground" },
  };

  const config = statusConfig[call.status];
  const providerBadge =
    call.providerMode === "simulation"
      ? { label: "SIMULATION", cls: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300" }
      : call.providerMode === "fallback"
        ? { label: "FALLBACK", cls: "border-warning/30 bg-warning/10 text-warning" }
        : { label: "LIVE", cls: "border-success/30 bg-success/10 text-success" };
  const transcriptLabel =
    call.transcriptMode === "live"
      ? "TRANSCRIPT LIVE"
      : call.transcriptMode === "simulated"
        ? "TRANSCRIPT SIMULATED"
        : "NO TRANSCRIPT AVAILABLE";

  return (
    <div className="space-y-2">
      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">CLAWDTALK SESSION</h3>

      {call.active ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-3 neon-glow-blue space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={config.color}>{config.icon}</span>
              <span className={`text-xs font-mono font-semibold ${config.color}`}>{config.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full border px-2 py-0.5 text-[9px] font-mono ${providerBadge.cls}`}>{providerBadge.label}</span>
              {call.status === "connected" && <span className="text-[10px] font-mono text-muted-foreground">{call.duration}s</span>}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
            <span>{call.caller}</span>
            <span>→</span>
            <span>{call.receiver}</span>
          </div>

          {call.handoffLabel && (
            <div className="flex items-center gap-2 rounded-md border border-secondary/20 bg-secondary/10 px-2 py-1 text-[10px] font-mono text-secondary">
              <RadioTower className="w-3 h-3" />
              {call.handoffLabel}
            </div>
          )}

          <div className="space-y-1 pt-1">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{transcriptLabel}</p>
            {call.providerMode === "fallback" && call.transcriptMode === "simulated" && (
              <div className="rounded-md border border-warning/20 bg-warning/10 px-2 py-1 text-[10px] font-mono text-warning">
                Call execution fell back; transcript is reconstructed for operator continuity.
              </div>
            )}
            <div className="max-h-32 overflow-y-auto scrollbar-thin space-y-1">
              <AnimatePresence>
                {call.transcript.map((t, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] font-mono">
                    <span className="text-primary font-semibold">{t.speaker}: </span>
                    <span className="text-foreground/70">{t.text}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
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
