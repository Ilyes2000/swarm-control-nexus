import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type AgentStatus = "idle" | "thinking" | "speaking" | "calling" | "listening" | "retrying";

export interface AgentPersonality {
  color: string;
  trait: string;
  tone: string;
  riskTolerance: "low" | "medium" | "high";
}

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  status: AgentStatus;
  currentTask: string;
  liveText: string;
  confidence: number;
  personality: AgentPersonality;
  listeningTo: string | null;
}

export interface MemoryEntry {
  id: string;
  agentId: string;
  type: "preference" | "context" | "decision";
  label: string;
  value: string;
  timestamp: string;
}

export interface Skill {
  id: string;
  title: string;
  description: string;
  source: string;
  version: number;
  usageCount: number;
  createdAt: string;
  agentId: string;
}

export interface AdaptationEvent {
  id: string;
  message: string;
  timestamp: string;
  type: "learning" | "improving" | "evolved";
}

export interface TimelineEntry {
  id: string;
  timestamp: string;
  agentId: string;
  agentEmoji: string;
  agentName: string;
  description: string;
  status: "success" | "pending" | "failed" | "retrying" | "fallback";
  retryCount?: number;
}

export interface CallState {
  active: boolean;
  caller: string;
  receiver: string;
  duration: number;
  transcript: { speaker: string; text: string }[];
  status: "ringing" | "connected" | "ended";
}

export interface SMSMessage {
  id: string;
  from: string;
  text: string;
  timestamp: string;
  direction: "sent" | "received";
}

export interface OptimizationData {
  originalCost: string;
  optimizedCost: string;
  savedAmount: string;
  savedPercent: string;
  tradeoffs: { label: string; original: string; optimized: string }[];
}

export interface MissionMetric {
  label: string;
  value: string;
  tone?: "info" | "success" | "warning";
}

export interface MasteryUpdate {
  id: string;
  topic: string;
  mastery: number;
  confidence: number;
  trend: "up" | "steady" | "down";
  timestamp: string;
}

export interface RiskSignal {
  id: string;
  level: "low" | "moderate" | "high";
  title: string;
  message: string;
  nextAction: string;
}

export interface KnowledgeTwinNode {
  id: string;
  label: string;
  cluster: string;
  mastery: number;
  confidence: number;
  status: "solid" | "developing" | "fragile" | "at-risk";
}

export interface MissionSummary {
  visible: boolean;
  missionTitle?: string;
  result: string;
  costBreakdown: { label: string; amount: string }[];
  metrics?: MissionMetric[];
  nextActions?: string[];
  focusAreas?: string[];
  readinessScore?: number;
  riskLevel?: "low" | "moderate" | "high";
  timeTaken: string;
  optimization?: OptimizationData;
}

export interface ReasoningEntry {
  id: string;
  agentId: string;
  agentEmoji: string;
  agentName: string;
  decision: string;
  reasoning: string;
  confidence: number;
  alternatives: string[];
  timestamp: string;
}

export interface MissionState {
  missionStatus: "idle" | "live" | "completed";
  agents: Agent[];
  timeline: TimelineEntry[];
  call: CallState;
  smsLog: SMSMessage[];
  summary: MissionSummary;
  reasoning: ReasoningEntry[];
  memory: MemoryEntry[];
  skills: Skill[];
  adaptations: AdaptationEvent[];
  masteryUpdates: MasteryUpdate[];
  riskSignals: RiskSignal[];
  knowledgeTwin: KnowledgeTwinNode[];
  trainingMode: boolean;
  demoMode: boolean;
  userInput: string;
}

interface MissionContextType extends MissionState {
  setMissionStatus: (s: MissionState["missionStatus"]) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  addTimelineEntry: (entry: TimelineEntry) => void;
  updateTimelineEntry: (id: string, updates: Partial<TimelineEntry>) => void;
  setCall: (call: CallState) => void;
  addCallTranscript: (speaker: string, text: string) => void;
  addSMS: (msg: SMSMessage) => void;
  setSummary: (s: MissionSummary) => void;
  addReasoning: (entry: ReasoningEntry) => void;
  addMemory: (entry: MemoryEntry) => void;
  addSkill: (skill: Skill) => void;
  updateSkillUsage: (id: string) => void;
  addAdaptation: (event: AdaptationEvent) => void;
  addMasteryUpdate: (event: MasteryUpdate) => void;
  addRiskSignal: (event: RiskSignal) => void;
  setKnowledgeTwin: (nodes: KnowledgeTwinNode[]) => void;
  setTrainingMode: (on: boolean) => void;
  setDemoMode: (on: boolean) => void;
  setUserInput: (input: string) => void;
  hydrateMission: (state: Partial<MissionState>) => void;
  resetMission: () => void;
}

