import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, Zap, Star, Clock, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMission, type ShadowPath } from "@/contexts/MissionContext";
import { useMissionRuntime } from "@/hooks/useMissionRuntime";

const accentMap = {
  green: {
    border: "border-green-500/50",
    bg: "bg-green-500/5",
    header: "bg-green-500/10 border-b border-green-500/20",
    label: "text-green-400",
    badge: "bg-green-500/20 text-green-400 border border-green-500/30",
    savings: "bg-green-500/15 text-green-300 border border-green-500/25",
    bar: "bg-green-500",
    button: "bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-500/30",
  },
  amber: {
    border: "border-amber-500/50",
    bg: "bg-amber-500/5",
    header: "bg-amber-500/10 border-b border-amber-500/20",
    label: "text-amber-400",
    badge: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    savings: "bg-amber-500/15 text-amber-300 border border-amber-500/25",
    bar: "bg-amber-500",
    button: "bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30",
  },
  coral: {
    border: "border-rose-400/50",
    bg: "bg-rose-400/5",
    header: "bg-rose-400/10 border-b border-rose-400/20",
    label: "text-rose-300",
    badge: "bg-rose-400/20 text-rose-300 border border-rose-400/30",
    savings: "bg-rose-400/15 text-rose-200 border border-rose-400/25",
    bar: "bg-rose-400",
    button: "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/30",
  },
} as const;

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border/40 bg-muted/20 overflow-hidden animate-pulse">
      <div className="h-14 bg-muted/30" />
      <div className="p-4 space-y-3">
        <div className="h-8 w-24 bg-muted/40 rounded" />
        <div className="h-4 w-full bg-muted/30 rounded" />
        <div className="h-4 w-3/4 bg-muted/30 rounded" />
        <div className="h-4 w-1/2 bg-muted/30 rounded" />
        <div className="h-9 w-full bg-muted/40 rounded mt-4" />
      </div>
    </div>
  );
}

function PathCard({ path, index, onLaunch }: { path: ShadowPath; index: number; onLaunch: (id: string) => void }) {
  const accent = accentMap[path.color] ?? accentMap.green;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.15 }}
      className={`rounded-xl border ${accent.border} ${accent.bg} overflow-hidden flex flex-col`}
    >
      {/* Header */}
      <div className={`px-4 py-3 ${accent.header} flex items-center justify-between`}>
        <div>
          <span className={`text-sm font-bold font-mono ${accent.label}`}>{path.label}</span>
          <p className="text-[11px] text-muted-foreground mt-0.5">{path.description}</p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Cost */}
        <div className="flex items-end gap-2">
          <span className={`text-2xl font-bold font-mono ${accent.label}`}>${path.estimatedCostLabel}</span>
          {path.savings > 0 && (
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${accent.savings} mb-0.5`}>
              <TrendingDown className="w-3 h-3 inline mr-0.5" />
              {path.savingsLabel}
            </span>
          )}
        </div>

        {/* Confidence */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
            <span>Confidence</span>
            <span className={accent.label}>{path.confidenceLabel}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${path.confidence}%` }}
              transition={{ duration: 0.6, delay: index * 0.15 + 0.2 }}
              className={`h-full rounded-full ${accent.bar}`}
            />
          </div>
        </div>

        {/* Risk badge */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground font-mono">No-show risk:</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${accent.badge}`}>
            {path.noShowRisk}
          </span>
        </div>

        {/* Venue details */}
        <div className="space-y-1.5 text-[11px] font-mono">
          <div className="flex items-start gap-1.5 text-muted-foreground">
            <Star className="w-3 h-3 mt-0.5 shrink-0" />
            <span>
              <span className="text-foreground">{path.restaurant.name}</span>
              {" · "}{path.restaurant.time}
              {path.restaurant.rating > 0 && ` · ★ ${path.restaurant.rating}`}
            </span>
          </div>
          <div className="flex items-start gap-1.5 text-muted-foreground">
            <Clock className="w-3 h-3 mt-0.5 shrink-0" />
            <span>
              <span className="text-foreground">{path.cinema.movie}</span>
              {" · "}{path.cinema.name}
              {" · "}{path.cinema.time}
            </span>
          </div>
        </div>
      </div>

      {/* Launch button */}
      <div className="px-4 pb-4">
        <Button
          className={`w-full text-xs font-mono font-semibold ${accent.button}`}
          variant="ghost"
          onClick={() => onLaunch(path.id)}
        >
          <Zap className="w-3.5 h-3.5 mr-1.5" />
          Launch this path →
        </Button>
      </div>
    </motion.div>
  );
}

interface ShadowMissionPanelProps {
  onClose: () => void;
}

export function ShadowMissionPanel({ onClose }: ShadowMissionPanelProps) {
  const { shadowPaths, shadowStatus, userInput, demoMode, autonomyMode, autonomyConstraints } = useMission();
  const { launchShadowPath } = useMissionRuntime();
  const [collapsed, setCollapsed] = useState(false);

  const handleLaunch = async (pathId: string) => {
    await launchShadowPath(
      pathId,
      userInput,
      demoMode ? "simulation" : "live",
      autonomyMode,
      autonomyConstraints,
    );
    onClose();
  };

  return (
    <div className="glass-panel mx-2 mb-2 rounded-xl border border-border/60 overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-muted/20">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="flex items-center gap-2 text-sm font-semibold font-mono text-foreground hover:text-primary transition-colors"
          >
            <span className="text-primary">◈</span>
            Shadow Analysis
            {shadowStatus === "running" && (
              <span className="text-[10px] font-mono text-amber-400 animate-pulse ml-1">simulating…</span>
            )}
            {shadowStatus === "ready" && (
              <span className="text-[10px] font-mono text-green-400 ml-1">ready</span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${collapsed ? "" : "rotate-180"}`} />
          </button>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Panel body */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-4">
              {shadowStatus === "running" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              )}

              {shadowStatus === "ready" && shadowPaths.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {shadowPaths.map((path, i) => (
                    <PathCard key={path.id} path={path} index={i} onLaunch={handleLaunch} />
                  ))}
                </div>
              )}

              {shadowStatus === "idle" && (
                <p className="text-sm text-muted-foreground font-mono text-center py-4">
                  No analysis running. Click "Shadow Analysis" to start.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
