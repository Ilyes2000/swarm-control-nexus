import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ChevronDown, Zap, Star, Clock, TrendingUp, Lock } from "lucide-react";
import { toast } from "sonner";
import { useMission, type VenueMemory } from "@/contexts/MissionContext";
import { getMissionApiUrl } from "@/lib/mission-client";

// ─── Constants ────────────────────────────────────────────────────────────────

const LANG_FLAGS: Record<string, string> = {
  en: "🇬🇧", fr: "🇫🇷", it: "🇮🇹", es: "🇪🇸", de: "🇩🇪", ja: "🇯🇵",
};

const LEVEL_STYLES: Record<string, string> = {
  new:        "bg-muted/40 text-muted-foreground border border-border/50",
  acquainted: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  regular:    "bg-teal-500/15 text-teal-400 border border-teal-500/30",
  vip:        "bg-purple-500/20 text-purple-300 border border-purple-400/40 shadow-[0_0_8px_rgba(168,85,247,0.3)]",
};

const TONE_COLORS: Record<string, string> = {
  friendly:   "text-green-400 bg-green-500/10 border-green-500/30",
  assertive:  "text-amber-400 bg-amber-500/10 border-amber-500/30",
  formal:     "text-blue-400 bg-blue-500/10 border-blue-500/30",
  persuasive: "text-rose-400 bg-rose-500/10 border-rose-500/30",
};

const OUTCOME_STYLES: Record<string, string> = {
  accept:      "bg-green-500/15 text-green-400",
  counter:     "bg-amber-500/15 text-amber-400",
  offpeak:     "bg-teal-500/15 text-teal-400",
  promo:       "bg-purple-500/15 text-purple-400",
  no_response: "bg-red-500/15 text-red-400",
};

