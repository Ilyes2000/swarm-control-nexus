import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dna, ChevronDown, Zap, RefreshCw, GitBranch, TrendingUp, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMission } from "@/contexts/MissionContext";
import { getMissionApiUrl } from "@/lib/mission-client";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface GenomeSkill {
  id: string;
  skillKey: string;
  title: string;
  description: string;
  category: "negotiation" | "persistence" | "recovery";
  venueKey: string | null;
  generation: number;
  liftScore: number | null;
  usageCount: number;
  improvementLabel?: string | null;
}

interface MissionRecord {
  id: string;
  missionText: string;
  status: string;
  mode: string;
  timestamp: string;
  generationAtTime: number;
  skillsActiveAtTime: number;
  successCount: number;
  totalCalls: number;
}

interface ReplayImprovement {
  skillKey: string;
  title: string;
  impact: string;
  likelihoodBoost: string;
}

interface ReplayDiff {
  missionId: string;
  generationAtTime: number;
  currentGeneration: number;
  improvements: ReplayImprovement[];
  summary: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const CATEGORY_STYLES: Record<string, string> = {
  negotiation: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  persistence: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  recovery:    "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function GenerationBadge({ generation }: { generation: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
      <GitBranch className="w-2.5 h-2.5" />
      Gen {generation}
    </span>
  );
}

