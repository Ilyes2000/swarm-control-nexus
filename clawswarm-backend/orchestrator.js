import { createInitialMissionState, cloneState } from "./state.js";
import { createEvent } from "./protocol.js";
import { createLlmGateway } from "./integrations/llm.js";
import { createTelnyxSmsClient } from "./integrations/telnyx-sms.js";
import { createClawdtalkClient } from "./integrations/clawdtalk.js";
import { createResembleClient } from "./integrations/resemble.js";
import { runPlannerAgent } from "./agents/planner.js";
import { runTutorAgent } from "./agents/tutor.js";
import { runSolverAgent } from "./agents/solver.js";
import { runProofAgent } from "./agents/proof.js";
import { runRevisionAgent } from "./agents/revision.js";
import { runCoachAgent } from "./agents/coach.js";
import { runResearchAgent } from "./agents/research.js";
import { runNegotiatorAgent } from "./agents/negotiator.js";
import { runSchedulerAgent } from "./agents/scheduler.js";
import { runCallerAgent } from "./agents/caller.js";

function createAbortError() {
  return new Error("Mission run aborted");
}

function nowLabel() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  });
}

function detectMissionDomain({ missionText, productArea }) {
  if (productArea === "study" || productArea === "concierge") {
    return productArea;
  }

  const normalized = String(missionText ?? "").toLowerCase();
  if (/(restaurant|dinner|movie|reservation|date night|tickets|cinema|table|booking|venue|outfit|trip|flight|hotel)/i.test(normalized)) {
    return "concierge";
  }
  return "study";
}

export class MissionOrchestrator {
  constructor({ config, emitEvent, studyStore }) {
    this.config = config;
    this.emitEvent = emitEvent;
    this.studyStore = studyStore;
    this.llm = createLlmGateway(config);
    this.smsClient = createTelnyxSmsClient(config);
    this.clawdtalk = createClawdtalkClient(config);
    this.resemble = createResembleClient(config);
    this.state = createInitialMissionState();
    this.sequenceNumber = 0;
    this.currentRunId = 0;
    this.currentController = null;
    this.currentRunPromise = null;
    this.currentMissionDomain = "study";
  }

  getState() {
    return cloneState(this.state);
  }

  waitForCurrentRun() {
    return this.currentRunPromise ?? Promise.resolve();
  }

  broadcast(type, payload) {
    this.emitEvent(createEvent(type, payload));
  }

  broadcastSnapshot() {
    this.broadcast("snapshot", this.getState());
  }

  setMissionStatus(status, mode) {
    this.state.missionStatus = status;
    if (mode) {
      this.state.demoMode = mode === "simulation";
    }
    this.broadcast("mission_status", { status, mode });
  }

  updateAgent(id, updates) {
    this.state.agents = this.state.agents.map((agent) => (agent.id === id ? { ...agent, ...updates } : agent));
    this.broadcast("agent_update", { id, updates });
  }

  addTimelineEntry(entry) {
    this.state.timeline.push(entry);
    this.broadcast("timeline_entry", entry);
  }