const OUTCOME_LABELS: Record<string, string> = {
  accept:      "Accepted",
  counter:     "Countered",
  offpeak:     "Off-peak offer",
  promo:       "Promo offered",
  no_response: "No response",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SuccessDot({ success, outcome }: { success: boolean; outcome: string }) {
  const color = success
    ? "bg-green-500"
    : outcome === "counter"
      ? "bg-amber-500"
      : "bg-red-500";
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${color}`}
      title={outcome}
    />
  );
}

function VenueCard({ memory, isActive }: { memory: VenueMemory; isActive: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [flash, setFlash] = useState(false);

  // Flash green when memory updates
  useEffect(() => {
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 800);
    return () => clearTimeout(t);
  }, [memory.updatedAt]);

  const successRate = memory.successRate ?? 0;
  const rateColor = successRate >= 75 ? "bg-green-500" : successRate >= 40 ? "bg-amber-500" : "bg-red-500";
  const rateDot   = successRate >= 75 ? "text-green-400" : successRate >= 40 ? "text-amber-400" : "text-red-400";

  const activeBorderClass = isActive
    ? "border-primary/60 shadow-[0_0_12px_rgba(var(--primary)/0.25)]"
    : "border-border/40";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`relative rounded-lg border ${activeBorderClass} bg-card/60 overflow-hidden transition-colors duration-300 ${flash ? "ring-1 ring-green-500/50" : ""}`}
    >
      {/* Active call pulse */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-primary/40 pointer-events-none"
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* Card header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full text-left p-3"
      >
        <div className="flex items-center justify-between gap-2">
          {/* Name + level */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold font-mono truncate text-foreground">
              {memory.venueName}
            </span>
            <span className={`shrink-0 text-[9px] font-mono px-1.5 py-0.5 rounded-full ${LEVEL_STYLES[memory.relationshipLevel]}`}>
              {memory.relationshipLevel.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-mono text-muted-foreground">
              {memory.callCount} {memory.callCount === 1 ? "call" : "calls"}
            </span>
            <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
          </div>
        </div>

        {/* Mini stats */}
        <div className="flex items-center gap-3 mt-2">
          {/* Success rate */}
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${rateColor}`} />
            <span className={`text-[10px] font-mono ${rateDot}`}>
              {memory.successRate != null ? `${memory.successRate}%` : "—"}
            </span>
          </div>

          {/* Tone */}
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${TONE_COLORS[memory.preferredTone] || TONE_COLORS.friendly}`}>
            {memory.preferredTone}
          </span>

          {/* Language flag */}
          <span className="text-sm" title={memory.detectedLanguage}>
            {LANG_FLAGS[memory.detectedLanguage] || "🌐"}
          </span>

          {/* Active indicator */}
          {isActive && (
            <span className="text-[9px] font-mono text-primary animate-pulse ml-auto">
              live call
            </span>
          )}
        </div>

        {/* Last outcome + note */}
        {memory.lastOutcome && (
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${OUTCOME_STYLES[memory.lastOutcome] || "bg-muted/30 text-muted-foreground"}`}>
              {OUTCOME_LABELS[memory.lastOutcome] || memory.lastOutcome}
            </span>
            {memory.notes.length > 0 && (
              <span className="text-[10px] font-mono text-muted-foreground italic truncate">
                {memory.notes[memory.notes.length - 1]}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Expanded detail */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border/30 px-3 pb-3 pt-2 space-y-2.5"
          >
            {/* Call history timeline */}
            {memory.callHistory.length > 0 && (
              <div>
                <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1">Call history</p>
                <div className="flex items-center gap-1 flex-wrap">
                  {memory.callHistory.map((h, i) => (
                    <SuccessDot key={i} success={h.success} outcome={h.outcome} />
                  ))}
                </div>
              </div>
            )}

            {/* Success rate bar */}
            {memory.successRate != null && (
              <div>
                <div className="flex justify-between text-[9px] font-mono text-muted-foreground mb-0.5">
                  <span>Success rate</span>
                  <span className={rateDot}>{memory.successRate}%</span>
                </div>
                <div className="h-1 w-full rounded-full bg-muted/40">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${memory.successRate}%` }}
                    transition={{ duration: 0.6 }}
                    className={`h-full rounded-full ${rateColor}`}
                  />
                </div>
              </div>
            )}

            {/* Escalation rules */}
            {memory.escalationRules.length > 0 && (
              <div>
                <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" /> Escalation rules
                </p>
                {memory.escalationRules.map((rule, i) => (
                  <p key={i} className="text-[10px] font-mono text-amber-400/80 leading-tight">{rule}</p>
                ))}
              </div>
            )}

            {/* Promo codes */}
            {memory.lastPromoCode && (
              <div className="flex items-center gap-1.5">
                <Star className="w-3 h-3 text-purple-400 shrink-0" />
                <span className="text-[10px] font-mono text-purple-300">
                  Promo: <span className="font-bold">{memory.lastPromoCode}</span>
                  {memory.lastDiscount && ` (${memory.lastDiscount})`}
                </span>
              </div>
            )}

            {/* Best call time */}
            {memory.bestCallHour != null && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-blue-400 shrink-0" />
                <span className="text-[10px] font-mono text-blue-300">
                  Best time: {memory.bestCallHour}:00–{memory.bestCallHour + 1}:00
                </span>
              </div>
            )}

            {/* Success prediction */}
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-green-400 shrink-0" />
              <span className="text-[10px] font-mono text-muted-foreground">
                {memory.callCount === 0
                  ? "Unknown — first contact"
                  : memory.successRate != null && memory.successRate >= 75
                    ? "High — this venue responds well"
                    : memory.successRate != null && memory.successRate >= 40
                      ? "Moderate — expect negotiation"
                      : "Low — consider alternative venue"}
              </span>
            </div>

            {/* Notes */}
            {memory.notes.length > 0 && (
              <div>
                <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1">Learned insights</p>
                {memory.notes.map((note, i) => (
                  <p key={i} className="text-[10px] font-mono text-muted-foreground italic leading-snug">· {note}</p>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function VenueIntelligencePanel() {
  const { venueMemories, activeVenueIntelligence, call } = useMission();
  const [collapsed, setCollapsed] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const venues = Object.values(venueMemories).sort((a, b) => b.callCount - a.callCount);
  const activeVenueName = activeVenueIntelligence?.venueName?.toLowerCase().trim() ?? null;
  const liveCallVenue   = call.active ? call.receiver?.toLowerCase().trim() : null;

  // Toast on new skill learned
  const prevMemoriesRef = useMissionPrevMemories(venueMemories);
  useEffect(() => {
    for (const [key, mem] of Object.entries(venueMemories)) {
      const prev = prevMemoriesRef.current[key];
      if (prev && mem.notes.length > prev.notes.length) {
        const newNote = mem.notes[mem.notes.length - 1];
        if (newNote) {
          toast.success(`Learned: ${newNote}`, { duration: 4000 });
        }
      }
    }
    prevMemoriesRef.current = venueMemories;
  }, [venueMemories, prevMemoriesRef]);

  const { upsertVenueMemory } = useMission();

  const handleSeedDemo = useCallback(async () => {
    setSeeding(true);
    try {
      await fetch(getMissionApiUrl("/api/venues/seed-demo"), { method: "POST" });
      const res = await fetch(getMissionApiUrl("/api/venues/memory"));
      const data = await res.json() as { venues: VenueMemory[] };
      for (const mem of data.venues) {
        upsertVenueMemory(mem.venueName, mem);
      }
      toast.success("Demo venues loaded");
    } finally {
      setSeeding(false);
    }
  }, [upsertVenueMemory]);

  return (
    <div className="space-y-1">
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1 hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Brain className="w-3.5 h-3.5 text-primary" />
          Venue Intelligence
          {venues.length > 0 && (
            <span className="text-[9px] font-mono bg-primary/20 text-primary px-1.5 rounded-full">
              {venues.length}
            </span>
          )}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${collapsed ? "" : "rotate-180"}`} />
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2 overflow-hidden"
          >
            {venues.length === 0 ? (
              /* Empty state */
              <div className="rounded-lg border border-border/30 bg-muted/10 p-4 text-center space-y-2">
                <div className="flex justify-center gap-2">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-7 h-7 rounded-full bg-muted/30 flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
                    </div>
                  ))}
                </div>
                <p className="text-[11px] font-mono text-muted-foreground leading-relaxed">
                  Venue relationships will appear here as the agent makes calls
                </p>
                <p className="text-[9px] font-mono text-muted-foreground/60">
                  The more missions run, the smarter the negotiator gets
                </p>
                <button
                  type="button"
                  onClick={handleSeedDemo}
                  disabled={seeding}
                  className="text-[10px] font-mono text-primary hover:text-primary/80 underline underline-offset-2 transition-colors disabled:opacity-50"
                >
                  {seeding ? "Loading…" : "Load demo data"}
                </button>
              </div>
            ) : (
              /* Venue cards */
              <div className="space-y-2">
                {venues.map((mem, i) => (
                  <motion.div
                    key={mem.key}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <VenueCard
                      memory={mem}
                      isActive={
                        mem.key === activeVenueName ||
                        mem.key === liveCallVenue
                      }
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Helper hook ──────────────────────────────────────────────────────────────

function useMissionPrevMemories(current: Record<string, VenueMemory>) {
  const ref = useRef<Record<string, VenueMemory>>(current);
  return ref;
}
