import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMission } from "@/contexts/MissionContext";

export function MissionSummary() {
  const { summary } = useMission();

  return (
    <AnimatePresence>
      {summary.visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", damping: 20 }}
          className="glass-panel p-5 neon-glow"
        >
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-3">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                Mission Complete
              </h2>
              <p className="text-xs text-foreground/80 leading-relaxed">{summary.result}</p>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {summary.costBreakdown.map((item, i) => (
                  <div key={i} className={`text-center ${i === summary.costBreakdown.length - 1 ? "font-bold" : ""}`}>
                    <p className="text-[10px] text-muted-foreground font-mono">{item.label}</p>
                    <p className={`text-sm font-mono ${item.amount.startsWith("-") ? "text-success" : "text-foreground"}`}>
                      {item.amount}
                    </p>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-muted-foreground font-mono">⏱ Completed in {summary.timeTaken}</p>
            </div>

            <div className="flex gap-2 shrink-0">
              <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground">
                <CheckCircle className="w-3 h-3" />
                Confirm
              </Button>
              <Button size="sm" variant="outline">
                <Edit className="w-3 h-3" />
                Modify
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
