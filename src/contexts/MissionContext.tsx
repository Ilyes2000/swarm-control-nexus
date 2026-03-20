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

interface MissionState {
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
  setDemoMode: (on: boolean) => void;
  setUserInput: (input: string) => void;
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

const initialState: MissionState = {
  missionStatus: "idle",
  agents: defaultAgents,
  timeline: [],
  call: defaultCall,
  smsLog: [],
  summary: defaultSummary,
  reasoning: [],
  memory: [],
  demoMode: false,
  userInput: "",
};

const MissionContext = createContext<MissionContextType | null>(null);

export function MissionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MissionState>(initialState);

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

  const setDemoMode = useCallback((demoMode: boolean) => {
    setState((s) => ({ ...s, demoMode }));
  }, []);

  const setUserInput = useCallback((userInput: string) => {
    setState((s) => ({ ...s, userInput }));
  }, []);

  const resetMission = useCallback(() => {
    setState(initialState);
  }, []);

  return (
    <MissionContext.Provider
      value={{
        ...state, setMissionStatus, updateAgent, addTimelineEntry, updateTimelineEntry,
        setCall, addCallTranscript, addSMS, setSummary, addReasoning, addMemory,
        setDemoMode, setUserInput, resetMission,
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
