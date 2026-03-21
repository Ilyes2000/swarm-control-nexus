const personalities = {
  planner: { color: "purple", trait: "Strategic & Methodical", tone: "Authoritative", riskTolerance: "low" },
  call: { color: "green", trait: "Charming & Persuasive", tone: "Warm & Professional", riskTolerance: "medium" },
  negotiation: { color: "amber", trait: "Aggressive & Analytical", tone: "Sharp & Direct", riskTolerance: "high" },
  scheduler: { color: "blue", trait: "Precise & Efficient", tone: "Calm & Organized", riskTolerance: "low" },
  research: { color: "cyan", trait: "Curious & Thorough", tone: "Informative", riskTolerance: "medium" },
};

const defaultAgents = [
  { id: "planner", name: "Planner Agent", emoji: "🧠", status: "idle", currentTask: "", liveText: "", confidence: 0, personality: personalities.planner, listeningTo: null },
  { id: "call", name: "Call Agent", emoji: "📞", status: "idle", currentTask: "", liveText: "", confidence: 0, personality: personalities.call, listeningTo: null },
  { id: "negotiation", name: "Negotiation Agent", emoji: "💰", status: "idle", currentTask: "", liveText: "", confidence: 0, personality: personalities.negotiation, listeningTo: null },
  { id: "scheduler", name: "Scheduler Agent", emoji: "📅", status: "idle", currentTask: "", liveText: "", confidence: 0, personality: personalities.scheduler, listeningTo: null },
  { id: "research", name: "Research Agent", emoji: "🔍", status: "idle", currentTask: "", liveText: "", confidence: 0, personality: personalities.research, listeningTo: null }
];

export function createInitialMissionState() {
  return {
    missionStatus: "idle",
    agents: defaultAgents.map((agent) => ({ ...agent })),
    timeline: [],
    call: {
      active: false,
      caller: "",
      receiver: "",
      duration: 0,
      transcript: [],
      status: "ended"
    },
    smsLog: [],
    summary: {
      visible: false,
      result: "",
      costBreakdown: [],
      timeTaken: ""
    },
    reasoning: [],
    memory: [],
    skills: [],
    adaptations: [],
    trainingMode: false,
    demoMode: false,
    userInput: "",
    autonomyMode: "confirm",
    autonomyConstraints: {
      maxBudget: null,
      latestTime: null,
      minConfidence: null
    },
    pendingApproval: null
  };
}

export function cloneState(state) {
  return structuredClone(state);
}
