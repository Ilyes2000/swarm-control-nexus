import { motion, AnimatePresence } from "framer-motion";
import { Brain, Loader2, TrendingUp, Moon } from "lucide-react";
import { useMission } from "@/contexts/MissionContext";

export function AdaptationIndicator() {
  const { adaptations, trainingMode } = useMission();
  const latest = adaptations[adaptations.length - 1];

  return (
    <div className="flex flex-col gap-1.5">
      {/* Training mode indicator */}
      <AnimatePresence>
        {trainingMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neon-purple/10 border border-neon-purple/20"
          >
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
              <Loader2 className="w-3 h-3 text-neon-purple" />
            </motion.div>
            <span className="text-[9px] font-mono text-neon-purple">
              <Moon className="w-2.5 h-2.5 inline mr-1" />
              Learning Mode Active - Study AI is improving...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Latest adaptation */}
      <AnimatePresence mode="wait">
        {latest && (
          <motion.div
            key={latest.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-mono ${
              latest.type === "learning"
                ? "bg-warning/10 text-warning border border-warning/20"
                : latest.type === "improving"
                ? "bg-secondary/10 text-secondary border border-secondary/20"
                : "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20"
            }`}
          >
            {latest.type === "learning" ? (
              <Brain className="w-3 h-3" />
            ) : latest.type === "improving" ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                <Loader2 className="w-3 h-3" />
              </motion.div>
            ) : (
              <TrendingUp className="w-3 h-3" />
            )}
            <span>{latest.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
