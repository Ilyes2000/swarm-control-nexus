import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Zap, Radio, Volume2, VolumeX, SendHorizonal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useMission } from "@/contexts/MissionContext";
import { useMissionRuntime } from "@/hooks/useMissionRuntime";
import { setVolume } from "@/lib/audio";
import { CrabLogo } from "./CrabLogo";
import { AdaptationIndicator } from "./AdaptationIndicator";

export function Header() {
  const { missionStatus, demoMode, userInput, setUserInput, setDemoMode } = useMission();
  const { startMission, interruptMission, connectionState } = useMissionRuntime();
  const [vol, setVol] = useState(70);
  const [interruptInput, setInterruptInput] = useState("");
  const [showInterruptFlash, setShowInterruptFlash] = useState(false);

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

    void startMission(userInput, demoMode ? "simulation" : "live");
  };

  const isLive = missionStatus === "live";
  const startLabel = demoMode ? "Start Demo" : "Start Mission";

  return (
    <header className="glass-panel px-6 py-3 flex items-center gap-4 relative overflow-hidden">
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
    </header>
  );
}