const personalities: Record<string, AgentPersonality> = {
  planner: { color: "purple", trait: "Strategic & Adaptive", tone: "Structured", riskTolerance: "low" },
  tutor: { color: "cyan", trait: "Patient & Explanatory", tone: "Warm", riskTolerance: "low" },
  solver: { color: "green", trait: "Precise & Analytical", tone: "Direct", riskTolerance: "medium" },
  proof: { color: "amber", trait: "Rigorous & Formal", tone: "Scholarly", riskTolerance: "low" },
  revision: { color: "blue", trait: "Systematic & Retentive", tone: "Calm", riskTolerance: "medium" },
  coach: { color: "purple", trait: "Motivating & Protective", tone: "Encouraging", riskTolerance: "medium" },
  research: { color: "cyan", trait: "Curious & Thorough", tone: "Informative", riskTolerance: "medium" },
  call: { color: "green", trait: "Warm & Professional", tone: "Focused", riskTolerance: "medium" },
  negotiation: { color: "amber", trait: "Analytical", tone: "Sharp", riskTolerance: "high" },
  scheduler: { color: "blue", trait: "Organized", tone: "Calm", riskTolerance: "low" }
};

const defaultAgents: Agent[] = [
  { id: "planner", name: "Planner Agent", emoji: "🧠", status: "idle", currentTask: "", liveText: "", confidence: 0, personality: personalities.planner, listeningTo: null },
  { id: "tutor", name: "Tutor Agent", emoji: "📚", status: "idle", currentTask: "", liveText: "", confidence: 0, personality: personalities.tutor, listeningTo: null },
  { id: "solver", name: "Solver Agent", emoji: "🧮", status: "idle", currentTask: "", liveText: "", confidence: 0, personality: personalities.solver, listeningTo: null },
  { id: "proof", name: "Proof Agent", emoji: "📐", status: "idle", currentTask: "", liveText: "", confidence: 0, personality: personalities.proof, listeningTo: null },
  { id: "revision", name: "Revision Agent", emoji: "🔁", status: "idle", currentTask: "", liveText: "", confidence: 0, personality: personalities.revision, listeningTo: null },
  { id: "coach", name: "Coach Agent", emoji: "🌟", status: "idle", currentTask: "", liveText: "", confidence: 0, personality: personalities.coach, listeningTo: null }
];

const defaultCall: CallState = { active: false, caller: "", receiver: "", duration: 0, transcript: [], status: "ended" };

const defaultSummary: MissionSummary = {
  visible: false,
  missionTitle: "",
  result: "",
  costBreakdown: [],
  metrics: [],
  nextActions: [],
  focusAreas: [],
  readinessScore: 0,
  riskLevel: "low",
  timeTaken: ""
};

export function createInitialMissionState(): MissionState {
  return {
    missionStatus: "idle",
    agents: defaultAgents.map((agent) => ({ ...agent })),
    timeline: [],
    call: { ...defaultCall, transcript: [] },
    smsLog: [],
    summary: { ...defaultSummary, costBreakdown: [], metrics: [], nextActions: [], focusAreas: [] },
    reasoning: [],
    memory: [],
    skills: [],
    adaptations: [],
    masteryUpdates: [],
    riskSignals: [],
    knowledgeTwin: [],
    trainingMode: false,
    demoMode: false,
    userInput: ""
  };
}

function normalizeMissionState(state: Partial<MissionState>): MissionState {
  const base = createInitialMissionState();

  return {
    ...base,
    ...state,
    agents: state.agents ?? base.agents,
    timeline: state.timeline ?? base.timeline,
    call: {
      ...base.call,
      ...state.call,
      transcript: state.call?.transcript ?? base.call.transcript
    },
    smsLog: state.smsLog ?? base.smsLog,
    summary: {
      ...base.summary,
      ...state.summary,
      costBreakdown: state.summary?.costBreakdown ?? base.summary.costBreakdown,
      metrics: state.summary?.metrics ?? base.summary.metrics,
      nextActions: state.summary?.nextActions ?? base.summary.nextActions,
      focusAreas: state.summary?.focusAreas ?? base.summary.focusAreas,
      optimization: state.summary?.optimization
    },
    reasoning: state.reasoning ?? base.reasoning,
    memory: state.memory ?? base.memory,
    skills: state.skills ?? base.skills,
    adaptations: state.adaptations ?? base.adaptations,
    masteryUpdates: state.masteryUpdates ?? base.masteryUpdates,
    riskSignals: state.riskSignals ?? base.riskSignals,
    knowledgeTwin: state.knowledgeTwin ?? base.knowledgeTwin
  };
}

