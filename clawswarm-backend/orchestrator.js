import { createInitialMissionState, cloneState } from "./state.js";
import { createEvent } from "./protocol.js";
import { createLlmGateway } from "./integrations/llm.js";
import { createTelnyxSmsClient } from "./integrations/telnyx-sms.js";
import { createResembleClient } from "./integrations/resemble.js";
import { createClawdtalkClient } from "./integrations/clawdtalk.js";
import { runPlannerAgent } from "./agents/planner.js";
import { runResearchAgent } from "./agents/research.js";
import { runCallerAgent } from "./agents/caller.js";
import { runNegotiatorAgent } from "./agents/negotiator.js";
import { runSchedulerAgent } from "./agents/scheduler.js";

function createAbortError() {
  return new Error("Mission run aborted");
}

function nowLabel() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  });
}

function normalizeAutonomyConstraints(constraints) {
  return {
    maxBudget: typeof constraints?.maxBudget === "number" ? constraints.maxBudget : null,
    latestTime: constraints?.latestTime || null,
    minConfidence: typeof constraints?.minConfidence === "number" ? constraints.minConfidence : null
  };
}

function isApprovalCommand(command) {
  return command === "approve" || command === "reject" || command === "modify";
}

function parseClockValue(value) {
  if (!value) {
    return null;
  }

  if (/^\d{2}:\d{2}$/.test(value)) {
    const [hours, minutes] = value.split(":").map(Number);
    return hours * 60 + minutes;
  }

  const match = value.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) {
    return null;
  }

  let hours = Number(match[1]) % 12;
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();
  if (period === "PM") {
    hours += 12;
  }

  return hours * 60 + minutes;
}

export function parseMerchantResponseText(raw) {
  const text = (raw || "").trim();
  const details = {};

  if (/^(ACCEPT|YES|CONFIRMED|OK)$/i.test(text)) {
    return { offerType: "accept", text, details };
  }

  const timeMatch = text.match(/(\d{1,2}:\d{2}\s?(?:AM|PM)?)/i);
  if (timeMatch) {
    details.time = timeMatch[1].trim();
  }

  const discountMatch = text.match(/(\d+)%\s*off/i);
  if (discountMatch) {
    details.discount = `${discountMatch[1]}%`;
  }

  const promoMatch = text.match(/\bcode\s+([A-Z0-9]+)/i);
  if (promoMatch) {
    details.promoCode = promoMatch[1];
    return { offerType: "promo", text, details };
  }

  if (/complimentary|quiet|off[\s-]?peak/i.test(text)) {
    return { offerType: "offpeak", text, details };
  }

  if (details.time || details.discount) {
    return { offerType: "counter", text, details };
  }

  return { offerType: "counter", text, details };
}

