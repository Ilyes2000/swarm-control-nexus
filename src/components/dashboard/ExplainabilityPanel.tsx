import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Globe,
  Phone,
  MessageSquare,
  Database,
  AlertTriangle,
  CheckCircle,
  Link,
  ShieldCheck,
  MapPinned,
} from "lucide-react";
import { useMission, ReasoningEntry, RecommendationInsight, SourceReference } from "@/contexts/MissionContext";

function ConfidenceBar({ value }: { value: number }) {
  const color =
    value >= 90 ? "bg-success" : value >= 70 ? "bg-primary" : value >= 50 ? "bg-warning" : "bg-destructive";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{value}%</span>
    </div>
  );
}

const sourceTypeIcon: Record<SourceReference["type"], typeof Globe> = {
  web: Globe,
  call: Phone,
  sms: MessageSquare,
  api: Database,
  cache: Database,
  fallback: AlertTriangle,
};

const freshnessBadge: Record<SourceReference["freshness"], { label: string; cls: string }> = {
  live: { label: "LIVE", cls: "bg-green-500/20 text-green-400" },
  cached: { label: "CACHED", cls: "bg-amber-500/20 text-amber-400" },
  stale: { label: "STALE", cls: "bg-red-500/20 text-red-400" },
  simulated: { label: "SIM", cls: "bg-zinc-500/20 text-zinc-400" },
};

const bookingPathBadge: Record<NonNullable<SourceReference["bookingPath"]>, { label: string; cls: string }> = {
  direct: { label: "DIRECT", cls: "bg-cyan-500/20 text-cyan-300" },
  reseller: { label: "RESELLER", cls: "bg-orange-500/20 text-orange-300" },
  unknown: { label: "UNKNOWN", cls: "bg-zinc-500/20 text-zinc-300" },
};

const riskBadge: Record<NonNullable<SourceReference["risk"]>, { label: string; cls: string }> = {
  low: { label: "LOW RISK", cls: "bg-green-500/20 text-green-300" },
  medium: { label: "MEDIUM RISK", cls: "bg-amber-500/20 text-amber-300" },
  high: { label: "HIGH RISK", cls: "bg-red-500/20 text-red-300" },
};

