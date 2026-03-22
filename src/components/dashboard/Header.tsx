import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Mic, ShieldCheck, Wand2, Zap, Radio, Volume2, VolumeX, SendHorizonal, GitBranch, Loader2, CheckCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useMission } from "@/contexts/MissionContext";
import { useMissionRuntime } from "@/hooks/useMissionRuntime";
import { setVolume } from "@/lib/audio";
import { CrabLogo } from "./CrabLogo";
import { AdaptationIndicator } from "./AdaptationIndicator";

interface HeaderProps {
  onShadowAnalysis?: () => void;
}

export function Header({ onShadowAnalysis }: HeaderProps) {
  const {
    missionStatus,
    demoMode,
    userInput,
    autonomyMode,
    autonomyConstraints,
    merchantOffers,
    pendingApproval,
    recommendationInsights,
    summary,
    shadowStatus,
    setUserInput,
    setDemoMode,
    setAutonomyMode,
    setAutonomyConstraints,
  } = useMission();
  const { startMission, interruptMission, connectionState, startShadowMission } = useMissionRuntime();
  const [vol, setVol] = useState(70);
  const [interruptInput, setInterruptInput] = useState("");
  const [showInterruptFlash, setShowInterruptFlash] = useState(false);
  const [showConstraints, setShowConstraints] = useState(true);

  const handleDemoToggle = (checked: boolean) => {
    if (missionStatus === "live") {
      return;
    }

    setDemoMode(checked);
  };

  const handleVolumeChange = (value: number[]) => {
    setVol(value[0]);
    setVolume(value[0] / 100);
  };

  const toggleMute = () => {
    const newVol = vol === 0 ? 70 : 0;
    setVol(newVol);
    setVolume(newVol / 100);
  };

  const handleInterrupt = () => {
    const cmd = interruptInput.trim();
    if (!cmd || missionStatus !== "live") {
      return;
    }

    void interruptMission(cmd);
    setInterruptInput("");
    setShowInterruptFlash(true);
    window.setTimeout(() => setShowInterruptFlash(false), 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && missionStatus === "live") {
      handleInterrupt();
    }
  };

  const handleStart = () => {
    if (!userInput.trim() || missionStatus === "live") {
      return;
    }

    void startMission(userInput, demoMode ? "simulation" : "live", autonomyMode, autonomyConstraints);
  };

  const [shadowLoading, setShadowLoading] = useState(false);

  const handleShadowAnalysis = async () => {
    if (!userInput.trim() || missionStatus === "live" || shadowLoading) return;
    setShadowLoading(true);
    try {
      await startShadowMission(userInput, demoMode ? "simulation" : "live");
      onShadowAnalysis?.();
    } finally {
      setShadowLoading(false);
    }
  };

  const isLive = missionStatus === "live";
  const startLabel = demoMode ? "Start Demo" : "Start Mission";
  const autonomyOptions = [
    { id: "suggest", label: "Suggest", icon: <Mic className="w-3.5 h-3.5" /> },
    { id: "confirm", label: "Call + Confirm", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: "autobook", label: "Auto-Book", icon: <Wand2 className="w-3.5 h-3.5" /> },
  ] as const;
  const latestMerchantOffer = merchantOffers[merchantOffers.length - 1];
  const hasDirectRestaurantPath = recommendationInsights.some(
    (insight) => insight.workflow === "restaurant" && insight.primaryBookingPath === "direct",
  );
  const hasResellerPath = recommendationInsights.some((insight) => insight.primaryBookingPath === "reseller");
  const hasHighRiskSource = recommendationInsights.some((insight) => insight.primaryRisk === "high");
  const hasMediumRiskSource = recommendationInsights.some((insight) => insight.primaryRisk === "medium");
  const hasFallbackSource = recommendationInsights.some((insight) => insight.fallbackMode);
  const missionSignals = [
    hasDirectRestaurantPath ? { label: "DIRECT BOOKING PATH", tone: "success" } : null,
    hasResellerPath ? { label: "RESELLER RISK", tone: "warning" } : null,
    hasHighRiskSource
      ? { label: "HIGH RISK SOURCE", tone: "destructive" }
      : hasMediumRiskSource
        ? { label: "MEDIUM RISK SOURCE", tone: "warning" }
        : null,
    hasFallbackSource ? { label: "FALLBACK SOURCE", tone: "warning" } : null,
    pendingApproval
      ? {
          label: summary.autonomyRecap?.constraintTriggered ? "AUTO-BOOK PAUSED" : "APPROVAL REQUIRED",
          tone: "warning",
        }
      : null,
    latestMerchantOffer?.merchantOutcome === "counter"
      ? { label: "MERCHANT COUNTERED", tone: "primary" }
      : latestMerchantOffer?.finalResolution === "manual_followup"
        ? { label: "MANUAL FOLLOW-UP", tone: "warning" }
        : null,
    summary.autonomyRecap?.constraintTriggered
      ? { label: "CONSTRAINT PAUSE TRIGGERED", tone: "warning" }
      : null,
  ].filter(Boolean) as { label: string; tone: "success" | "warning" | "destructive" | "primary" }[];
  const signalCls: Record<(typeof missionSignals)[number]["tone"], string> = {
    success: "border-success/30 bg-success/10 text-success",
    warning: "border-warning/30 bg-warning/10 text-warning",
    destructive: "border-destructive/30 bg-destructive/10 text-destructive",
    primary: "border-primary/30 bg-primary/10 text-primary",
  };

  return (
    <header className="glass-panel px-6 py-3 flex flex-wrap items-center gap-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

      <AnimatePresence>
        {showInterruptFlash && (
          <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 bg-warning/10 pointer-events-none z-10"
          />
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 shrink-0">
        <CrabLogo />
        <h1 className="text-lg font-bold neon-text tracking-tight">
          ClawSwarm <span className="text-muted-foreground font-normal text-xs">Nexus</span>
        </h1>
      </div>

      <div className="shrink-0">
        <AdaptationIndicator />
      </div>

      <motion.div
        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold shrink-0 ${
          isLive
            ? "bg-success/20 text-success border border-success/30"
            : missionStatus === "completed"
              ? "bg-primary/20 text-primary border border-primary/30"
              : "bg-muted text-muted-foreground border border-border"
        }`}
      >
        {isLive && (
          <motion.div
            className="w-2 h-2 rounded-full bg-success"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
        <Radio className="w-3 h-3" />
        {isLive ? "LIVE" : missionStatus === "completed" ? "DONE" : "IDLE"}
      </motion.div>

      <div className="text-[10px] font-mono text-muted-foreground shrink-0">
        {connectionState === "connected"
          ? "stream online"
          : connectionState === "connecting"
            ? "stream connecting"
            : "stream offline"}
      </div>

      <div className="flex-1 flex items-center gap-2 max-w-xl relative">
        {isLive ? (
          <>
            <div className="relative flex-1">
              <Input
                value={interruptInput}
                onChange={(e) => setInterruptInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder='Interrupt: "Change to cheaper option"'
                className="bg-warning/10 border-warning/30 text-sm font-mono placeholder:text-warning/50 focus-visible:ring-warning/50 pr-8"
                maxLength={200}
              />
              <AnimatePresence>
                {isLive && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <span className="text-[9px] font-mono text-warning/60">enter</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="shrink-0 text-warning hover:text-warning hover:bg-warning/10"
              onClick={handleInterrupt}
              disabled={!interruptInput.trim()}
            >
              <SendHorizonal className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <>
            <Input
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Enter your mission..."
              className="bg-muted/50 border-border/50 text-sm font-mono"
            />
            <Button size="icon" variant="ghost" className="shrink-0 text-muted-foreground hover:text-primary">
              <Mic className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      <Button
        className="shrink-0 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20"
        disabled={isLive || !userInput.trim()}
        onClick={handleStart}
      >
        <Zap className="w-4 h-4" />
        {startLabel}
      </Button>

      <Button
        variant="outline"
        className={`shrink-0 font-mono text-xs font-semibold border-border/60 transition-colors ${
          shadowStatus === "ready"
            ? "border-green-500/40 text-green-400 bg-green-500/5 hover:bg-green-500/10"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }`}
        disabled={isLive || !userInput.trim() || shadowLoading}
        onClick={() => void handleShadowAnalysis()}
      >
        {shadowLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : shadowStatus === "ready" ? (
          <CheckCheck className="w-3.5 h-3.5" />
        ) : (
          <GitBranch className="w-3.5 h-3.5" />
        )}
        {shadowStatus === "ready" ? "Analysis Ready ✓" : "Shadow Analysis"}
      </Button>

      <div className="flex items-center gap-1 shrink-0 rounded-full border border-border/60 bg-muted/30 p-1">
        {autonomyOptions.map((option) => (
          <Button
            key={option.id}
            type="button"
            size="sm"
            variant="ghost"
            disabled={isLive}
            onClick={() => {
              setAutonomyMode(option.id);
              if (option.id === "autobook") {
                setShowConstraints(true);
              }
            }}
            className={`h-8 rounded-full px-3 text-[11px] font-mono ${
              autonomyMode === option.id
                ? "bg-primary/20 text-primary hover:bg-primary/25"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {option.icon}
            {option.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={toggleMute}
        >
          {vol === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </Button>
        <Slider value={[vol]} onValueChange={handleVolumeChange} max={100} step={1} className="w-16" />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted-foreground font-mono">Demo</span>
        <Switch checked={demoMode} onCheckedChange={handleDemoToggle} disabled={isLive} />
      </div>

      {autonomyMode === "autobook" && !isLive && (
        <div className="basis-full">
          <div className="mt-1 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
            <button
              type="button"
              className="flex w-full items-center justify-between text-[11px] font-mono text-primary"
              onClick={() => setShowConstraints((value) => !value)}
            >
              <span>Auto-Book Constraints</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showConstraints ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence initial={false}>
              {showConstraints && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 grid gap-3 md:grid-cols-3"
                >
                  <label className="space-y-1">
                    <span className="text-[10px] font-mono text-muted-foreground">Max Budget</span>
                    <Input
                      type="number"
                      min={50}
                      max={500}
                      step={5}
                      value={autonomyConstraints.maxBudget ?? ""}
                      onChange={(event) =>
                        setAutonomyConstraints({
                          maxBudget: event.target.value ? Number(event.target.value) : null,
                        })
                      }
                      className="h-8 bg-muted/40 text-xs font-mono"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-[10px] font-mono text-muted-foreground">Latest Time</span>
                    <Input
                      type="time"
                      value={autonomyConstraints.latestTime ?? ""}
                      onChange={(event) => setAutonomyConstraints({ latestTime: event.target.value || null })}
                      className="h-8 bg-muted/40 text-xs font-mono"
                    />
                  </label>

                  <label className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                      <span>Min Confidence</span>
                      <span>{autonomyConstraints.minConfidence ?? 0}%</span>
                    </div>
                    <Slider
                      value={[autonomyConstraints.minConfidence ?? 80]}
                      onValueChange={(value) => setAutonomyConstraints({ minConfidence: value[0] })}
                      min={50}
                      max={100}
                      step={1}
                    />
                  </label>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {missionSignals.length > 0 && (
        <div className="basis-full flex flex-wrap gap-2">
          {missionSignals.map((signal) => (
            <div
              key={signal.label}
              className={`rounded-full border px-2 py-1 text-[10px] font-mono tracking-wide ${signalCls[signal.tone]}`}
            >
              {signal.label}
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
