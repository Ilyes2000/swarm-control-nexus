import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type AgentStatus = "idle" | "thinking" | "speaking" | "calling";

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  status: AgentStatus;
  currentTask: string;
  liveText: string;
}

export interface TimelineEntry {
  id: string;
  timestamp: string;
  agentId: string;
  agentEmoji: string;
  agentName: string;
  description: string;
  status: "success" | "pending" | "failed";
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

export interface MissionSummary {
  visible: boolean;
  result: string;
  costBreakdown: { label: string; amount: string }[];
  timeTaken: string;
}

export interface ReasoningEntry {
  id: string;
  agentId: string;
  agentEmoji: string;
  agentName: string;
  decision: string;
  reasoning: string;
  confidence: number; // 0-100
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
  demoMode: boolean;
  userInput: string;
}

interface MissionContextType extends MissionState {
  setMissionStatus: (s: MissionState["missionStatus"]) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  addTimelineEntry: (entry: TimelineEntry) => void;
  setCall: (call: CallState) => void;
  addCallTranscript: (speaker: string, text: string) => void;
  addSMS: (msg: SMSMessage) => void;
  setSummary: (s: MissionSummary) => void;
  addReasoning: (entry: ReasoningEntry) => void;
  setDemoMode: (on: boolean) => void;
  setUserInput: (input: string) => void;
  resetMission: () => void;
}

const defaultAgents: Agent[] = [
  { id: "planner", name: "Planner Agent", emoji: "🧠", status: "idle", currentTask: "", liveText: "" },
  { id: "call", name: "Call Agent", emoji: "📞", status: "idle", currentTask: "", liveText: "" },
  { id: "negotiation", name: "Negotiation Agent", emoji: "💰", status: "idle", currentTask: "", liveText: "" },
  { id: "scheduler", name: "Scheduler Agent", emoji: "📅", status: "idle", currentTask: "", liveText: "" },
  { id: "research", name: "Research Agent", emoji: "🔍", status: "idle", currentTask: "", liveText: "" },
];

const defaultCall: CallState = {
  active: false,
  caller: "",
  receiver: "",
  duration: 0,
  transcript: [],
  status: "ended",
};

const defaultSummary: MissionSummary = {
  visible: false,
  result: "",
  costBreakdown: [],
  timeTaken: "",
};

const initialState: MissionState = {
  missionStatus: "idle",
  agents: defaultAgents,
  timeline: [],
  call: defaultCall,
  smsLog: [],
  summary: defaultSummary,
  reasoning: [],
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
        ...state,
        setMissionStatus,
        updateAgent,
        addTimelineEntry,
        setCall,
        addCallTranscript,
        addSMS,
        setSummary,
        addReasoning,
        setDemoMode,
        setUserInput,
        resetMission,
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
