import test from "node:test";
import assert from "node:assert/strict";
import { MissionOrchestrator } from "../orchestrator.js";

function createTestConfig() {
  return {
    simulationDelayMs: 0,
    autoApprovalDelayMs: 5,
    telnyxApiKey: "",
    telnyxPhoneNumber: "",
    resembleApiKey: "",
    resembleProjectId: "",
    openAiApiKey: "",
    openAiModel: "gpt-4o-mini",
    anthropicApiKey: "",
    anthropicModel: "claude-3-5-sonnet-latest",
    clawdtalkWsUrl: "",
    userPhoneNumber: "",
    missionVoiceName: "Test Voice"
  };
}

async function waitFor(check, timeoutMs = 500, intervalMs = 5) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = check();
    if (value) {
      return value;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error("Timed out waiting for condition");
}

test("simulation mission emits summary and sms events", async () => {
  const events = [];
  const orchestrator = new MissionOrchestrator({
    config: createTestConfig(),
    emitEvent: (event) => events.push(event)
  });

  await orchestrator.startMission({
    missionText: "Plan a dinner and movie night",
    mode: "simulation"
  });
  await orchestrator.waitForCurrentRun();

  assert.ok(events.some((event) => event.type === "mission_status" && event.payload.status === "live"));
  assert.ok(events.some((event) => event.type === "summary"));
  assert.ok(events.some((event) => event.type === "sms"));
  assert.equal(orchestrator.getState().missionStatus, "completed");
});

test("suggest mode completes without any call activity", async () => {
  const events = [];
  const orchestrator = new MissionOrchestrator({
    config: createTestConfig(),
    emitEvent: (event) => events.push(event)
  });

  await orchestrator.startMission({
    missionText: "Plan a dinner and movie night",
    mode: "simulation",
    autonomyMode: "suggest"
  });
  await orchestrator.waitForCurrentRun();

  assert.equal(orchestrator.getState().autonomyMode, "suggest");
  assert.equal(orchestrator.getState().call.active, false);
  assert.ok(!events.some((event) => event.type === "call_update" && event.payload.status === "ringing"));
  assert.ok(events.some((event) => event.type === "summary"));
});

test("confirm mode emits approval request and auto-approves in simulation", async () => {
  const events = [];
  const orchestrator = new MissionOrchestrator({
    config: createTestConfig(),
    emitEvent: (event) => events.push(event)
  });

  await orchestrator.startMission({
    missionText: "Plan a dinner and movie night",
    mode: "simulation",
    autonomyMode: "confirm"
  });
  await orchestrator.waitForCurrentRun();

  assert.ok(events.some((event) => event.type === "approval_request"));
  assert.ok(events.some((event) => event.type === "approval_cleared"));
  assert.ok(events.some((event) => event.type === "timeline_entry" && event.payload.description.includes("Auto-approved")));
});

test("interrupting a live mission publishes adaptation events", async () => {
  const events = [];
  const orchestrator = new MissionOrchestrator({
    config: { ...createTestConfig(), simulationDelayMs: 5 },
    emitEvent: (event) => events.push(event)
  });

  await orchestrator.startMission({
    missionText: "Plan a dinner and movie night",
    mode: "simulation"
  });

  await orchestrator.interruptMission({ command: "Make it cheaper" });
  await orchestrator.waitForCurrentRun();

  assert.ok(events.some((event) => event.type === "adaptation"));
  assert.ok(events.some((event) => event.type === "sms" && event.payload.text.includes("Plan updated")));
});

test("autobook falls back to approval when constraints fail", async () => {
  const events = [];
  const orchestrator = new MissionOrchestrator({
    config: createTestConfig(),
    emitEvent: (event) => events.push(event)
  });

  await orchestrator.startMission({
    missionText: "Plan a dinner and movie night",
    mode: "simulation",
    autonomyMode: "autobook",
    autonomyConstraints: {
      maxBudget: 20,
      latestTime: "22:00",
      minConfidence: 80
    }
  });
  await orchestrator.waitForCurrentRun();

  assert.ok(events.some((event) => event.type === "timeline_entry" && event.payload.description.includes("constraint")));
  assert.ok(events.some((event) => event.type === "approval_request"));
});

test("stale approval request ids are rejected", async () => {
  const orchestrator = new MissionOrchestrator({
    config: createTestConfig(),
    emitEvent: () => {}
  });

  orchestrator.state.pendingApproval = {
    id: "approval-1",
    agentId: "call",
    action: "book_restaurant",
    details: {
      venue: "Bella Notte",
      time: "7:30 PM",
      partySize: 2,
      estimatedCost: "$85 total",
      confidence: 87
    }
  };

  await assert.rejects(
    () =>
      orchestrator.interruptMission({
        command: "approve",
        details: {
          approvalRequestId: "wrong-id"
        }
      }),
    /Approval request is no longer active/
  );
});