function SourcePill({ source }: { source: SourceReference }) {
  const Icon = sourceTypeIcon[source.type] ?? Globe;
  const badge = freshnessBadge[source.freshness] ?? freshnessBadge.stale;
  const borderCls = source.verified
    ? "border-green-500/40"
    : source.type === "fallback"
      ? "border-zinc-500/40"
      : "border-amber-500/40";

  const content = (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-mono ${borderCls} bg-background/50`}
    >
      <Icon className="w-2.5 h-2.5 shrink-0" />
      <span className="truncate max-w-[100px]">{source.label}</span>
      <span className={`px-1 rounded text-[8px] font-bold ${badge.cls}`}>{badge.label}</span>
      {source.bookingPath && (
        <span className={`px-1 rounded text-[8px] font-bold ${bookingPathBadge[source.bookingPath].cls}`}>
          {bookingPathBadge[source.bookingPath].label}
        </span>
      )}
      {source.risk && (
        <span className={`px-1 rounded text-[8px] font-bold ${riskBadge[source.risk].cls}`}>
          {riskBadge[source.risk].label}
        </span>
      )}
      {source.verified && <CheckCircle className="w-2.5 h-2.5 text-green-400 shrink-0" />}
      {source.url && <Link className="w-2.5 h-2.5 text-muted-foreground shrink-0" />}
    </span>
  );

  if (!source.url) {
    return content;
  }

  return (
    <a href={source.url} target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
      {content}
    </a>
  );
}

function ProvenanceCard({ insight }: { insight: RecommendationInsight }) {
  const primary = insight.sources[0];

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
      <div className="flex items-center gap-2 mb-2">
        <MapPinned className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
          {insight.workflow === "restaurant" ? "Restaurant" : "Cinema"} Recommendation
        </span>
      </div>
      <p className="text-[11px] text-foreground font-semibold">{insight.venueName}</p>
      <p className="text-[11px] text-foreground/75 leading-relaxed mb-2">{insight.summary}</p>
      <div className="mb-2">
        <ConfidenceBar value={insight.confidence} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {insight.sources.map((source, index) => (
          <SourcePill key={`${insight.id}-${index}`} source={source} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-mono">
        <span className="rounded-full border border-border/40 bg-muted/30 px-2 py-0.5 text-foreground/70">
          {insight.primaryBookingPath === "direct"
            ? "Direct booking path"
            : insight.primaryBookingPath === "reseller"
              ? "Reseller risk"
              : "Booking path unknown"}
        </span>
        <span className="rounded-full border border-border/40 bg-muted/30 px-2 py-0.5 text-foreground/70">
          {insight.primaryRisk === "low"
            ? "Low risk source"
            : insight.primaryRisk === "medium"
              ? "Medium risk source"
              : "High risk source"}
        </span>
        {insight.fallbackMode && (
          <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-warning">
            Fallback recommendation
          </span>
        )}
      </div>
      {primary?.checkedAt && (
        <p className="mt-2 text-[10px] font-mono text-muted-foreground">Checked at {primary.checkedAt}</p>
      )}
    </div>
  );
}

function ReasoningCard({ entry }: { entry: ReasoningEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-panel p-3 cursor-pointer hover:border-primary/30 transition-colors"
      onClick={() => setExpanded((value) => !value)}
    >
      <div className="flex items-start gap-2">
        <span className="text-base mt-0.5">{entry.agentEmoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] font-semibold text-foreground/70">{entry.agentName}</span>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-mono text-muted-foreground">{entry.timestamp}</span>
              <ChevronRight
                className={`w-3 h-3 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`}
              />
            </div>
          </div>

          <p className="text-[11px] font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-primary shrink-0" />
            {entry.decision}
          </p>

          <div className="mb-1.5">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-0.5">Confidence</p>
            <ConfidenceBar value={entry.confidence} />
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-2 border-t border-border/30 space-y-2">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                      <Brain className="w-2.5 h-2.5" /> Reasoning
                    </p>
                    <p className="text-[11px] text-foreground/70 leading-relaxed font-mono">{entry.reasoning}</p>
                  </div>

                  {entry.alternatives.length > 0 && (
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                        <TrendingUp className="w-2.5 h-2.5" /> Alternatives Considered
                      </p>
                      <ul className="space-y-0.5">
                        {entry.alternatives.map((alt, index) => (
                          <li
                            key={index}
                            className="text-[10px] text-muted-foreground font-mono flex items-center gap-1.5"
                          >
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
                            {alt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {entry.sources && entry.sources.length > 0 && (
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5" /> Verified Source Graph
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {entry.sources.map((source, index) => (
                          <SourcePill key={`${entry.id}-${index}`} source={source} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export function ExplainabilityPanel() {
  const { reasoning, recommendationInsights } = useMission();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [reasoning.length, recommendationInsights.length]);

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1 mb-3 flex items-center gap-1.5">
        <Brain className="w-3.5 h-3.5 text-primary" />
        Agent Reasoning
      </h2>

      <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 space-y-2">
        {recommendationInsights.length > 0 && (
          <div className="space-y-2">
            <p className="text-[9px] uppercase tracking-widest text-muted-foreground px-1">
              Recommendation Provenance
            </p>
            {recommendationInsights
              .slice()
              .sort((a, b) => a.workflow.localeCompare(b.workflow))
              .map((insight) => (
                <ProvenanceCard key={insight.id} insight={insight} />
              ))}
          </div>
        )}

        <AnimatePresence>
          {reasoning.map((entry) => (
            <ReasoningCard key={entry.id} entry={entry} />
          ))}
        </AnimatePresence>

        {reasoning.length === 0 && recommendationInsights.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs font-mono gap-2">
            <Brain className="w-6 h-6 opacity-30" />
            <span>No reasoning data yet...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