const MissionContext = createContext<MissionContextType | null>(null);

export function MissionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MissionState>(() => createInitialMissionState());

  const setMissionStatus = useCallback((missionStatus: MissionState["missionStatus"]) => {
    setState((s) => ({ ...s, missionStatus }));
  }, []);

  const updateAgent = useCallback((id: string, updates: Partial<Agent>) => {
    setState((s) => ({
      ...s,
      agents: s.agents.map((a) => (a.id === id ? { ...a, ...updates } : a))
    }));
  }, []);

  const addTimelineEntry = useCallback((entry: TimelineEntry) => {
    setState((s) => ({ ...s, timeline: [...s.timeline, entry] }));
  }, []);

  const updateTimelineEntry = useCallback((id: string, updates: Partial<TimelineEntry>) => {
    setState((s) => ({
      ...s,
      timeline: s.timeline.map((t) => (t.id === id ? { ...t, ...updates } : t))
    }));
  }, []);

  const setCall = useCallback((call: CallState) => {
    setState((s) => ({ ...s, call }));
  }, []);

  const addCallTranscript = useCallback((speaker: string, text: string) => {
    setState((s) => ({
      ...s,
      call: { ...s.call, transcript: [...s.call.transcript, { speaker, text }] }
    }));
  }, []);

  const addSMS = useCallback((msg: SMSMessage) => {
    setState((s) => ({ ...s, smsLog: [...s.smsLog, msg] }));
  }, []);

  const setSummary = useCallback((summary: MissionSummary) => {
    setState((s) => ({ ...s, summary }));
  }, []);

  const addReasoning = useCallback((entry: ReasoningEntry) => {
    setState((s) => ({ ...s, reasoning: [...s.reasoning, entry] }));
  }, []);

  const addMemory = useCallback((entry: MemoryEntry) => {
    setState((s) => ({ ...s, memory: [...s.memory, entry] }));
  }, []);

  const addSkill = useCallback((skill: Skill) => {
    setState((s) => ({ ...s, skills: [...s.skills, skill] }));
  }, []);

  const updateSkillUsage = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      skills: s.skills.map((sk) => (sk.id === id ? { ...sk, usageCount: sk.usageCount + 1 } : sk))
    }));
  }, []);

  const addAdaptation = useCallback((event: AdaptationEvent) => {
    setState((s) => ({ ...s, adaptations: [...s.adaptations, event] }));
  }, []);

  const addMasteryUpdate = useCallback((event: MasteryUpdate) => {
    setState((s) => ({ ...s, masteryUpdates: [...s.masteryUpdates, event] }));
  }, []);

  const addRiskSignal = useCallback((event: RiskSignal) => {
    setState((s) => ({ ...s, riskSignals: [...s.riskSignals, event] }));
  }, []);

  const setKnowledgeTwin = useCallback((knowledgeTwin: KnowledgeTwinNode[]) => {
    setState((s) => ({ ...s, knowledgeTwin }));
  }, []);

  const setTrainingMode = useCallback((trainingMode: boolean) => {
    setState((s) => ({ ...s, trainingMode }));
  }, []);

  const setDemoMode = useCallback((demoMode: boolean) => {
    setState((s) => ({ ...s, demoMode }));
  }, []);

  const setUserInput = useCallback((userInput: string) => {
    setState((s) => ({ ...s, userInput }));
  }, []);

  const hydrateMission = useCallback((nextState: Partial<MissionState>) => {
    setState(normalizeMissionState(nextState));
  }, []);

  const resetMission = useCallback(() => {
    setState(createInitialMissionState());
  }, []);

  return (
    <MissionContext.Provider
      value={{
        ...state,
        setMissionStatus,
        updateAgent,
        addTimelineEntry,
        updateTimelineEntry,
        setCall,
        addCallTranscript,
        addSMS,
        setSummary,
        addReasoning,
        addMemory,
        addSkill,
        updateSkillUsage,
        addAdaptation,
        addMasteryUpdate,
        addRiskSignal,
        setKnowledgeTwin,
        setTrainingMode,
        setDemoMode,
        setUserInput,
        hydrateMission,
        resetMission
      }}
    >
      {children}
    </MissionContext.Provider>
  );
}

export function useMission() {
  const ctx = useContext(MissionContext);
  if (!ctx) throw new Error("useMission must be used within MissionProvider");
  return ctx;
}
