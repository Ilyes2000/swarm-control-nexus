import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type AgentStatus = "idle" | "thinking" | "speaking" | "calling" | "listening" | "retrying";

export interface AgentPersonality {
  color: string; // tailwind color token
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
  confidence: number; // 0-100
  personality: AgentPersonality;
  listeningTo: string | null; // id of agent being listened to
}

export type AutonomyMode = "suggest" | "confirm" | "autobook";

export interface AutonomyConstraints {
  maxBudget: number | null;
  latestTime: string | null;
  minConfidence: number | null;
}

export interface ApprovalRequest {
  id: string;
  agentId: string;
  action: string;
  details: {
    venue: string;
    time: string;
    partySize: number;
    estimatedCost: string;
    confidence: number;
  };
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

export interface MissionSummary {
  visible: boolean;
  result: string;
  costBreakdown: { label: string; amount: string }[];
  timeTaken: string;
  optimization?: OptimizationData;
}

export interface SourceReference {
  label: string;
  url?: string;
  type: "api" | "web" | "call" | "sms" | "cache" | "fallback";
  freshness: "live" | "cached" | "stale" | "simulated";
  verified: boolean;
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
  sources?: SourceReference[];
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
  trainingMode: boolean;
  demoMode: boolean;
  userInput: string;
  autonomyMode: AutonomyMode;
  autonomyConstraints: AutonomyConstraints;
  pendingApproval: ApprovalRequest | null;
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
  setTrainingMode: (on: boolean) => void;
  setDemoMode: (on: boolean) => void;
  setUserInput: (input: string) => void;
  setAutonomyMode: (mode: AutonomyMode) => void;
  setAutonomyConstraints: (constraints: Partial<AutonomyConstraints>) => void;
  setPendingApproval: (request: ApprovalRequest | null) => void;
  hydrateMission: (state: Partial<MissionState>) => void;
  resetMission: () => void;
}

const personalities: Record<string, AgentPersonality> = {
  planner: { color: "purple", trait: "Strategic & Methodical", tone: "Authoritative", riskTolerance: "low" },
  call: { color: "green", trait: "Charming & Persuasive", tone: "Warm & Professional", riskTolerance: "medium" },
  negotiation: { color: "amber", trait: "Aggressive & Analytical", tone: "Sharp & Direct", riskTolerance: "high" },
  scheduler: { color: "blue", trait: "Precise & Efficient", tone: "Calm & Organized", riskTolerance: "low" },
  research: { color: "cyan", trait: "Curious & Thorough", tone: "Informative", riskTolerance: "medium" },
};

const defaultAgents: Agent[] = [
  { id: "planner", name: "Planner Agent", emoji: "🧠", status: "idle", currentTask: "", liveText: "", confidence: 0, personality: personalities.planner, listeningTo: null },
  { id: "call", name: "Call Agent", emoji: "📞", status: "idle", currentTask: "", liveText: "", confidence: 0, personality: personalities.call, listeningTo: null },
  { id: "negotiation", name: "Negotiation Agent", emoji: "💰", status: "idle", currentTask: "", liveText: "", confidence: 0, personality: personalities.negotiation, listeningTo: null },
  { id: "scheduler", name: "Scheduler Agent", emoji: "📅", status: "idle", currentTask: "", liveText: "", confidence: 0, personality: personalities.scheduler, listeningTo: null },
  { id: "research", name: "Research Agent", emoji: "🔍", status: "idle", currentTask: "", liveText: "", confidence: 0, personality: personalities.research, listeningTo: null },
];

const defaultCall: CallState = { active: false, caller: "", receiver: "", duration: 0, transcript: [], status: "ended" };

const defaultSummary: MissionSummary = { visible: false, result: "", costBreakdown: [], timeTaken: "" };
const defaultAutonomyConstraints: AutonomyConstraints = {
  maxBudget: 150,
  latestTime: "22:00",
  minConfidence: 80,
};

export function createInitialMissionState(): MissionState {
  return {
    missionStatus: "idle",
    agents: defaultAgents.map((agent) => ({ ...agent })),
    timeline: [],
    call: { ...defaultCall, transcript: [] },
    smsLog: [],
    summary: { ...defaultSummary, costBreakdown: [] },
    reasoning: [],
    memory: [],
    skills: [],
    adaptations: [],
    trainingMode: false,
    demoMode: false,
    userInput: "",
    autonomyMode: "confirm",
    autonomyConstraints: { ...defaultAutonomyConstraints },
    pendingApproval: null,
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
      transcript: state.call?.transcript ?? base.call.transcript,
    },
    smsLog: state.smsLog ?? base.smsLog,
    summary: {
      ...base.summary,
      ...state.summary,
      costBreakdown: state.summary?.costBreakdown ?? base.summary.costBreakdown,
      optimization: state.summary?.optimization,
    },
    autonomyMode: state.autonomyMode ?? base.autonomyMode,
    autonomyConstraints: {
      ...base.autonomyConstraints,
      ...state.autonomyConstraints,
    },
    pendingApproval: state.pendingApproval ?? base.pendingApproval,
    reasoning: state.reasoning ?? base.reasoning,
    memory: state.memory ?? base.memory,
    skills: state.skills ?? base.skills,
    adaptations: state.adaptations ?? base.adaptations,
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
      agents: s.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
  }, []);

  const addTimelineEntry = useCallback((entry: TimelineEntry) => {
    setState((s) => ({ ...s, timeline: [...s.timeline, entry] }));
  }, []);

  const updateTimelineEntry = useCallback((id: string, updates: Partial<TimelineEntry>) => {
    setState((s) => ({
      ...s,
      timeline: s.timeline.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  }, []);

  const setCall = useCallback((call: CallState) => {
    setState((s) => ({ ...s, call }));
  }, []);

  const addCallTranscript = useCallback((speaker: string, text: string) => {
    setState((s) => ({
      ...s,
      call: { ...s.call, transcript: [...s.call.transcript, { speaker, text }] },
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
      skills: s.skills.map((sk) => (sk.id === id ? { ...sk, usageCount: sk.usageCount + 1 } : sk)),
    }));
  }, []);

  const addAdaptation = useCallback((event: AdaptationEvent) => {
    setState((s) => ({ ...s, adaptations: [...s.adaptations, event] }));
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

  const setAutonomyMode = useCallback((autonomyMode: AutonomyMode) => {
    setState((s) => ({ ...s, autonomyMode }));
  }, []);

  const setAutonomyConstraints = useCallback((constraints: Partial<AutonomyConstraints>) => {
    setState((s) => ({
      ...s,
      autonomyConstraints: {
        ...s.autonomyConstraints,
        ...constraints,
      },
    }));
  }, []);

  const setPendingApproval = useCallback((pendingApproval: ApprovalRequest | null) => {
    setState((s) => ({ ...s, pendingApproval }));
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
        ...state, setMissionStatus, updateAgent, addTimelineEntry, updateTimelineEntry,
        setCall, addCallTranscript, addSMS, setSummary, addReasoning, addMemory,
        addSkill, updateSkillUsage, addAdaptation, setTrainingMode,
        setDemoMode, setUserInput, setAutonomyMode, setAutonomyConstraints,
        setPendingApproval, hydrateMission, resetMission,
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
