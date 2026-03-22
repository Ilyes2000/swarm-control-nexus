import type {
  AdaptationEvent,
  Agent,
  ApprovalRequest,
  CallState,
  MerchantOffer,
  MemoryEntry,
  MissionState,
  MissionSummary,
  PendingItineraryConfirmation,
  RecommendationInsight,
  ReasoningEntry,
  ShadowPath,
  Skill,
  SMSMessage,
  TimelineEntry,
  VenueMemory,
  VenueIntelligenceEvent,
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
  setPendingApproval: (request: ApprovalRequest | null) => void;
  setPendingItineraryConfirmation: (request: PendingItineraryConfirmation | null) => void;
  addMerchantOffer: (offer: MerchantOffer) => void;
  updateMerchantOffer: (id: string, updates: Partial<MerchantOffer>) => void;
  addRecommendationInsight: (insight: RecommendationInsight) => void;
  updateSkill: (skillKey: string, updates: Partial<Skill>) => void;
  setShadowPaths: (paths: ShadowPath[]) => void;
  setShadowStatus: (status: "idle" | "running" | "ready") => void;
  upsertVenueMemory: (venueName: string, memory: VenueMemory) => void;
  setActiveVenueIntelligence: (payload: VenueIntelligenceEvent | null) => void;
  setGenomeGeneration: (generation: number) => void;
  addGenomeSkills: (skills: Skill[]) => void;
  setOmlsStatus: (status: string) => void;
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
  approval_request: ApprovalRequest;
  approval_cleared: { id?: string | null };
  itinerary_confirmation_request: PendingItineraryConfirmation;
  itinerary_confirmation_cleared: { id?: string | null };
  merchant_offer: MerchantOffer;
  merchant_offer_update: { id: string; updates: Partial<MerchantOffer> };
  recommendation_insight: RecommendationInsight;
  skill_update: { skillKey: string; updates: Partial<Skill> };
  error: { message: string; detail?: string };
  shadow_status: { status: "idle" | "running" | "ready" };
  shadow_paths: { paths: ShadowPath[] };
  venue_intelligence: VenueIntelligenceEvent;
  venue_memory_updated: { venueName: string; memory: VenueMemory; newSkillLearned: string | null };
  skill_genome_evolved: { generation: number; newSkills: Skill[]; totalSkills: number };
  skill_generation_update: { generation: number; delta: number };
  omls_training_complete: { status: string; generation: number; consolidated?: number; totalSkills?: number };
  skills_injected: { skills: Skill[]; venueName: string };
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
    case "skill_update":
      actions.updateSkill(event.payload.skillKey, event.payload.updates);
      break;
    case "adaptation":
      actions.addAdaptation(event.payload);
      break;
    case "training_mode":
      actions.setTrainingMode(event.payload.enabled);
      break;
    case "approval_request":
      actions.setPendingApproval(event.payload);
      break;
    case "approval_cleared":
      actions.setPendingApproval(null);
      break;
    case "itinerary_confirmation_request":
      actions.setPendingItineraryConfirmation(event.payload);
      break;
    case "itinerary_confirmation_cleared":
      actions.setPendingItineraryConfirmation(null);
      break;
    case "merchant_offer":
      actions.addMerchantOffer(event.payload);
      break;
    case "merchant_offer_update":
      actions.updateMerchantOffer(event.payload.id, event.payload.updates);
      break;
    case "recommendation_insight":
      actions.addRecommendationInsight(event.payload);
      break;
    case "error":
      break;
    case "shadow_status":
      actions.setShadowStatus(event.payload.status);
      break;
    case "shadow_paths":
      actions.setShadowPaths(event.payload.paths);
      break;
    case "venue_intelligence":
      actions.setActiveVenueIntelligence(event.payload);
      break;
    case "venue_memory_updated":
      actions.upsertVenueMemory(event.payload.venueName, event.payload.memory);
      break;
    case "skill_genome_evolved":
      actions.setGenomeGeneration(event.payload.generation);
      actions.addGenomeSkills(event.payload.newSkills);
      break;
    case "skill_generation_update":
      actions.setGenomeGeneration(event.payload.generation);
      break;
    case "omls_training_complete":
      actions.setOmlsStatus(event.payload.status);
      if (event.payload.totalSkills != null) {
        // skills updated via genome evolved events; just track status
      }
      break;
    case "skills_injected":
      // Informational: skills already in library
      break;
    default:
      break;
  }
}