  updateTimelineEntry(id, updates) {
    this.state.timeline = this.state.timeline.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry));
    this.broadcast("timeline_update", { id, updates });
  }

  setCall(call) {
    this.state.call = call;
    this.broadcast("call_update", call);
  }

  addCallTranscript(speaker, text) {
    this.state.call = {
      ...this.state.call,
      transcript: [...this.state.call.transcript, { speaker, text }]
    };
    this.broadcast("call_transcript", { speaker, text });
  }

  addSms(message) {
    this.state.smsLog.push(message);
    this.broadcast("sms", message);
  }

  setSummary(summary) {
    this.state.summary = summary;
    this.broadcast("summary", summary);
  }

  addReasoning(entry) {
    this.state.reasoning.push(entry);
    this.broadcast("reasoning", entry);
  }

  addMemory(entry) {
    this.state.memory.push(entry);
    this.broadcast("memory", entry);
  }

  addSkill(skill) {
    this.state.skills.push(skill);
    this.broadcast("skill", skill);
  }

  addAdaptation(event) {
    this.state.adaptations.push(event);
    this.broadcast("adaptation", event);
  }

  addMasteryUpdate(update) {
    this.state.masteryUpdates.push(update);
    this.broadcast("mastery_updated", update);
  }

  addRiskSignal(signal) {
    this.state.riskSignals.push(signal);
    this.broadcast("risk_signal", signal);
  }

  setKnowledgeTwin(nodes) {
    this.state.knowledgeTwin = nodes;
    this.broadcast("knowledge_twin_updated", nodes);
  }

  setTrainingMode(enabled) {
    this.state.trainingMode = enabled;
    this.broadcast("training_mode", { enabled });
  }

  nextId(prefix) {
    this.sequenceNumber += 1;
    return `${prefix}-${this.sequenceNumber}`;
  }

  ensureActiveRun(signal) {
    if (signal.aborted) {
      throw createAbortError();
    }
  }

  async waitStep(signal, multiplier = 1) {
    const duration = Math.max(0, this.config.simulationDelayMs * multiplier);
    if (duration === 0) {
      this.ensureActiveRun(signal);
      return;
    }

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      }, duration);

      const onAbort = () => {
        clearTimeout(timer);
        reject(createAbortError());
      };

      signal.addEventListener("abort", onAbort, { once: true });
    });
  }

  resetMission({ broadcast = true } = {}) {
    if (this.currentController) {
      this.currentController.abort();
    }

    this.state = createInitialMissionState();
    this.currentController = null;
    this.currentRunPromise = null;
    this.currentMissionDomain = "study";

    if (broadcast) {
      this.broadcastSnapshot();
      this.setMissionStatus("idle", "live");
    }
  }

  async startMission({ missionText, mode = "live", productArea }) {
    if (!missionText?.trim()) {
      throw new Error("missionText is required");
    }

    this.resetMission({ broadcast: false });
    this.currentRunId += 1;
    this.currentController = new AbortController();
    const signal = this.currentController.signal;
    const runId = this.currentRunId;
    const missionDomain = detectMissionDomain({ missionText, productArea });
    this.currentMissionDomain = missionDomain;

    this.state.userInput = missionText.trim();
    this.state.demoMode = mode === "simulation";
    this.broadcastSnapshot();
    this.setMissionStatus("live", mode);

    this.currentRunPromise = this.runMission({ missionText: missionText.trim(), mode, signal, productArea: missionDomain })
      .catch((error) => {
        if (signal.aborted) {
          return;
        }

        const message = error instanceof Error ? error.message : "Mission failed";
        this.broadcast("error", { message });
        this.addTimelineEntry({
          id: this.nextId("timeline"),
          timestamp: nowLabel(),
          agentId: "planner",
          agentEmoji: "⚠️",
          agentName: "System",
          description: `Mission failed: ${message}`,
          status: "failed"
        });
        this.setMissionStatus("completed", mode);
      })
      .finally(() => {
        if (this.currentRunId === runId) {
          this.currentController = null;
        }
      });

    return { ok: true, mode, productArea: missionDomain };
  }

  async interruptMission({ command }) {
    if (!this.currentController || this.state.missionStatus !== "live") {
      throw new Error("No live mission to interrupt");
    }

    const mode = this.state.demoMode ? "simulation" : "live";
    this.currentController.abort();
    this.currentRunId += 1;
    this.currentController = new AbortController();
    const runId = this.currentRunId;
    const signal = this.currentController.signal;

    this.currentRunPromise = this.runInterrupt({ command, mode, signal }).finally(() => {
      if (this.currentRunId === runId) {
        this.currentController = null;
      }
    });

    return { ok: true };
  }

  async handleInboundSms(message) {
    const sms = {
      id: this.nextId("sms"),
      from: message.from || "Student",
      text: message.text,
      timestamp: nowLabel(),
      direction: "received"
    };

    this.addSms(sms);

    if (message.command === "CONFIRM") {
      this.addTimelineEntry({
        id: this.nextId("timeline"),
        timestamp: nowLabel(),
        agentId: "coach",
        agentEmoji: "✅",
        agentName: "Student",
        description: "Student confirmed the updated study plan.",
        status: "success"
      });
    }

    if (message.command === "MODIFY") {
      this.addTimelineEntry({
        id: this.nextId("timeline"),
        timestamp: nowLabel(),
        agentId: "planner",
        agentEmoji: "📝",
        agentName: "Student",
        description: "Student requested a study-plan modification by message.",
        status: "pending"
      });
    }
  }

  async sendUserSms(text) {
    const sms = {
      id: this.nextId("sms"),
      from: "Study Mission OS",
      text,
      timestamp: nowLabel(),
      direction: "sent"
    };

    this.addSms(sms);
    await this.smsClient.sendMessage({
      to: this.config.userPhoneNumber,
      text
    });
  }

  async runMission({ missionText, mode, signal, productArea = "study" }) {
    if (productArea === "concierge") {
      return this.runConciergeMission({ missionText, mode, signal });
    }

    const planningContext = this.studyStore.getPlanningContext({ missionText });

    this.addMemory({
      id: this.nextId("memory"),
      agentId: "planner",
      type: "preference",
      label: "Mission request",
      value: missionText,
      timestamp: "captured"
    });

    this.updateAgent("planner", {
      status: "thinking",
      currentTask: "Building a study mission",
      liveText: "Decomposing goals, deadlines, and energy constraints.",
      confidence: 76
    });
    const plannerTimelineId = this.nextId("timeline");
    this.addTimelineEntry({
      id: plannerTimelineId,
      timestamp: nowLabel(),
      agentId: "planner",
      agentEmoji: "🧠",
      agentName: "Planner Agent",
      description: `Analyzing study mission: ${missionText}`,
      status: "pending"
    });
    await this.waitStep(signal, 1);

    const plannerResult = await runPlannerAgent({ missionText, llm: this.llm, context: planningContext });
    const persistedPlan = this.studyStore.createMissionPlan({ missionText, plannerResult });
    this.broadcast("plan_generated", {
      missionId: persistedPlan.mission.id,
      title: plannerResult.missionTitle,
      focusAreas: plannerResult.focusAreas,
      readinessScore: plannerResult.readinessBaseline,
      riskLevel: plannerResult.activeRisk?.level ?? "low"
    });
    persistedPlan.tasks.forEach((task) => this.broadcast("task_created", task));
    persistedPlan.sessions.forEach((session) => this.broadcast("session_scheduled", session));

    this.updateAgent("planner", {
      status: "speaking",
      currentTask: "Publishing roadmap",
      liveText: plannerResult.liveText,
      confidence: plannerResult.confidence
    });
    this.updateTimelineEntry(plannerTimelineId, { status: "success" });
    this.addReasoning({
      id: this.nextId("reasoning"),
      agentId: "planner",
      agentEmoji: "🧠",
      agentName: "Planner Agent",
      decision: `Sequenced ${plannerResult.tasks.length} tasks across ${plannerResult.sessions.length} study sessions.`,
      reasoning: plannerResult.reasoning,
      confidence: plannerResult.confidence,
      alternatives: ["Keep a broad study plan", "Delay revision until after diagnostics"],
      timestamp: nowLabel()
    });
    this.addMemory({
      id: this.nextId("memory"),
      agentId: "planner",
      type: "context",
      label: "Focus areas",
      value: plannerResult.focusAreas.join(", "),
      timestamp: nowLabel()
    });
    await this.waitStep(signal, 1);

    this.updateAgent("planner", { status: "idle", currentTask: "", liveText: "", confidence: 0 });
    this.updateAgent("tutor", {
      status: "thinking",
      currentTask: "Building concept explanations",
      liveText: "Translating the hardest topic into a student-friendly explanation.",
      confidence: 73
    });
    const tutorTimelineId = this.nextId("timeline");
    this.addTimelineEntry({
      id: tutorTimelineId,
      timestamp: nowLabel(),
      agentId: "tutor",
      agentEmoji: "📚",
      agentName: "Tutor Agent",
      description: "Preparing concept scaffolds and hint ladders.",
      status: "pending"
    });
    await this.waitStep(signal, 1);

    const tutorResult = await runTutorAgent({ missionText, llm: this.llm });
    this.studyStore.recordMissionEvent(persistedPlan.mission.id, "hint_revealed", `Prepared ${tutorResult.hints.length} hint steps for ${plannerResult.focusAreas[0]}.`);
    tutorResult.hints.forEach((hint) => this.broadcast("hint_revealed", { missionId: persistedPlan.mission.id, hint }));
    this.updateAgent("tutor", {
      status: "speaking",
      currentTask: "Explaining key ideas",
      liveText: tutorResult.liveText,
      confidence: tutorResult.confidence
    });
    this.updateTimelineEntry(tutorTimelineId, { status: "success" });
    this.addReasoning({
      id: this.nextId("reasoning"),
      agentId: "tutor",
      agentEmoji: "📚",
      agentName: "Tutor Agent",
      decision: "Prepared intuitive, formal, and exam-style explanations for the mission.",
      reasoning: "Students retain more when the same idea is available in multiple frames and the hint ladder delays answer leakage until the student commits to a first step.",
      confidence: tutorResult.confidence,
      alternatives: ["Give only direct worked solutions", "Delay tutoring until after practice"],
      timestamp: nowLabel()
    });
    await this.waitStep(signal, 0.5);

    this.setCall({
      active: true,
      caller: "Tutor Agent",
      receiver: "Student Workspace",
      duration: 0,
      transcript: [],
      status: "ringing"
    });
    await this.waitStep(signal, 0.5);
    this.setCall({
      active: true,
      caller: "Tutor Agent",
      receiver: "Student Workspace",
      duration: 2,
      transcript: [],
      status: "connected"
    });
    for (const [index, line] of tutorResult.transcript.entries()) {
      await this.waitStep(signal, 0.35);
      this.addCallTranscript(line.speaker, line.text);
      this.setCall({
        ...this.state.call,
        active: true,
        caller: "Tutor Agent",
        receiver: "Student Workspace",
        duration: 3 + index,
        status: "connected"
      });
    }
    this.setCall({
      active: true,
      caller: "Tutor Agent",
      receiver: "Student Workspace",
      duration: tutorResult.transcript.length + 3,
      transcript: [],
      status: "ended"
    });
    this.updateAgent("tutor", { status: "idle", currentTask: "", liveText: "", confidence: 0 });

    this.updateAgent("solver", {
      status: "thinking",
      currentTask: "Scoring a sample attempt",
      liveText: "Looking for the first error, not just the final error.",
      confidence: 78
    });
    const solverTimelineId = this.nextId("timeline");
    this.addTimelineEntry({
      id: solverTimelineId,
      timestamp: nowLabel(),
      agentId: "solver",
      agentEmoji: "🧮",
      agentName: "Solver Agent",
      description: "Running attempt analysis and method selection.",
      status: "pending"
    });
    await this.waitStep(signal, 1);

    const solverResult = await runSolverAgent({ missionText, llm: this.llm, context: planningContext });
    this.studyStore.recordMissionEvent(persistedPlan.mission.id, "attempt_scored", `Scored a guided attempt at ${solverResult.attemptScore}%.`);
    this.broadcast("attempt_scored", {
      missionId: persistedPlan.mission.id,
      score: solverResult.attemptScore,
      firstError: solverResult.firstError
    });
    this.updateAgent("solver", {
      status: "speaking",
      currentTask: "Publishing error diagnosis",
      liveText: solverResult.liveText,
      confidence: solverResult.confidence
    });
    this.updateTimelineEntry(solverTimelineId, { status: "success" });
    this.addReasoning({
      id: this.nextId("reasoning"),
      agentId: "solver",
      agentEmoji: "🧮",
      agentName: "Solver Agent",
      decision: "Located the first unstable step and recommended a safer method.",
      reasoning: solverResult.firstError,
      confidence: solverResult.confidence,
      alternatives: ["Score only the final answer", "Give a full solution immediately"],
      timestamp: nowLabel()
    });
    this.addMemory({
      id: this.nextId("memory"),
      agentId: "solver",
      type: "decision",
      label: "Primary mistake pattern",
      value: solverResult.mistakePatterns[0],
      timestamp: nowLabel()
    });
    await this.waitStep(signal, 0.75);

    this.updateAgent("solver", { status: "idle", currentTask: "", liveText: "", confidence: 0 });
    this.updateAgent("proof", {
      status: "thinking",
      currentTask: "Adding justification guardrails",
      liveText: "Making each step defensible under exam pressure.",
      confidence: 71
    });
    const proofTimelineId = this.nextId("timeline");
    this.addTimelineEntry({
      id: proofTimelineId,
      timestamp: nowLabel(),
      agentId: "proof",
      agentEmoji: "📐",
      agentName: "Proof Agent",
      description: "Converting method choices into formal justifications.",
      status: "pending"
    });
    await this.waitStep(signal, 0.75);

    const proofResult = await runProofAgent({ missionText, llm: this.llm });
    this.updateAgent("proof", {
      status: "speaking",
      currentTask: "Publishing proof checklist",
      liveText: proofResult.liveText,
      confidence: proofResult.confidence
    });
    this.updateTimelineEntry(proofTimelineId, { status: "success" });
    this.addReasoning({
      id: this.nextId("reasoning"),
      agentId: "proof",
      agentEmoji: "📐",
      agentName: "Proof Agent",
      decision: "Added a justification checklist to protect method quality and theorem usage.",
      reasoning: proofResult.reasoning,
      confidence: proofResult.confidence,
      alternatives: ["Skip formal checks", "Attach proof guidance only after failure"],
      timestamp: nowLabel()
    });
    await this.waitStep(signal, 0.75);

    this.updateAgent("proof", { status: "idle", currentTask: "", liveText: "", confidence: 0 });
    this.updateAgent("revision", {
      status: "thinking",
      currentTask: "Scheduling retrieval loops",
      liveText: "Turning weak spots into a spaced-repetition queue.",
      confidence: 80
    });
    const revisionTimelineId = this.nextId("timeline");
    this.addTimelineEntry({
      id: revisionTimelineId,
      timestamp: nowLabel(),
      agentId: "revision",
      agentEmoji: "🔁",
      agentName: "Revision Agent",
      description: "Building revision loops and the knowledge twin.",
      status: "pending"
    });
    await this.waitStep(signal, 1);

    const revisionResult = await runRevisionAgent({ missionText, llm: this.llm, context: planningContext });
    revisionResult.masteryUpdates.forEach((update) => this.addMasteryUpdate(update));
    this.setKnowledgeTwin(revisionResult.knowledgeTwin);
    this.studyStore.recordMissionEvent(persistedPlan.mission.id, "knowledge_twin_updated", `Updated ${revisionResult.knowledgeTwin.length} mastery nodes after revision planning.`);
    this.updateAgent("revision", {
      status: "speaking",
      currentTask: "Publishing retention plan",
      liveText: revisionResult.liveText,
      confidence: revisionResult.confidence
    });
    this.updateTimelineEntry(revisionTimelineId, { status: "success" });
    this.addReasoning({
      id: this.nextId("reasoning"),
      agentId: "revision",
      agentEmoji: "🔁",
      agentName: "Revision Agent",
      decision: "Scheduled mixed review around the weakest concepts and the fastest forgetting risks.",
      reasoning: "Revision is ordered by fragility, upcoming pressure, and the student's confidence gap so we improve recall and metacognition together.",
      confidence: revisionResult.confidence,
      alternatives: ["Review only the newest material", "Do untimed review after the exam block"],
      timestamp: nowLabel()
    });
    this.addSkill({
      id: this.nextId("skill"),
      title: "Confidence-calibrated revision",
      description: "Blend mastery gain and self-reported confidence so the next review block targets the real gap.",
      source: "Revision engine",
      version: 1,
      usageCount: 1,
      createdAt: nowLabel(),
      agentId: "revision"
    });
    await this.waitStep(signal, 0.75);

    this.updateAgent("revision", { status: "idle", currentTask: "", liveText: "", confidence: 0 });
    this.updateAgent("coach", {
      status: "thinking",
      currentTask: "Protecting execution and motivation",
      liveText: "Converting the plan into nudges, guardrails, and a realistic readiness score.",
      confidence: 83
    });
    const coachTimelineId = this.nextId("timeline");
    this.addTimelineEntry({
      id: coachTimelineId,
      timestamp: nowLabel(),
      agentId: "coach",
      agentEmoji: "🌟",
      agentName: "Coach Agent",
      description: "Synthesizing readiness, next actions, and focus-risk guardrails.",
      status: "pending"
    });
    await this.waitStep(signal, 1);

    const coachResult = await runCoachAgent({
      missionText,
      llm: this.llm,
      plannerResult,
      solverResult,
      revisionResult,
      context: planningContext
    });
    this.studyStore.completeMission({
      missionId: persistedPlan.mission.id,
      coachResult,
      revisionResult,
      solverResult
    });

    this.addRiskSignal(coachResult.riskSignal);
    coachResult.nudges.forEach((nudge) => {
      void nudge;
      this.addSms({
        id: this.nextId("sms"),
        from: "Coach Agent",
        text: nudge.text,
        timestamp: nowLabel(),
        direction: "sent"
      });
    });
    this.updateAgent("coach", {
      status: "speaking",
      currentTask: "Publishing readiness brief",
      liveText: coachResult.liveText,
      confidence: coachResult.confidence
    });
    this.updateTimelineEntry(coachTimelineId, { status: "success" });
    this.addReasoning({
      id: this.nextId("reasoning"),
      agentId: "coach",
      agentEmoji: "🌟",
      agentName: "Coach Agent",
      decision: "Reduced overload risk while keeping the mission aggressive enough to raise readiness.",
      reasoning: coachResult.riskSignal.message,
      confidence: coachResult.confidence,
      alternatives: ["Keep maximum intensity for every session", "Defer diagnostics and hope confidence recovers"],
      timestamp: nowLabel()
    });

    const summary = {
      visible: true,
      missionTitle: plannerResult.missionTitle,
      result: `Mission ready: ${plannerResult.missionTitle}. The student now has a focused ${plannerResult.sessions.length}-session path with targeted tutoring, retrieval practice, and confidence guardrails around ${plannerResult.focusAreas.join(", ")}.`,
      costBreakdown: coachResult.studyMetrics.map((metric) => ({ label: metric.label, amount: metric.value })),
      metrics: coachResult.studyMetrics,
      nextActions: coachResult.nextActions,
      focusAreas: plannerResult.focusAreas,
      readinessScore: coachResult.readinessScore,
      riskLevel: coachResult.riskLevel,
      timeTaken: "under 30 seconds"
    };

    this.setSummary(summary);
    this.addTimelineEntry({
      id: this.nextId("timeline"),
      timestamp: nowLabel(),
      agentId: "planner",
      agentEmoji: "✅",
      agentName: "Planner Agent",
      description: "Study mission completed and synced to the student workspace.",
      status: "success"
    });
    if (plannerResult.rescueMode) {
      this.broadcast("exam_mode_started", {
        missionId: persistedPlan.mission.id,
        title: plannerResult.missionTitle
      });
    }
    await this.sendUserSms(`Study mission ready. Readiness ${coachResult.readinessScore}%. Next action: ${coachResult.nextActions[0]} Reply CONFIRM or MODIFY.`);

    this.addAdaptation({
      id: this.nextId("adaptation"),
      message: "Mission completed. The system is evaluating confidence gaps and revision timing.",
      timestamp: nowLabel(),
      type: "improving"
    });
    this.setTrainingMode(true);
    await this.waitStep(signal, 0.5);
    this.setTrainingMode(false);
    this.updateAgent("coach", { status: "idle", currentTask: "", liveText: "", confidence: 0 });
    this.setMissionStatus("completed", mode);
  }

  async runConciergeMission({ missionText, mode, signal }) {
    this.addMemory({
      id: this.nextId("memory"),
      agentId: "planner",
      type: "preference",
      label: "Concierge mission request",
      value: missionText,
      timestamp: "captured"
    });

    this.updateAgent("planner", {
      status: "thinking",
      currentTask: "Decomposing the outing mission",
      liveText: "Breaking the request into research, booking, savings, and itinerary steps.",
      confidence: 82
    });
    const plannerTimelineId = this.nextId("timeline");
    this.addTimelineEntry({
      id: plannerTimelineId,
      timestamp: nowLabel(),
      agentId: "planner",
      agentEmoji: "🧠",
      agentName: "Planner Agent",
      description: `Analyzing concierge mission: ${missionText}`,
      status: "pending"
    });
    await this.waitStep(signal, 1);

    const plannerLiveText = await this.llm.generateText({
      system: "Summarize a concierge mission plan in one sentence.",
      prompt: `Mission: ${missionText}`,
      fallback: "Created a four-step concierge plan: research venues, confirm reservations, optimize cost, and lock the itinerary."
    });
    const conciergeTasks = [
      { title: "Research best-fit restaurant", step: "research", due: "Now" },
      { title: "Confirm reservation by phone", step: "call", due: "Immediately after research" },
      { title: "Apply savings and discounts", step: "negotiation", due: "Before checkout" },
      { title: "Finalize itinerary and confirmations", step: "scheduler", due: "Before sending plan" }
    ];
    this.broadcast("plan_generated", {
      missionId: `concierge-${Date.now()}`,
      title: "Concierge Mission",
      focusAreas: ["Restaurant fit", "Booking", "Cost optimization", "Timing"]
    });
    conciergeTasks.forEach((task) => this.broadcast("task_created", task));

    this.updateAgent("planner", {
      status: "speaking",
      currentTask: "Publishing concierge task graph",
      liveText: plannerLiveText,
      confidence: 94
    });
    this.updateTimelineEntry(plannerTimelineId, { status: "success" });
    this.addReasoning({
      id: this.nextId("reasoning"),
      agentId: "planner",
      agentEmoji: "🧠",
      agentName: "Planner Agent",
      decision: "Split the request into research, booking, savings, and scheduling.",
      reasoning: "A dinner-and-booking style mission works best when venue quality is verified first, booking is confirmed second, then cost optimization and final itinerary happen against real availability.",
      confidence: 94,
      alternatives: ["Book the first available venue", "Negotiate before availability is confirmed"],
      timestamp: nowLabel()
    });
    await this.waitStep(signal, 1);
    this.updateAgent("planner", { status: "idle", currentTask: "", liveText: "", confidence: 0 });

    this.updateAgent("research", {
      status: "thinking",
      currentTask: "Searching venues",
      liveText: "Comparing restaurant fit, distance, and showtime compatibility.",
      confidence: 71
    });
    const researchTimelineId = this.nextId("timeline");
    this.addTimelineEntry({
      id: researchTimelineId,
      timestamp: nowLabel(),
      agentId: "research",
      agentEmoji: "🔍",
      agentName: "Research Agent",
      description: "Searching venues and entertainment options.",
      status: "pending"
    });
    await this.waitStep(signal, 1);

    const researchResult = await runResearchAgent({ missionText, llm: this.llm });
    this.updateAgent("research", {
      status: "speaking",
      currentTask: "Publishing ranked options",
      liveText: researchResult.liveText,
      confidence: researchResult.confidence
    });
    this.updateTimelineEntry(researchTimelineId, { status: researchResult.usedFallback ? "fallback" : "success" });
    this.addReasoning({
      id: this.nextId("reasoning"),
      agentId: "research",
      agentEmoji: "🔍",
      agentName: "Research Agent",
      decision: `Selected ${researchResult.restaurant.name} and ${researchResult.cinema.name}.`,
      reasoning: researchResult.reasoning,
      confidence: researchResult.confidence,
      alternatives: [`Different restaurant`, `${researchResult.cinema.movieTitle} at another cinema`],
      timestamp: nowLabel()
    });
    this.addMemory({
      id: this.nextId("memory"),
      agentId: "research",
      type: "context",
      label: "Selected venue pair",
      value: `${researchResult.restaurant.name} + ${researchResult.cinema.movieTitle} at ${researchResult.cinema.name}`,
      timestamp: nowLabel()
    });
    await this.waitStep(signal, 0.75);
    this.updateAgent("research", { status: "idle", currentTask: "", liveText: "", confidence: 0 });

    this.updateAgent("call", {
      status: "calling",
      currentTask: `Calling ${researchResult.restaurant.name}`,
      liveText: "Requesting a reservation using the concierge voice workflow.",
      confidence: 78
    });
    const callTimelineId = this.nextId("timeline");
    this.addTimelineEntry({
      id: callTimelineId,
      timestamp: nowLabel(),
      agentId: "call",
      agentEmoji: "📞",
      agentName: "Call Agent",
      description: `Calling ${researchResult.restaurant.name} to confirm the reservation.`,
      status: "pending"
    });
    this.setCall({
      active: true,
      caller: "Call Agent",
      receiver: researchResult.restaurant.name,
      duration: 0,
      transcript: [],
      status: "ringing"
    });
    await this.waitStep(signal, 0.5);

    const callResult = await runCallerAgent({
      businessName: researchResult.restaurant.name,
      businessPhone: researchResult.restaurant.phone,
      reservationLine: `Hi, I'd like to book a table for two tonight around ${researchResult.restaurant.reservationTime}.`,
      mode,
      clawdtalk: this.clawdtalk,
      resemble: this.resemble,
      missionVoiceName: this.config.missionVoiceName
    });
    this.setCall({
      active: true,
      caller: "Call Agent",
      receiver: researchResult.restaurant.name,
      duration: 1,
      transcript: [],
      status: "connected"
    });
    for (const [index, line] of callResult.transcript.entries()) {
      await this.waitStep(signal, 0.25);
      this.addCallTranscript(line.speaker, line.text);
      this.setCall({
        ...this.state.call,
        active: true,
        caller: "Call Agent",
        receiver: researchResult.restaurant.name,
        duration: 2 + index,
        status: "connected"
      });
    }
    this.setCall({
      active: true,
      caller: "Call Agent",
      receiver: researchResult.restaurant.name,
      duration: callResult.transcript.length + 2,
      transcript: [],
      status: "ended"
    });
    this.updateAgent("call", {
      status: "speaking",
      currentTask: "Reservation confirmed",
      liveText: `${researchResult.restaurant.name} confirmed ${researchResult.restaurant.reservationTime} for two.`,
      confidence: 91
    });
    this.updateTimelineEntry(callTimelineId, { status: "success" });
    this.addReasoning({
      id: this.nextId("reasoning"),
      agentId: "call",
      agentEmoji: "📞",
      agentName: "Call Agent",
      decision: "Used the voice-call workflow to secure the reservation.",
      reasoning: "Phone confirmation can outperform web booking when availability is changing in real time or when a host can manually hold a table.",
      confidence: 91,
      alternatives: ["Try online booking only", "Switch venues immediately"],
      timestamp: nowLabel()
    });
    await this.waitStep(signal, 0.75);
    this.updateAgent("call", { status: "idle", currentTask: "", liveText: "", confidence: 0 });

    this.updateAgent("negotiation", {
      status: "thinking",
      currentTask: "Optimizing spend",
      liveText: "Looking for stackable discounts and cleaner checkout options.",
      confidence: 74
    });
    const negotiationTimelineId = this.nextId("timeline");
    this.addTimelineEntry({
      id: negotiationTimelineId,
      timestamp: nowLabel(),
      agentId: "negotiation",
      agentEmoji: "💰",
      agentName: "Negotiation Agent",
      description: "Checking discounts and savings opportunities.",
      status: "pending"
    });
    await this.waitStep(signal, 1);

    const negotiationResult = await runNegotiatorAgent({ researchResult, llm: this.llm });
    this.updateAgent("negotiation", {
      status: "speaking",
      currentTask: "Publishing savings plan",
      liveText: negotiationResult.liveText,
      confidence: negotiationResult.confidence
    });
    this.updateTimelineEntry(negotiationTimelineId, { status: "success" });
    this.addReasoning({
      id: this.nextId("reasoning"),
      agentId: "negotiation",
      agentEmoji: "💰",
      agentName: "Negotiation Agent",
      decision: `Reduced projected spend by $${negotiationResult.savings.totalSavings.toFixed(2)}.`,
      reasoning: negotiationResult.reasoning,
      confidence: negotiationResult.confidence,
      alternatives: ["Skip discounts for speed", "Use one-time prepay deal"],
      timestamp: nowLabel()
    });
    await this.waitStep(signal, 0.75);
    this.updateAgent("negotiation", { status: "idle", currentTask: "", liveText: "", confidence: 0 });

    this.updateAgent("scheduler", {
      status: "thinking",
      currentTask: "Finalizing itinerary",
      liveText: "Sequencing dinner, travel, and showtime into one clean plan.",
      confidence: 82
    });
    const schedulerTimelineId = this.nextId("timeline");
    this.addTimelineEntry({
      id: schedulerTimelineId,
      timestamp: nowLabel(),
      agentId: "scheduler",
      agentEmoji: "📅",
      agentName: "Scheduler Agent",
      description: "Building the final itinerary and confirmations.",
      status: "pending"
    });
    await this.waitStep(signal, 1);

    const schedulerResult = await runSchedulerAgent({ researchResult, negotiationResult, llm: this.llm });
    const summary = {
      ...schedulerResult.summary,
      missionTitle: "Concierge Mission Ready",
      metrics: [
        { label: "Restaurant", value: researchResult.restaurant.name, tone: "info" },
        { label: "Movie", value: researchResult.cinema.movieTitle, tone: "info" },
        { label: "Savings", value: `$${negotiationResult.savings.totalSavings.toFixed(2)}`, tone: "success" },
        { label: "Confidence", value: `${schedulerResult.confidence}%`, tone: "success" }
      ],
      nextActions: [
        `Arrive at ${researchResult.restaurant.name} by ${researchResult.restaurant.reservationTime}.`,
        `Keep the cinema transfer window intact before ${researchResult.cinema.showtime}.`,
        "Reply MODIFY if timing, venue, or budget constraints change."
      ],
      focusAreas: [researchResult.restaurant.name, researchResult.cinema.movieTitle],
      readinessScore: schedulerResult.confidence,
      riskLevel: "low"
    };

    this.updateAgent("scheduler", {
      status: "speaking",
      currentTask: "Publishing itinerary",
      liveText: schedulerResult.liveText,
      confidence: schedulerResult.confidence
    });
    this.updateTimelineEntry(schedulerTimelineId, { status: "success" });
    this.addReasoning({
      id: this.nextId("reasoning"),
      agentId: "scheduler",
      agentEmoji: "📅",
      agentName: "Scheduler Agent",
      decision: "Locked the venue sequence and buffer windows.",
      reasoning: `Itinerary locked: ${schedulerResult.itinerary}.`,
      confidence: schedulerResult.confidence,
      alternatives: ["Tighter transition with less buffer", "Later showtime with a slower return"],
      timestamp: nowLabel()
    });
    this.addSkill({
      id: this.nextId("skill"),
      title: "Phone-over-web reservation strategy",
      description: "Escalate to a call when availability is dynamic or web inventory looks artificially constrained.",
      source: "Concierge booking flow",
      version: 1,
      usageCount: 1,
      createdAt: nowLabel(),
      agentId: "call"
    });
    this.setSummary(summary);
    await this.sendUserSms(`Concierge mission ready. ${summary.result} Saved $${negotiationResult.savings.totalSavings.toFixed(2)}. Reply CONFIRM or MODIFY.`);

    this.addAdaptation({
      id: this.nextId("adaptation"),
      message: researchResult.usedFallback
        ? "Research used a fallback source and still completed the concierge mission."
        : "Concierge mission completed with venue research, booking, and savings optimization aligned.",
      timestamp: nowLabel(),
      type: researchResult.usedFallback ? "learning" : "improving"
    });
    this.addTimelineEntry({
      id: this.nextId("timeline"),
      timestamp: nowLabel(),
      agentId: "planner",
      agentEmoji: "✅",
      agentName: "Planner Agent",
      description: "Concierge mission completed successfully.",
      status: "success"
    });
    await this.waitStep(signal, 0.5);
    this.updateAgent("scheduler", { status: "idle", currentTask: "", liveText: "", confidence: 0 });
    this.setMissionStatus("completed", mode);
  }

  async runInterrupt({ command, mode, signal }) {
    this.addTimelineEntry({
      id: this.nextId("timeline"),
      timestamp: nowLabel(),
      agentId: "planner",
      agentEmoji: "⚡",
      agentName: "Student Interrupt",
      description: command,
      status: "pending"
    });
    this.updateAgent("planner", {
      status: "thinking",
      currentTask: "Rebuilding the remaining study plan",
      liveText: `Processing interrupt: "${command}"`,
      confidence: 84
    });
    await this.waitStep(signal, 1);

    if (this.currentMissionDomain === "concierge") {
      this.broadcast("mission_replanned", {
        command,
        domain: "concierge"
      });
      this.addReasoning({
        id: this.nextId("reasoning"),
        agentId: "planner",
        agentEmoji: "🧠",
        agentName: "Planner Agent",
        decision: "Accepted the concierge override and collapsed the next step into a smaller adjustment.",
        reasoning: "Concierge missions should adapt without throwing away venue research or confirmed reservations when a new preference arrives mid-run.",
        confidence: 88,
        alternatives: ["Restart the whole outing plan", "Ignore the new constraint"],
        timestamp: nowLabel()
      });
      this.addAdaptation({
        id: this.nextId("adaptation"),
        message: `Concierge mission adapted after interrupt: ${command}`,
        timestamp: nowLabel(),
        type: "evolved"
      });
      this.updateAgent("planner", {
        status: "speaking",
        currentTask: "Publishing concierge adjustment",
        liveText: `Updated the concierge mission to honor: ${command}`,
        confidence: 91
      });
      await this.waitStep(signal, 1);
      this.updateAgent("planner", { status: "idle", currentTask: "", liveText: "", confidence: 0 });
      await this.sendUserSms(`Concierge plan updated. New constraint noted: ${command}.`);
      this.setMissionStatus("completed", mode);
      return;
    }

    const followUpTask = this.studyStore.replanMission(command);
    this.broadcast("mission_replanned", {
      command,
      task: followUpTask
    });
    this.broadcast("task_created", followUpTask);
    this.broadcast("session_scheduled", {
      missionId: followUpTask.missionId,
      title: `Recovery block • ${command}`,
      status: "planned"
    });

    this.addReasoning({
      id: this.nextId("reasoning"),
      agentId: "planner",
      agentEmoji: "🧠",
      agentName: "Planner Agent",
      decision: "Accepted the student override and rebuilt the next action instead of forcing the original path.",
      reasoning: "Study missions should preserve momentum. The fastest safe response is to collapse the next step into a smaller, more compliant task and keep the mission alive.",
      confidence: 88,
      alternatives: ["Ignore the override", "Restart the whole plan from zero"],
      timestamp: nowLabel()
    });
    this.addAdaptation({
      id: this.nextId("adaptation"),
      message: `Mission adapted after student interrupt: ${command}`,
      timestamp: nowLabel(),
      type: "evolved"
    });
    this.updateAgent("planner", {
      status: "speaking",
      currentTask: "Publishing updated next step",
      liveText: `Updated the mission to honor: ${command}`,
      confidence: 91
    });
    await this.waitStep(signal, 1);

    this.updateAgent("planner", { status: "idle", currentTask: "", liveText: "", confidence: 0 });
    await this.sendUserSms(`Plan updated. New task added: ${followUpTask.title}.`);
    this.setMissionStatus("completed", mode);
  }
}