function SkillRow({ skill }: { skill: GenomeSkill }) {
  const catStyle = CATEGORY_STYLES[skill.category] || CATEGORY_STYLES.negotiation;
  const lift = skill.liftScore != null ? Math.round(skill.liftScore * 100) : null;
  const liftColor = lift == null ? "text-muted-foreground" : lift >= 65 ? "text-green-400" : lift >= 40 ? "text-amber-400" : "text-red-400";

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-lg border border-border/40 bg-card/50 p-2.5 space-y-1.5"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold text-foreground leading-tight flex-1">{skill.title}</p>
        <GenerationBadge generation={skill.generation} />
      </div>
      <p className="text-[9px] font-mono text-muted-foreground leading-snug">{skill.description}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${catStyle}`}>
          {skill.category}
        </span>
        {lift != null && (
          <span className={`text-[9px] font-mono ${liftColor}`}>
            {lift}% lift
          </span>
        )}
        {skill.usageCount > 0 && (
          <span className="text-[8px] font-mono text-muted-foreground/70">
            {skill.usageCount}× used
          </span>
        )}
        {skill.improvementLabel && (
          <span className="text-[8px] font-mono text-primary/70 italic">{skill.improvementLabel}</span>
        )}
      </div>
    </motion.div>
  );
}

function MissionReplayCard({ mission, onReplay }: { mission: MissionRecord; onReplay: (id: string) => void }) {
  const successRate = mission.totalCalls > 0 ? Math.round((mission.successCount / mission.totalCalls) * 100) : 0;
  const rateColor = successRate >= 60 ? "text-green-400" : successRate >= 30 ? "text-amber-400" : "text-red-400";

  return (
    <div className="flex items-center justify-between gap-2 p-2 rounded-lg border border-border/30 bg-card/30 hover:bg-card/50 transition-colors">
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-mono text-foreground truncate">{mission.missionText}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[8px] font-mono text-muted-foreground/70">Gen {mission.generationAtTime}</span>
          <span className={`text-[8px] font-mono ${rateColor}`}>{successRate}% success</span>
          <span className="text-[8px] font-mono text-muted-foreground/50">
            {new Date(mission.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onReplay(mission.id)}
        className="shrink-0 flex items-center gap-1 text-[9px] font-mono text-primary hover:text-primary/80 transition-colors px-1.5 py-0.5 rounded border border-primary/30 hover:bg-primary/10"
      >
        <Play className="w-2.5 h-2.5" />
        Replay
      </button>
    </div>
  );
}

function ReplayDiffPanel({ diff, onClose }: { diff: ReplayDiff; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="rounded-lg border border-primary/30 bg-card/70 p-3 space-y-2.5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-semibold text-foreground">Replay Diff</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-muted-foreground">Gen {diff.generationAtTime} → Gen {diff.currentGeneration}</span>
          <button
            type="button"
            onClick={onClose}
            className="text-[9px] font-mono text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
      </div>

      <p className="text-[9px] font-mono text-muted-foreground italic">{diff.summary}</p>

      {diff.improvements.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[8px] font-mono text-muted-foreground uppercase">Behavioral changes today</p>
          {diff.improvements.map((imp, i) => (
            <div key={i} className="flex items-start gap-2 p-1.5 rounded bg-primary/5 border border-primary/10">
              <Zap className="w-2.5 h-2.5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] font-mono text-foreground">{imp.impact}</p>
                <p className="text-[8px] font-mono text-green-400">{imp.likelihoodBoost}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Panel ────────────────────────────────────────────────────────────────

export function SkillGenomePanel() {
  const { genomeGeneration, genomeSkills, omlsStatus } = useMission();
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"skills" | "missions">("skills");
  const [skills, setSkills] = useState<GenomeSkill[]>([]);
  const [missions, setMissions] = useState<MissionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [replayDiff, setReplayDiff] = useState<ReplayDiff | null>(null);
  const [training, setTraining] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [skillsRes, missionsRes] = await Promise.all([
        fetch(getMissionApiUrl("/api/genome/skills")),
        fetch(getMissionApiUrl("/api/genome/missions")),
      ]);
      if (skillsRes.ok) {
        const data = await skillsRes.json() as { skills: GenomeSkill[] };
        setSkills(data.skills);
      }
      if (missionsRes.ok) {
        const data = await missionsRes.json() as { missions: MissionRecord[] };
        setMissions(data.missions.slice().reverse());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, genomeGeneration, genomeSkills.length]);

  const handleReplay = useCallback(async (missionId: string) => {
    try {
      const res = await fetch(getMissionApiUrl(`/api/genome/missions/${missionId}/replay`));
      if (res.ok) {
        const diff = await res.json() as ReplayDiff;
        setReplayDiff(diff);
      }
    } catch {
      toast.error("Failed to generate replay diff");
    }
  }, []);

  const handleOmlsTrain = useCallback(async () => {
    setTraining(true);
    try {
      await fetch(getMissionApiUrl("/api/genome/train"), { method: "POST" });
      await fetchData();
      toast.success("OMLS consolidation complete");
    } finally {
      setTraining(false);
    }
  }, [fetchData]);

  const displayedSkills = skills.length > 0 ? skills : genomeSkills as unknown as GenomeSkill[];

  return (
    <div className="space-y-1">
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1 hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Dna className="w-3.5 h-3.5 text-primary" />
          Skill Genome
          {displayedSkills.length > 0 && (
            <span className="text-[9px] font-mono bg-primary/20 text-primary px-1.5 rounded-full">
              {displayedSkills.length}
            </span>
          )}
        </span>
        <div className="flex items-center gap-2">
          {/* Generation counter */}
          <motion.span
            key={genomeGeneration}
            initial={{ scale: 1.3, color: "hsl(var(--primary))" }}
            animate={{ scale: 1 }}
            className="text-[9px] font-mono text-primary"
          >
            Gen {genomeGeneration}
          </motion.span>
          {/* OMLS indicator */}
          {omlsStatus === "training" && (
            <span className="text-[9px] font-mono text-amber-400 animate-pulse flex items-center gap-0.5">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              OMLS
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${collapsed ? "" : "rotate-180"}`} />
        </div>
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
            {/* Tab bar */}
            <div className="flex items-center gap-1 px-1">
              <button
                type="button"
                onClick={() => setActiveTab("skills")}
                className={`text-[9px] font-mono px-2 py-0.5 rounded transition-colors ${
                  activeTab === "skills" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Skills
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("missions")}
                className={`text-[9px] font-mono px-2 py-0.5 rounded transition-colors ${
                  activeTab === "missions" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Missions
              </button>
              <button
                type="button"
                onClick={fetchData}
                disabled={loading}
                className="ml-auto text-[9px] font-mono text-muted-foreground hover:text-foreground transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {/* Replay diff panel */}
            <AnimatePresence>
              {replayDiff && (
                <ReplayDiffPanel diff={replayDiff} onClose={() => setReplayDiff(null)} />
              )}
            </AnimatePresence>

            {/* Skills tab */}
            {activeTab === "skills" && (
              <div className="space-y-1.5">
                {displayedSkills.length === 0 ? (
                  <div className="text-center py-4 space-y-1.5">
                    <p className="text-[10px] font-mono text-muted-foreground">
                      No skills evolved yet
                    </p>
                    <p className="text-[9px] font-mono text-muted-foreground/60">
                      Run a mission to evolve the first generation
                    </p>
                  </div>
                ) : (
                  displayedSkills
                    .sort((a, b) => (b.generation || 0) - (a.generation || 0))
                    .map(skill => <SkillRow key={skill.skillKey || skill.id} skill={skill} />)
                )}
                {displayedSkills.length > 0 && (
                  <button
                    type="button"
                    onClick={handleOmlsTrain}
                    disabled={training || omlsStatus === "training"}
                    className="w-full text-[9px] font-mono text-muted-foreground hover:text-primary transition-colors py-1 border border-border/30 rounded hover:border-primary/30 disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    {training ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                    {training ? "Consolidating…" : "Run OMLS consolidation"}
                  </button>
                )}
              </div>
            )}

            {/* Missions tab */}
            {activeTab === "missions" && (
              <div className="space-y-1.5">
                {missions.length === 0 ? (
                  <p className="text-[10px] font-mono text-muted-foreground text-center py-4">
                    No missions recorded
                  </p>
                ) : (
                  missions.map(m => (
                    <MissionReplayCard key={m.id} mission={m} onReplay={handleReplay} />
                  ))
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