export class MissionOrchestrator {
  constructor({ config, emitEvent }) {
    this.config = config;
    this.emitEvent = emitEvent;
    this.llm = createLlmGateway(config);
    this.smsClient = createTelnyxSmsClient(config);
    this.resembleClient = createResembleClient(config);
    this.clawdtalkClient = createClawdtalkClient(config);
    this.state = createInitialMissionState();
    this.sequenceNumber = 0;
    this.merchantOfferIndex = 0;
    this.currentRunId = 0;
    this.currentController = null;
    this.currentRunPromise = null;
    this.pendingApprovalResolver = null;
    this.pendingApprovalTimer = null;
    this.pendingMerchantResolver = null;
    this.pendingMerchantTimer = null;
    this.pendingMerchantVenue = null;
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

  addMerchantOffer(offer) {
    this.state.merchantOffers.push(offer);
    this.broadcast("merchant_offer", offer);
  }

  updateMerchantOffer(id, updates) {
    this.state.merchantOffers = this.state.merchantOffers.map((o) =>
      o.id === id ? { ...o, ...updates } : o
    );
    this.broadcast("merchant_offer_update", { id, updates });
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

  setTrainingMode(enabled) {
    this.state.trainingMode = enabled;
    this.broadcast("training_mode", { enabled });
  }

  setPendingApproval(request) {
    this.state.pendingApproval = request;
    if (request) {
      this.broadcast("approval_request", request);
      return;
    }

    this.broadcast("approval_cleared", {});
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

    if (this.pendingApprovalTimer) {
      clearTimeout(this.pendingApprovalTimer);
      this.pendingApprovalTimer = null;
    }
    this.pendingApprovalResolver = null;
    if (this.pendingMerchantTimer) {
      clearTimeout(this.pendingMerchantTimer);
      this.pendingMerchantTimer = null;
    }
    this.pendingMerchantResolver = null;
    this.pendingMerchantVenue = null;
    this.merchantOfferIndex = 0;

    this.state = createInitialMissionState();
    this.currentController = null;
    this.currentRunPromise = null;

    if (broadcast) {
      this.broadcastSnapshot();
      this.setMissionStatus("idle", "live");
    }
  }

  async startMission({ missionText, mode = "live", autonomyMode = "autobook", autonomyConstraints }) {
    if (!missionText?.trim()) {
      throw new Error("missionText is required");
    }

    this.resetMission({ broadcast: false });
    this.currentRunId += 1;
    this.currentController = new AbortController();
    const signal = this.currentController.signal;
    const runId = this.currentRunId;

    this.state.userInput = missionText.trim();
    this.state.demoMode = mode === "simulation";
    this.state.autonomyMode = ["suggest", "confirm", "autobook"].includes(autonomyMode) ? autonomyMode : "autobook";
    this.state.autonomyConstraints = normalizeAutonomyConstraints(autonomyConstraints);
    this.state.pendingApproval = null;
    this.broadcastSnapshot();
    this.setMissionStatus("live", mode);

    this.currentRunPromise = this.runMission({ missionText: missionText.trim(), mode, signal })
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

    return { ok: true, mode };
  }

  async interruptMission({ command, details }) {
    if (this.state.pendingApproval && isApprovalCommand(command)) {
      const approvalRequestId = details?.approvalRequestId;
      if (approvalRequestId && approvalRequestId !== this.state.pendingApproval.id) {
        throw new Error("Approval request is no longer active");
      }

      if (command === "modify") {
        if (!this.currentController || this.state.missionStatus !== "live") {
          throw new Error("No live mission to interrupt");
        }

        const mode = this.state.demoMode ? "simulation" : "live";
        const note = details?.note?.trim() || "Modify the booking before confirming";
        this.resolvePendingApproval({ command, details });
        this.currentController.abort();
        this.currentRunId += 1;
        this.currentController = new AbortController();
        const runId = this.currentRunId;
        const signal = this.currentController.signal;

        this.currentRunPromise = this.runInterrupt({ command: note, mode, signal }).finally(() => {
          if (this.currentRunId === runId) {
            this.currentController = null;
          }
        });

        return { ok: true };
      }

      this.resolvePendingApproval({ command, details });
      return { ok: true };
    }

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

  resolvePendingApproval(resolution) {
    if (this.pendingApprovalTimer) {
      clearTimeout(this.pendingApprovalTimer);
      this.pendingApprovalTimer = null;
    }

    const resolver = this.pendingApprovalResolver;
    this.pendingApprovalResolver = null;
    if (resolver) {
      resolver(resolution);
    }
  }

  resolvePendingMerchant(response) {
    if (this.pendingMerchantTimer) {
      clearTimeout(this.pendingMerchantTimer);
      this.pendingMerchantTimer = null;
    }
    const resolver = this.pendingMerchantResolver;
    this.pendingMerchantResolver = null;
    this.pendingMerchantVenue = null;
    if (resolver) {
      resolver(response);
    }
  }

  async awaitMerchantResponse({ signal, mode, venueName, venuePhone, merchantSmsText }) {
    if (mode === "simulation") {
      return this.simulateMerchantResponse(signal, venueName);
    }

    if (!venuePhone) {
      this.addTimelineEntry({
        id: this.nextId("timeline"),
        timestamp: nowLabel(),
        agentId: "negotiation",
        agentEmoji: "⚠️",
        agentName: "Merchant",
        description: `No phone number for ${venueName} — auto-accepting.`,
        status: "success"
      });
      return { offerType: "accept", text: "Auto-accepted (no merchant phone)", details: {}, autoAccepted: true };
    }

    try {
      await this.smsClient.sendMessage({ to: venuePhone, text: merchantSmsText });
    } catch (err) {
      this.addTimelineEntry({
        id: this.nextId("timeline"),
        timestamp: nowLabel(),
        agentId: "negotiation",
        agentEmoji: "⚠️",
        agentName: "Merchant",
        description: `Failed to SMS ${venueName} — auto-accepting.`,
        status: "success"
      });
      return { offerType: "accept", text: "Auto-accepted (SMS send failed)", details: {}, autoAccepted: true };
    }

    this.addSms({
      id: this.nextId("sms"),
      from: "ClawSwarm",
      text: `To ${venueName}: ${merchantSmsText}`,
      timestamp: nowLabel(),
      direction: "sent"
    });

    return new Promise((resolve, reject) => {
      const cleanup = () => {
        if (this.pendingMerchantTimer) {
          clearTimeout(this.pendingMerchantTimer);
          this.pendingMerchantTimer = null;
        }
        this.pendingMerchantResolver = null;
        this.pendingMerchantVenue = null;
        signal.removeEventListener("abort", onAbort);
      };

      const finish = (result) => {
        cleanup();
        resolve(result);
      };

      const onAbort = () => {
        cleanup();
        reject(createAbortError());
      };

      this.pendingMerchantResolver = finish;
      this.pendingMerchantVenue = venueName;
      signal.addEventListener("abort", onAbort, { once: true });

      this.pendingMerchantTimer = setTimeout(() => {
        this.addTimelineEntry({
          id: this.nextId("timeline"),
          timestamp: nowLabel(),
          agentId: "negotiation",
          agentEmoji: "⏱️",
          agentName: "Merchant",
          description: `${venueName} did not respond — auto-accepting.`,
          status: "success"
        });
        finish({
          offerType: "accept",
          text: "Auto-accepted after timeout",
          details: {},
          autoAccepted: true
        });
      }, this.config.merchantResponseTimeoutMs ?? 30000);
    });
  }

  async awaitApprovalDecision({ signal, mode, approvalRequest, smsText, autoApproveInSimulation = false }) {
    this.setPendingApproval(approvalRequest);
    if (smsText) {
      await this.sendUserSms(smsText);
    }

    return new Promise((resolve, reject) => {
      const cleanup = () => {
        if (this.pendingApprovalTimer) {
          clearTimeout(this.pendingApprovalTimer);
          this.pendingApprovalTimer = null;
        }
        this.pendingApprovalResolver = null;
        signal.removeEventListener("abort", onAbort);
      };

      const finish = (result) => {
        cleanup();
        this.setPendingApproval(null);
        resolve(result);
      };

      const onAbort = () => {
        cleanup();
        reject(createAbortError());
      };

      this.pendingApprovalResolver = finish;
      signal.addEventListener("abort", onAbort, { once: true });

      if (mode === "simulation" && autoApproveInSimulation) {
        this.pendingApprovalTimer = setTimeout(() => {
          finish({
            command: "approve",
            details: {
              approvalRequestId: approvalRequest.id,
              autoApproved: true
            }
          });
        }, this.config.autoApprovalDelayMs ?? 3000);
      }
    });
  }

  evaluateAutonomyGate({ time, estimatedTotalCost, confidence }) {
    const reasons = [];
    const { maxBudget, latestTime, minConfidence } = this.state.autonomyConstraints;

    if (maxBudget !== null && estimatedTotalCost > maxBudget) {
      reasons.push(`budget cap ${maxBudget}`);
    }

    const latestMinutes = parseClockValue(latestTime);
    const bookingMinutes = parseClockValue(time);
    if (latestMinutes !== null && bookingMinutes !== null && bookingMinutes > latestMinutes) {
      reasons.push(`latest time ${latestTime}`);
    }

    if (minConfidence !== null && confidence < minConfidence) {
      reasons.push(`confidence threshold ${minConfidence}%`);
    }

    return {
      allowed: reasons.length === 0,
      reasons
    };
  }

  async handleInboundSms(message) {
    const sms = {
      id: this.nextId("sms"),
      from: message.from || "User",
      text: message.text,
      timestamp: nowLabel(),
      direction: "received"
    };

    this.addSms(sms);

    if (this.state.pendingApproval && message.command === "CONFIRM") {
      this.addTimelineEntry({
        id: this.nextId("timeline"),
        timestamp: nowLabel(),
        agentId: "scheduler",
        agentEmoji: "✅",
        agentName: "User",
        description: "User approved the pending booking by SMS.",
        status: "success"
      });
      this.resolvePendingApproval({
        command: "approve",
        details: {
          approvalRequestId: this.state.pendingApproval.id,
          via: "sms"
        }
      });
      return;
    }

    if (this.state.pendingApproval && message.command === "MODIFY") {
      this.addTimelineEntry({
        id: this.nextId("timeline"),
        timestamp: nowLabel(),
        agentId: "planner",
        agentEmoji: "📝",
        agentName: "User",
        description: "User asked to modify the pending booking by SMS.",
        status: "pending"
      });
      await this.interruptMission({
        command: "modify",
        details: {
          approvalRequestId: this.state.pendingApproval.id,
          note: "User requested changes by SMS",
          via: "sms"
        }
      });
      return;
    }

    if (message.command === "CONFIRM") {
      this.addTimelineEntry({
        id: this.nextId("timeline"),
        timestamp: nowLabel(),
        agentId: "scheduler",
        agentEmoji: "✅",
        agentName: "User",
        description: "User confirmed the itinerary by SMS.",
        status: "success"
      });
    }

    if (message.command === "MODIFY") {
      this.addTimelineEntry({
        id: this.nextId("timeline"),
        timestamp: nowLabel(),
        agentId: "planner",
        agentEmoji: "📝",
        agentName: "User",
        description: "User requested itinerary modifications by SMS.",
        status: "pending"
      });
    }
  }

  async sendUserSms(text) {
    const sms = {
      id: this.nextId("sms"),
      from: "ClawSwarm",
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

  async runMission({ missionText, mode, signal }) {
    this.addMemory({
      id: this.nextId("memory"),
      agentId: "planner",
      type: "preference",
      label: "Mission request",
      value: missionText,
      timestamp: "captured"
    });
    this.addMemory({
      id: this.nextId("memory"),
      agentId: "planner",
      type: "context",
      label: "Autonomy mode",
      value: this.state.autonomyMode,
      timestamp: "captured"
    });

    this.updateAgent("planner", {
      status: "thinking",
      currentTask: "Decomposing mission",
      liveText: "Analyzing mission requirements.",
      confidence: 75
    });
    const plannerTimelineId = this.nextId("timeline");
    this.addTimelineEntry({
      id: plannerTimelineId,
      timestamp: nowLabel(),
      agentId: "planner",
      agentEmoji: "🧠",
      agentName: "Planner Agent",
      description: `Analyzing mission: ${missionText}`,
      status: "pending"
    });
    await this.waitStep(signal, 1);

    const plannerResult = await runPlannerAgent({ missionText, llm: this.llm });
    this.updateAgent("planner", {
      status: "speaking",
      currentTask: "Broadcasting plan",
      liveText: plannerResult.liveText,
      confidence: plannerResult.confidence
    });
    this.updateTimelineEntry(plannerTimelineId, { status: "success" });
    this.addReasoning({
      id: this.nextId("reasoning"),
      agentId: "planner",
      agentEmoji: "🧠",
      agentName: "Planner Agent",
      decision: "Mission decomposed into research, calls, optimization, and scheduling.",
      reasoning: plannerResult.reasoning,
      confidence: plannerResult.confidence,
      alternatives: ["Keep the mission manual", "Research only and stop before bookings"],
      sources: [{ label: "Mission Input", type: "web", freshness: "live", verified: true }],
      timestamp: nowLabel()
    });
    await this.waitStep(signal, 1);

    this.updateAgent("planner", { status: "idle", currentTask: "", liveText: "", confidence: 0 });
    this.updateAgent("research", {
      status: "listening",
      listeningTo: "planner",
      currentTask: "Receiving plan",
      liveText: "",
      confidence: 0
    });
    await this.waitStep(signal, 0.5);

    this.updateAgent("research", {
      status: "thinking",
      listeningTo: null,
      currentTask: "Finding dinner and movie options",
      liveText: "Scanning trusted venue options.",
      confidence: 61
    });
    const researchTimelineId = this.nextId("timeline");
    this.addTimelineEntry({
      id: researchTimelineId,
      timestamp: nowLabel(),
      agentId: "research",
      agentEmoji: "🔍",
      agentName: "Research Agent",
      description: "Searching restaurants and cinema listings.",
      status: "pending"
    });
    await this.waitStep(signal, 1);

    const researchResult = await runResearchAgent({ missionText, llm: this.llm });
    if (researchResult.usedFallback) {
      this.addAdaptation({
        id: this.nextId("adaptation"),
        message: "Fallback venue data activated for deterministic demo reliability.",
        timestamp: nowLabel(),
        type: "learning"
      });
      this.addSkill({
        id: this.nextId("skill"),
        title: "Seeded venue fallback",
        description: "Use deterministic venue fixtures whenever live lookup is unavailable.",
        source: "Research fallback",
        version: 1,
        usageCount: 1,
        createdAt: nowLabel(),
        agentId: "research"
      });
    }
    this.updateAgent("research", {
      status: "speaking",
      liveText: researchResult.liveText,
      confidence: researchResult.confidence
    });
    this.updateTimelineEntry(researchTimelineId, { status: "success" });
    this.addReasoning({
      id: this.nextId("reasoning"),
      agentId: "research",
      agentEmoji: "🔍",
      agentName: "Research Agent",
      decision: `Selected ${researchResult.restaurant.name} and ${researchResult.cinema.name}.`,
      reasoning: researchResult.reasoning,
      confidence: researchResult.confidence,
      alternatives: ["Shift to a later movie", "Choose a cheaper but lower-rated restaurant"],
      sources: researchResult.sources,
      timestamp: nowLabel()
    });
    this.addMemory({
      id: this.nextId("memory"),
      agentId: "research",
      type: "context",
      label: "Research shortlist",
      value: `${researchResult.restaurant.name} at ${researchResult.restaurant.reservationTime}; ${researchResult.cinema.movieTitle} at ${researchResult.cinema.showtime}`,
      timestamp: nowLabel()
    });
    await this.waitStep(signal, 1);

    if (this.state.autonomyMode === "suggest") {
      this.updateAgent("research", { status: "idle", currentTask: "", liveText: "", confidence: 0 });
      this.addTimelineEntry({
        id: this.nextId("timeline"),
        timestamp: nowLabel(),
        agentId: "planner",
        agentEmoji: "💡",
        agentName: "Planner Agent",
        description: `Suggest Only mode: recommend ${researchResult.restaurant.name} at ${researchResult.restaurant.reservationTime} and ${researchResult.cinema.movieTitle} at ${researchResult.cinema.showtime}.`,
        status: "success"
      });
      this.addReasoning({
        id: this.nextId("reasoning"),
        agentId: "planner",
        agentEmoji: "🧠",
        agentName: "Planner Agent",
        decision: "Stopped before any calls because Suggest Only mode forbids autonomous outreach.",
        reasoning: "The user selected recommendation-only autonomy, so the system should surface the strongest plan without contacting any venue.",
        confidence: 94,
        alternatives: ["Place the calls and ask for approval", "Auto-book within constraints"],
        sources: [{ label: "Autonomy Config", type: "cache", freshness: "live", verified: true }],
        timestamp: nowLabel()
      });
      this.setSummary({
        visible: true,
        result: `Recommended ${researchResult.restaurant.name} for ${researchResult.restaurant.reservationTime} and ${researchResult.cinema.movieTitle} at ${researchResult.cinema.showtime}. No calls were placed because Suggest Only mode was active.`,
        costBreakdown: [
          { label: "Dinner estimate", amount: "$85.00" },
          { label: "Movie estimate", amount: "$33.75" },
          { label: "Projected total", amount: "$118.75" }
        ],
        timeTaken: "under 15 seconds"
      });
      this.setMissionStatus("completed", mode);
      return;
    }

    this.updateAgent("research", { status: "idle", currentTask: "", liveText: "", confidence: 0 });
    this.updateAgent("call", {
      status: "listening",
      listeningTo: "research",
      currentTask: "Receiving venue shortlist",
      liveText: "",
      confidence: 0
    });
    await this.waitStep(signal, 0.5);

    const dinnerBooked = await this.handleCallSequence({
      signal,
      mode,
      targetName: researchResult.restaurant.name,
      targetPhone: researchResult.restaurant.phone,
      reservationLine: `Hi, I need a dinner reservation for two at ${researchResult.restaurant.reservationTime}.`,
      description: `Calling ${researchResult.restaurant.name} for a reservation`,
      successDescription: `Dinner booked at ${researchResult.restaurant.name} for ${researchResult.restaurant.reservationTime}`,
      memoryLabel: "Dinner booking",
      memoryValue: `${researchResult.restaurant.name} confirmed for ${researchResult.restaurant.reservationTime}`,
      bookingAction: "book_restaurant",
      bookingDetails: {
        venue: researchResult.restaurant.name,
        time: researchResult.restaurant.reservationTime,
        partySize: 2,
        estimatedCost: "$85 total",
        confidence: 87
      },
      estimatedTotalCost: 85
    });

    if (!dinnerBooked) {
      this.setSummary({
        visible: true,
        result: `Recommendation ready, but the dinner booking was not finalized. ${researchResult.restaurant.name} at ${researchResult.restaurant.reservationTime} remains the best option for manual follow-up.`,
        costBreakdown: [
          { label: "Dinner estimate", amount: "$85.00" },
          { label: "Movie estimate", amount: "$33.75" }
        ],
        timeTaken: "under 25 seconds"
      });
      this.setMissionStatus("completed", mode);
      return;
    }

    await this.sendUserSms(`Booked dinner at ${researchResult.restaurant.name} for ${researchResult.restaurant.reservationTime}. Calling the cinema next.`);

    const movieBooked = await this.handleCallSequence({
      signal,
      mode,
      targetName: researchResult.cinema.name,
      targetPhone: researchResult.cinema.phone,
      reservationLine: `Hello, I want two ${researchResult.cinema.seatType} seats for ${researchResult.cinema.movieTitle} at ${researchResult.cinema.showtime}.`,
      description: `Calling ${researchResult.cinema.name} for movie seats`,
      successDescription: `Movie seats secured for ${researchResult.cinema.movieTitle} at ${researchResult.cinema.showtime}`,
      memoryLabel: "Movie booking",
      memoryValue: `${researchResult.cinema.movieTitle} at ${researchResult.cinema.showtime} with ${researchResult.cinema.seatType} seats`,
      bookingAction: "book_cinema",
      bookingDetails: {
        venue: researchResult.cinema.name,
        time: researchResult.cinema.showtime,
        partySize: 2,
        estimatedCost: "$33.75 total",
        confidence: 91
      },
      estimatedTotalCost: 33.75
    });

    if (!movieBooked) {
      this.setSummary({
        visible: true,
        result: `Dinner is secured at ${researchResult.restaurant.name}, but the movie booking still needs confirmation. ${researchResult.cinema.movieTitle} at ${researchResult.cinema.showtime} remains the recommended show.`,
        costBreakdown: [
          { label: "Dinner", amount: "$85.00" },
          { label: "Movie estimate", amount: "$33.75" }
        ],
        timeTaken: "under 30 seconds"
      });
      this.setMissionStatus("completed", mode);
      return;
    }

    this.updateAgent("negotiation", {
      status: "listening",
      listeningTo: "call",
      currentTask: "Reviewing booking costs",
      liveText: "",
      confidence: 0
    });
    await this.waitStep(signal, 0.5);

    this.updateAgent("negotiation", {
      status: "thinking",
      listeningTo: null,
      currentTask: "Optimizing total cost",
      liveText: "Checking stackable offers and discounts.",
      confidence: 74
    });
    const negotiationTimelineId = this.nextId("timeline");
    this.addTimelineEntry({
      id: negotiationTimelineId,
      timestamp: nowLabel(),
      agentId: "negotiation",
      agentEmoji: "💰",
      agentName: "Negotiation Agent",
      description: "Comparing available discounts.",
      status: "pending"
    });
    await this.waitStep(signal, 1);

    const negotiationResult = await runNegotiatorAgent({ researchResult, llm: this.llm });
    this.updateAgent("negotiation", {
      status: "speaking",
      liveText: negotiationResult.liveText,
      confidence: negotiationResult.confidence
    });
    this.updateTimelineEntry(negotiationTimelineId, { status: "success" });
    this.addReasoning({
      id: this.nextId("reasoning"),
      agentId: "negotiation",
      agentEmoji: "💰",
      agentName: "Negotiation Agent",
      decision: "Applied the best available dinner and cinema discounts.",
      reasoning: negotiationResult.reasoning,
      confidence: negotiationResult.confidence,
      alternatives: ["Keep full-price booking", "Move to a cheaper but worse-timed show"],
      sources: [{ label: "Discount DB", type: "cache", freshness: "cached", verified: false }],
      timestamp: nowLabel()
    });
    await this.waitStep(signal, 1);

    this.updateAgent("negotiation", { status: "idle", currentTask: "", liveText: "", confidence: 0 });
    this.updateAgent("scheduler", {
      status: "listening",
      listeningTo: "negotiation",
      currentTask: "Preparing final itinerary",
      liveText: "",
      confidence: 0
    });
    await this.waitStep(signal, 0.5);

    this.updateAgent("scheduler", {
      status: "thinking",
      listeningTo: null,
      currentTask: "Building itinerary",
      liveText: "Sequencing dinner, transit, and showtime.",
      confidence: 82
    });
    const schedulerTimelineId = this.nextId("timeline");
    this.addTimelineEntry({
      id: schedulerTimelineId,
      timestamp: nowLabel(),
      agentId: "scheduler",
      agentEmoji: "📅",
      agentName: "Scheduler Agent",
      description: "Building final itinerary.",
      status: "pending"
    });
    await this.waitStep(signal, 1);

    const schedulerResult = await runSchedulerAgent({
      researchResult,
      negotiationResult,
      llm: this.llm
    });
    this.updateAgent("scheduler", {
      status: "speaking",
      liveText: schedulerResult.liveText,
      confidence: schedulerResult.confidence
    });
    this.updateTimelineEntry(schedulerTimelineId, { status: "success" });
    this.addReasoning({
      id: this.nextId("reasoning"),
      agentId: "scheduler",
      agentEmoji: "📅",
      agentName: "Scheduler Agent",
      decision: "Final itinerary aligned dinner timing with the best movie slot.",
      reasoning: "The dinner ends with a comfortable travel buffer before the selected showtime, preserving seat quality and discount coverage.",
      confidence: schedulerResult.confidence,
      alternatives: ["Later dinner and later show", "Movie first, dinner second"],
      sources: [{ label: "Itinerary Engine", type: "api", freshness: "live", verified: true }],
      timestamp: nowLabel()
    });
    this.setSummary(schedulerResult.summary);
    this.addTimelineEntry({
      id: this.nextId("timeline"),
      timestamp: nowLabel(),
      agentId: "planner",
      agentEmoji: "✅",
      agentName: "Planner Agent",
      description: "Mission completed successfully.",
      status: "success"
    });
    await this.sendUserSms(`Mission complete. Dinner at ${researchResult.restaurant.name} ${researchResult.restaurant.reservationTime}, then ${researchResult.cinema.movieTitle} at ${researchResult.cinema.showtime}. Reply CONFIRM or MODIFY.`);

    this.addAdaptation({
      id: this.nextId("adaptation"),
      message: "Mission finished. Training mode is evaluating the execution trace.",
      timestamp: nowLabel(),
      type: "improving"
    });
    this.setTrainingMode(true);
    await this.waitStep(signal, 0.5);
    this.setTrainingMode(false);
    this.updateAgent("scheduler", { status: "idle", currentTask: "", liveText: "", confidence: 0 });
    this.setMissionStatus("completed", mode);
  }

  async handleCallSequence({
    signal,
    mode,
    targetName,
    targetPhone,
    reservationLine,
    description,
    successDescription,
    memoryLabel,
    memoryValue,
    bookingAction,
    bookingDetails,
    estimatedTotalCost
  }) {
    this.updateAgent("call", {
      status: "calling",
      listeningTo: null,
      currentTask: description,
      liveText: `Dialing ${targetName}.`,
      confidence: 79
    });
    const timelineId = this.nextId("timeline");
    this.addTimelineEntry({
      id: timelineId,
      timestamp: nowLabel(),
      agentId: "call",
      agentEmoji: "📞",
      agentName: "Call Agent",
      description,
      status: "pending"
    });

    this.setCall({
      active: true,
      caller: "Call Agent",
      receiver: targetName,
      duration: 0,
      transcript: [],
      status: "ringing"
    });
    await this.waitStep(signal, 1);

    const callResult = await runCallerAgent({
      businessName: targetName,
      businessPhone: targetPhone,
      reservationLine,
      mode,
      clawdtalk: this.clawdtalkClient,
      resemble: this.resembleClient,
      missionVoiceName: this.config.missionVoiceName
    });

    this.setCall({
      active: true,
      caller: "Call Agent",
      receiver: targetName,
      duration: 3,
      transcript: [],
      status: "connected"
    });
    this.updateAgent("call", {
      status: "speaking",
      currentTask: description,
      liveText: `Connected to ${targetName}.`,
      confidence: 87
    });

    for (const [index, line] of callResult.transcript.entries()) {
      await this.waitStep(signal, 0.5);
      this.addCallTranscript(line.speaker, line.text);
      this.setCall({
        ...this.state.call,
        active: true,
        caller: "Call Agent",
        receiver: targetName,
        duration: 4 + index,
        status: "connected"
      });
    }

    this.setCall({
      active: true,
      caller: "Call Agent",
      receiver: targetName,
      duration: callResult.transcript.length + 4,
      transcript: [],
      status: "ended"
    });

    // --- Merchant response flow ---
    const merchantSmsText = `ClawSwarm booking request: ${reservationLine} Reply ACCEPT or counter-offer.`;
    if (mode === "simulation") {
      this.addSms({
        id: this.nextId("sms"),
        from: "ClawSwarm",
        text: `To ${targetName}: ${merchantSmsText}`,
        timestamp: nowLabel(),
        direction: "sent"
      });
    }
    const merchantResponse = await this.awaitMerchantResponse({
      signal, mode, venueName: targetName, venuePhone: targetPhone, merchantSmsText
    });

    const merchantOffer = {
      id: this.nextId("merchant-offer"),
      venueName: targetName,
      offerType: merchantResponse.offerType,
      originalRequest: reservationLine,
      merchantResponse: merchantResponse.text,
      details: merchantResponse.details || {},
      status: "pending",
      timestamp: nowLabel()
    };
    this.addMerchantOffer(merchantOffer);

    this.addTimelineEntry({
      id: this.nextId("timeline"),
      timestamp: nowLabel(),
      agentId: "negotiation",
      agentEmoji: "🏪",
      agentName: "Merchant",
      description: `${targetName} responded: ${merchantResponse.text}`,
      status: merchantResponse.offerType === "accept" ? "success" : "pending"
    });

    let shouldFinalizeBooking = true;

    if (merchantResponse.offerType !== "accept") {
      this.updateAgent("negotiation", {
        status: "thinking",
        listeningTo: null,
        currentTask: `Evaluating ${targetName}'s counter-offer`,
        liveText: `Reviewing merchant response: ${merchantResponse.text}`,
        confidence: 70
      });
      await this.waitStep(signal, 0.5);

      const negotiationResult = await runNegotiatorAgent({
        researchResult: null,
        llm: this.llm,
        merchantOffer
      });

      this.updateAgent("negotiation", {
        status: "speaking",
        liveText: negotiationResult.liveText,
        confidence: negotiationResult.confidence
      });

      this.addReasoning({
        id: this.nextId("reasoning"),
        agentId: "negotiation",
        agentEmoji: "💰",
        agentName: "Negotiation Agent",
        decision: `${negotiationResult.action === "accept" ? "Accepted" : negotiationResult.action === "reject" ? "Rejected" : "Countered"} ${targetName}'s offer.`,
        reasoning: negotiationResult.reasoning,
        confidence: negotiationResult.confidence,
        alternatives: ["Accept original terms", "Reject and try another venue"],
        sources: [{ label: "Merchant SMS", type: "sms", freshness: "live", verified: true }],
        timestamp: nowLabel()
      });

      this.updateMerchantOffer(merchantOffer.id, { status: negotiationResult.action === "accept" ? "accepted" : negotiationResult.action === "reject" ? "rejected" : "countered" });

      if (negotiationResult.action === "reject") {
        shouldFinalizeBooking = false;
      }

      await this.waitStep(signal, 0.5);
      this.updateAgent("negotiation", { status: "idle", currentTask: "", liveText: "", confidence: 0 });
    } else {
      this.updateMerchantOffer(merchantOffer.id, { status: "accepted" });
    }

    if (this.state.autonomyMode === "confirm") {
      this.addTimelineEntry({
        id: this.nextId("timeline"),
        timestamp: nowLabel(),
        agentId: "call",
        agentEmoji: "⏸️",
        agentName: "Call Agent",
        description: `Awaiting approval to finalize ${targetName}.`,
        status: "pending"
      });
      const approvalDecision = await this.awaitApprovalDecision({
        signal,
        mode,
        approvalRequest: {
          id: this.nextId("approval"),
          agentId: "call",
          action: bookingAction,
          details: bookingDetails
        },
        smsText: `Approval needed: finalize ${targetName} at ${bookingDetails.time}? Reply CONFIRM or MODIFY.`,
        autoApproveInSimulation: true
      });

      if (approvalDecision.command === "modify") {
        this.ensureActiveRun(signal);
        return false;
      }

      if (approvalDecision.command === "reject") {
        shouldFinalizeBooking = false;
      } else if (approvalDecision.details?.autoApproved) {
        this.addTimelineEntry({
          id: this.nextId("timeline"),
          timestamp: nowLabel(),
          agentId: "call",
          agentEmoji: "✅",
          agentName: "Call Agent",
          description: `Auto-approved ${targetName} after no manual response in demo mode.`,
          status: "success"
        });
      }
    } else if (this.state.autonomyMode === "autobook") {
      const gate = this.evaluateAutonomyGate({
        time: bookingDetails.time,
        estimatedTotalCost,
        confidence: bookingDetails.confidence
      });

      if (gate.allowed) {
        this.addTimelineEntry({
          id: this.nextId("timeline"),
          timestamp: nowLabel(),
          agentId: "call",
          agentEmoji: "⚡",
          agentName: "Call Agent",
          description: `Auto-approved within autonomy constraints for ${targetName}.`,
          status: "success"
        });
      } else {
        this.addTimelineEntry({
          id: this.nextId("timeline"),
          timestamp: nowLabel(),
          agentId: "planner",
          agentEmoji: "🛡️",
          agentName: "Planner Agent",
          description: `Auto-Book constraint triggered manual confirmation: ${gate.reasons.join(", ")}.`,
          status: "fallback"
        });

        const approvalDecision = await this.awaitApprovalDecision({
          signal,
          mode,
          approvalRequest: {
            id: this.nextId("approval"),
            agentId: "call",
            action: bookingAction,
            details: bookingDetails
          },
          smsText: `Constraint check paused ${targetName}. Confirm ${bookingDetails.time} manually by SMS or dashboard.`,
          autoApproveInSimulation: true
        });

        if (approvalDecision.command === "modify") {
          this.ensureActiveRun(signal);
          return false;
        }

        if (approvalDecision.command === "reject") {
          shouldFinalizeBooking = false;
        }
      }
    }

    if (!shouldFinalizeBooking) {
      this.updateAgent("call", {
        status: "idle",
        currentTask: "",
        liveText: "",
        confidence: 0
      });
      this.updateTimelineEntry(timelineId, {
        status: "fallback",
        description: `Booking skipped for ${targetName} after user rejection.`
      });
      this.addTimelineEntry({
        id: this.nextId("timeline"),
        timestamp: nowLabel(),
        agentId: "planner",
        agentEmoji: "↪️",
        agentName: "Planner Agent",
        description: `Skipped ${targetName} and returned control to the user.`,
        status: "fallback"
      });
      return false;
    }

    this.updateAgent("call", {
      status: "idle",
      currentTask: "",
      liveText: "",
      confidence: 0
    });
    this.updateTimelineEntry(timelineId, { status: "success", description: successDescription });
    this.addMemory({
      id: this.nextId("memory"),
      agentId: "call",
      type: "decision",
      label: memoryLabel,
      value: memoryValue,
      timestamp: nowLabel()
    });
    return true;
  }

  async simulateMerchantResponse(signal, venueName) {
    await this.waitStep(signal, 1);
    const responses = [
      { offerType: "accept", text: "Confirmed! Table for two is reserved.", details: {} },
      { offerType: "counter", text: "That slot is full. We can do 8:00 PM instead at 10% off.", details: { time: "8:00 PM", discount: "10%" } },
      { offerType: "offpeak", text: "Quiet table at 6:15 PM with complimentary appetizer.", details: { time: "6:15 PM", note: "Complimentary appetizer included" } },
      { offerType: "promo", text: "Tonight's special: 25% off prix fixe, code CLAWVIP.", details: { discount: "25%", promoCode: "CLAWVIP" } }
    ];
    const index = this.merchantOfferIndex;
    this.merchantOfferIndex = (this.merchantOfferIndex + 1) % 4;
    return responses[index];
  }

  async handleInboundMerchantSms(message) {
    const parsed = parseMerchantResponseText(message.text);

    this.addSms({
      id: this.nextId("sms"),
      from: message.from || "Merchant",
      text: message.text,
      timestamp: nowLabel(),
      direction: "received"
    });

    const sender = message.from || "Merchant";
    if (this.pendingMerchantResolver && (!this.pendingMerchantVenue || this.pendingMerchantVenue === sender)) {
      this.addTimelineEntry({
        id: this.nextId("timeline"),
        timestamp: nowLabel(),
        agentId: "negotiation",
        agentEmoji: "🏪",
        agentName: "Merchant",
        description: `${this.pendingMerchantVenue || sender} replied: ${message.text}`,
        status: parsed.offerType === "accept" ? "success" : "pending"
      });
      this.resolvePendingMerchant(parsed);
      return;
    }

    const offer = {
      id: this.nextId("merchant-offer"),
      venueName: message.from || "Merchant",
      offerType: parsed.offerType,
      originalRequest: "Booking request",
      merchantResponse: message.text,
      details: parsed.details,
      status: "pending",
      timestamp: nowLabel()
    };
    this.addMerchantOffer(offer);
  }

  async runInterrupt({ command, mode, signal }) {
    this.addTimelineEntry({
      id: this.nextId("timeline"),
      timestamp: nowLabel(),
      agentId: "planner",
      agentEmoji: "⚡",
      agentName: "User Interrupt",
      description: command,
      status: "pending"
    });
    this.updateAgent("planner", {
      status: "thinking",
      currentTask: "Re-planning mission",
      liveText: `Processing interrupt: "${command}"`,
      confidence: 82
    });
    await this.waitStep(signal, 1);

    this.addReasoning({
      id: this.nextId("reasoning"),
      agentId: "planner",
      agentEmoji: "🧠",
      agentName: "Planner Agent",
      decision: "Accepted the user interrupt and rebuilt the remaining mission.",
      reasoning: "The user override takes precedence over the prior optimization path, so the fastest safe response is to re-plan the remaining booking steps.",
      confidence: 87,
      alternatives: ["Ignore the change request", "Queue it after the current booking"],
      sources: [{ label: "User Override", type: "web", freshness: "live", verified: true }],
      timestamp: nowLabel()
    });
    this.addAdaptation({
      id: this.nextId("adaptation"),
      message: `Mission adapted after user interrupt: ${command}`,
      timestamp: nowLabel(),
      type: "evolved"
    });
    this.updateAgent("planner", {
      status: "speaking",
      currentTask: "Publishing updated plan",
      liveText: `Replanned mission to honor: ${command}`,
      confidence: 90
    });
    await this.waitStep(signal, 1);

    this.updateAgent("planner", { status: "idle", currentTask: "", liveText: "", confidence: 0 });
    await this.sendUserSms(`Plan updated. Your request "${command}" has been folded into the live mission.`);
    this.setMissionStatus("completed", mode);
  }
}
