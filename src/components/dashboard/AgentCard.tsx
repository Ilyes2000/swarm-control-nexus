import { motion } from "framer-motion";
import type { Agent, AgentStatus } from "@/contexts/MissionContext";

const personalityColors: Record<string, { border: string; glow: string; waveform: string; badge: string }> = {
  purple: { border: "border-primary/40", glow: "shadow-primary/30", waveform: "bg-primary", badge: "bg-primary/20 text-primary" },
  green: { border: "border-success/40", glow: "shadow-success/30", waveform: "bg-success", badge: "bg-success/20 text-success" },
  amber: { border: "border-warning/40", glow: "shadow-warning/30", waveform: "bg-warning", badge: "bg-warning/20 text-warning" },
  blue: { border: "border-secondary/40", glow: "shadow-secondary/30", waveform: "bg-secondary", badge: "bg-secondary/20 text-secondary" },
  cyan: { border: "border-neon-cyan/40", glow: "shadow-neon-cyan/30", waveform: "bg-neon-cyan", badge: "bg-neon-cyan/20 text-neon-cyan" },
};

function Waveform({ color }: { color: string }) {
  const colorClass = personalityColors[color]?.waveform || "bg-primary";
  return (
    <div className="flex items-end gap-[2px] h-4">
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <motion.div
          key={i}
          className={`w-[2px] ${colorClass} rounded-full`}
          animate={{ height: ["3px", `${8 + Math.random() * 10}px`, "3px"] }}
          transition={{ duration: 0.4 + Math.random() * 0.3, repeat: Infinity, delay: i * 0.07, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function ConfidenceMini({ value }: { value: number }) {
  if (value === 0) return null;
  const colorClass = value >= 85 ? "text-success" : value >= 60 ? "text-warning" : "text-destructive";
  return <span className={`text-[9px] font-mono font-bold ${colorClass}`}>{value}%</span>;
}

const statusConfig: Record<AgentStatus, { label: string; base: string }> = {
  idle: { label: "idle", base: "bg-muted text-muted-foreground border-border" },
  thinking: { label: "thinking", base: "bg-warning/15 text-warning border-warning/30" },
  speaking: { label: "speaking", base: "bg-primary/15 text-primary border-primary/30" },
  calling: { label: "calling", base: "bg-success/15 text-success border-success/30" },
  listening: { label: "listening", base: "bg-secondary/15 text-secondary border-secondary/30" },
  retrying: { label: "retrying", base: "bg-destructive/15 text-destructive border-destructive/30" },
};

export function AgentCard({ agent, listeningToLabel }: { agent: Agent; listeningToLabel: string | null }) {
  const isActive = agent.status !== "idle";
  const colors = personalityColors[agent.personality.color] || personalityColors.purple;

  return (
    <motion.div
      layout
      className={`glass-panel p-3 transition-all duration-300 ${
        isActive ? `${colors.border} shadow-lg ${colors.glow}` : "border-border/20"
      }`}
      animate={isActive ? { scale: [1, 1.008, 1] } : {}}
      transition={{ duration: 2.5, repeat: Infinity }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base">{agent.emoji}</span>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold block truncate">{agent.name}</span>
            <span className="text-[8px] text-muted-foreground font-mono italic">{agent.personality.trait}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <ConfidenceMini value={agent.confidence} />
          {(agent.status === "speaking" || agent.status === "calling") && <Waveform color={agent.personality.color} />}
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-medium border ${statusConfig[agent.status].base}`}>
            {statusConfig[agent.status].label}
          </span>
        </div>
      </div>

      {agent.listeningTo && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[9px] text-secondary font-mono mb-1 flex items-center gap-1"
        >
          <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            ear
          </motion.span>
          Listening to {listeningToLabel ?? agent.listeningTo}
        </motion.p>
      )}

      {agent.currentTask && <p className="text-[9px] text-muted-foreground font-mono mb-1 truncate">Task: {agent.currentTask}</p>}

      {agent.liveText && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted/50 rounded p-1.5 mt-1"
        >
          <p className="text-[10px] font-mono text-foreground/80 leading-relaxed">{agent.liveText}</p>
        </motion.div>
      )}

      {isActive && (
        <div className="flex items-center gap-1 mt-1.5">
          <span className={`text-[8px] font-mono px-1 py-0.5 rounded ${colors.badge}`}>
            {agent.personality.tone}
          </span>
          <span
            className={`text-[8px] font-mono px-1 py-0.5 rounded ${
              agent.personality.riskTolerance === "high"
                ? "bg-destructive/15 text-destructive"
                : agent.personality.riskTolerance === "medium"
                  ? "bg-warning/15 text-warning"
                  : "bg-success/15 text-success"
            }`}
          >
            Risk: {agent.personality.riskTolerance}
          </span>
        </div>
      )}
    </motion.div>
  );
}
