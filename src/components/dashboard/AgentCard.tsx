import { motion } from "framer-motion";
import type { Agent } from "@/contexts/MissionContext";

function Waveform() {
  return (
    <div className="flex items-end gap-[2px] h-4">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-[3px] bg-primary rounded-full"
          animate={{ height: ["4px", "16px", "4px"] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

const statusColors: Record<string, string> = {
  idle: "bg-muted text-muted-foreground",
  thinking: "bg-warning/20 text-warning border-warning/30",
  speaking: "bg-primary/20 text-primary border-primary/30",
  calling: "bg-success/20 text-success border-success/30",
};

export function AgentCard({ agent }: { agent: Agent }) {
  const isActive = agent.status !== "idle";

  return (
    <motion.div
      layout
      className={`glass-panel p-3 transition-all duration-300 ${
        isActive ? "neon-glow border-primary/30" : ""
      }`}
      animate={isActive ? { scale: [1, 1.01, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{agent.emoji}</span>
          <span className="text-xs font-semibold truncate">{agent.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {agent.status === "speaking" && <Waveform />}
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border ${statusColors[agent.status]}`}>
            {agent.status}
          </span>
        </div>
      </div>

      {agent.currentTask && (
        <p className="text-[10px] text-muted-foreground font-mono mb-1 truncate">
          📌 {agent.currentTask}
        </p>
      )}

      {agent.liveText && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-muted/50 rounded p-2 mt-1"
        >
          <p className="text-[11px] font-mono text-foreground/80 leading-relaxed">{agent.liveText}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