test("merchant accept plus user reject remains rejected_by_user", async () => {
  const orchestrator = new MissionOrchestrator({
    config: { ...createTestConfig(), simulationDelayMs: 2, autoApprovalDelayMs: 1000 },
    emitEvent: () => {}
  });

  await orchestrator.startMission({
    missionText: "Plan a dinner and movie night",
    mode: "simulation",
    autonomyMode: "confirm"
  });

  const pendingApproval = await waitFor(() => orchestrator.getState().pendingApproval);
  await orchestrator.interruptMission({
    command: "reject",
    details: {
      approvalRequestId: pendingApproval.id
    }
  });
  await orchestrator.waitForCurrentRun();

  const firstOffer = orchestrator.getState().merchantOffers[0];
  assert.equal(firstOffer.merchantOutcome, "accept");
  assert.equal(firstOffer.negotiatorDecision, "accept");
  assert.equal(firstOffer.finalResolution, "rejected_by_user");
  assert.equal(firstOffer.finalized, false);
});

test("itinerary confirmation can be acknowledged after mission completion", async () => {
  const orchestrator = new MissionOrchestrator({
    config: createTestConfig(),
    emitEvent: () => {}
  });

  await orchestrator.startMission({
    missionText: "Plan a dinner and movie night",
    mode: "simulation"
  });
  await orchestrator.waitForCurrentRun();

  assert.ok(orchestrator.getState().pendingItineraryConfirmation);

  await orchestrator.handleInboundSms({
    from: "+15550001111",
    text: "CONFIRM",
    command: "CONFIRM"
  });

  assert.equal(orchestrator.getState().pendingItineraryConfirmation, null);
});

test("waitStep rejects on pre-aborted signal", async () => {
  const orchestrator = new MissionOrchestrator({
    config: { ...createTestConfig(), simulationDelayMs: 100 },
    emitEvent: () => {}
  });

  const controller = new AbortController();
  controller.abort();

  await assert.rejects(
    () => orchestrator.waitStep(controller.signal, 1),
    (err) => err.message === "Mission run aborted"
  );
});

test("agents reset to idle after mission error", async () => {
  const events = [];
  const orchestrator = new MissionOrchestrator({
    config: createTestConfig(),
    emitEvent: (event) => events.push(event)
  });

  // Sabotage the planner agent to force a mission error
  const originalRunMission = orchestrator.runMission.bind(orchestrator);
  orchestrator.runMission = async function (opts) {
    this.updateAgent("planner", { status: "thinking", currentTask: "test" });
    this.updateAgent("research", { status: "listening", currentTask: "test" });
    throw new Error("Simulated agent failure");
  };

  await orchestrator.startMission({
    missionText: "Plan a dinner",
    mode: "simulation"
  });
  await orchestrator.waitForCurrentRun();

  const state = orchestrator.getState();
  for (const agent of state.agents) {
    assert.equal(agent.status, "idle", `Agent ${agent.id} should be idle but was ${agent.status}`);
  }
});

test("safeSendUserSms failure does not crash mission", async () => {
  const orchestrator = new MissionOrchestrator({
    config: createTestConfig(),
    emitEvent: () => {}
  });

  // Override sendUserSms to throw
  orchestrator.sendUserSms = async () => {
    throw new Error("SMS transport failure");
  };

  // safeSendUserSms should swallow the error
  await orchestrator.safeSendUserSms("test message");
  // If we reach here, the test passes (no throw)
});

test("approval state cleared on abort", async () => {
  const orchestrator = new MissionOrchestrator({
    config: { ...createTestConfig(), simulationDelayMs: 2, autoApprovalDelayMs: 60000 },
    emitEvent: () => {}
  });

  await orchestrator.startMission({
    missionText: "Plan a dinner and movie night",
    mode: "simulation",
    autonomyMode: "confirm"
  });

  // Wait for a pending approval to appear
  const pendingApproval = await waitFor(() => orchestrator.getState().pendingApproval);
  assert.ok(pendingApproval, "Should have a pending approval");

  // Abort the mission
  orchestrator.currentController.abort();
  await orchestrator.waitForCurrentRun();

  assert.equal(orchestrator.getState().pendingApproval, null, "pendingApproval should be cleared after abort");
});
