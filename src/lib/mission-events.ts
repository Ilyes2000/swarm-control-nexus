import type {
  AdaptationEvent,
  Agent,
  CallState,
  MemoryEntry,
  MissionState,
  MissionSummary,
  ReasoningEntry,
  Skill,
  SMSMessage,
  TimelineEntry,
} from "@/contexts/MissionContext";

export type MissionMode = "live" | "simulation";

export interface MissionEventActions {
  hydrateMission: (state: Partial<MissionState>) => void;
  setMissionStatus: (status: MissionState["missionStatus"]) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  addTimelineEntry: (entry: TimelineEntry) => void;
  updateTimelineEntry: (id: string, updates: Partial<TimelineEntry>) => void;
  setCall: (call: CallState) => void;
  addCallTranscript: (speaker: string, text: string) => void;
  addSMS: (msg: SMSMessage) => void;
  setSummary: (summary: MissionSummary) => void;
  addReasoning: (entry: ReasoningEntry) => void;
  addMemory: (entry: MemoryEntry) => void;
  addSkill: (skill: Skill) => void;
  addAdaptation: (event: AdaptationEvent) => void;
  setTrainingMode: (enabled: boolean) => void;
  setDemoMode: (enabled: boolean) => void;
  setUserInput: (input: string) => void;
}

export interface MissionEventMap {
  snapshot: MissionState;
  mission_status: { status: MissionState["missionStatus"]; mode?: MissionMode };
  agent_update: { id: string; updates: Partial<Agent> };
  timeline_entry: TimelineEntry;
  timeline_update: { id: string; updates: Partial<TimelineEntry> };
  call_update: CallState;
  call_transcript: { speaker: string; text: string };
  sms: SMSMessage;
  summary: MissionSummary;
  reasoning: ReasoningEntry;
  memory: MemoryEntry;
  skill: Skill;
  adaptation: AdaptationEvent;
  training_mode: { enabled: boolean };
  error: { message: string; detail?: string };
}

export type MissionEvent = {
  [Type in keyof MissionEventMap]: {
    type: Type;
    payload: MissionEventMap[Type];
    ts: string;
  };
}[keyof MissionEventMap];

export function applyMissionEvent(event: MissionEvent, actions: MissionEventActions) {
  switch (event.type) {
    case "snapshot":
      actions.hydrateMission(event.payload);
      break;
    case "mission_status":
      actions.setMissionStatus(event.payload.status);
      if (event.payload.mode) {
        actions.setDemoMode(event.payload.mode === "simulation");
      }
      break;
    case "agent_update":
      actions.updateAgent(event.payload.id, event.payload.updates);
      break;
    case "timeline_entry":
      actions.addTimelineEntry(event.payload);
      break;
    case "timeline_update":
      actions.updateTimelineEntry(event.payload.id, event.payload.updates);
      break;
    case "call_update":
      actions.setCall(event.payload);
      break;
    case "call_transcript":
      actions.addCallTranscript(event.payload.speaker, event.payload.text);
      break;
    case "sms":
      actions.addSMS(event.payload);
      break;
    case "summary":
      actions.setSummary(event.payload);
      break;
    case "reasoning":
      actions.addReasoning(event.payload);
      break;
    case "memory":
      actions.addMemory(event.payload);
      break;
    case "skill":
      actions.addSkill(event.payload);
      break;
    case "adaptation":
      actions.addAdaptation(event.payload);
      break;
    case "training_mode":
      actions.setTrainingMode(event.payload.enabled);
      break;
    case "error":
      break;
    default:
      break;
  }
}
