const personalities = {
  planner: { color: "purple", trait: "Strategic & Adaptive", tone: "Structured", riskTolerance: "low" },
  tutor: { color: "cyan", trait: "Patient & Explanatory", tone: "Warm", riskTolerance: "low" },
  solver: { color: "green", trait: "Precise & Analytical", tone: "Direct", riskTolerance: "medium" },
  proof: { color: "amber", trait: "Rigorous & Formal", tone: "Scholarly", riskTolerance: "low" },
  revision: { color: "blue", trait: "Systematic & Retentive", tone: "Calm", riskTolerance: "medium" },
  coach: { color: "purple", trait: "Motivating & Protective", tone: "Encouraging", riskTolerance: "medium" }
};

const defaultAgents = [
  { id: "planner", name: "Planner Agent", emoji: "🧠", status: "idle", currentTask: "", liveText: "", confidence: 0, personality: personalities.planner, listeningTo: null },
  { id: "tutor", name: "Tutor Agent", emoji: "📚", status: "idle", currentTask: "", liveText: "", confidence: 0, personality: personalities.tutor, listeningTo: null },
  { id: "solver", name: "Solver Agent", emoji: "🧮", status: "idle", currentTask: "", liveText: "", confidence: 0, personality: personalities.solver, listeningTo: null },
  { id: "proof", name: "Proof Agent", emoji: "📐", status: "idle", currentTask: "", liveText: "", confidence: 0, personality: personalities.proof, listeningTo: null },
  { id: "revision", name: "Revision Agent", emoji: "🔁", status: "idle", currentTask: "", liveText: "", confidence: 0, personality: personalities.revision, listeningTo: null },
  { id: "coach", name: "Coach Agent", emoji: "🌟", status: "idle", currentTask: "", liveText: "", confidence: 0, personality: personalities.coach, listeningTo: null }
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
      missionTitle: "",
      result: "",
      costBreakdown: [],
      metrics: [],
      nextActions: [],
      focusAreas: [],
      readinessScore: 0,
      riskLevel: "low",
      timeTaken: ""
    },
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

export function cloneState(state) {
  return structuredClone(state);
}
