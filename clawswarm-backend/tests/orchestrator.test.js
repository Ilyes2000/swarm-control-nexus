import test from "node:test";
import assert from "node:assert/strict";
import { MissionOrchestrator } from "../orchestrator.js";
import { createStudyStore } from "../study-store.js";

function createTestConfig() {
  return {
    simulationDelayMs: 0,
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
    missionVoiceName: "Study Coach Voice"
  };
}

test("simulation study mission emits summary, task, and mastery events", async () => {
  const events = [];
  const orchestrator = new MissionOrchestrator({
    config: createTestConfig(),
    studyStore: createStudyStore({ persist: false }),
    emitEvent: (event) => events.push(event)
  });

  await orchestrator.startMission({
    missionText: "Recover algebra before the exam in 3 days",
    mode: "simulation"
  });
  await orchestrator.waitForCurrentRun();

  assert.ok(events.some((event) => event.type === "mission_status" && event.payload.status === "live"));
  assert.ok(events.some((event) => event.type === "summary"));
  assert.ok(events.some((event) => event.type === "task_created"));
  assert.ok(events.some((event) => event.type === "mastery_updated"));
  assert.equal(orchestrator.getState().missionStatus, "completed");
});

test("interrupting a live study mission publishes adaptation and replan events", async () => {
  const events = [];
  const orchestrator = new MissionOrchestrator({
    config: { ...createTestConfig(), simulationDelayMs: 5 },
    studyStore: createStudyStore({ persist: false }),
    emitEvent: (event) => events.push(event)
  });

  await orchestrator.startMission({
    missionText: "Prepare for calculus this week",
    mode: "simulation"
  });

  await orchestrator.interruptMission({ command: "Make it lighter for tonight" });
  await orchestrator.waitForCurrentRun();

  assert.ok(events.some((event) => event.type === "adaptation"));
  assert.ok(events.some((event) => event.type === "mission_replanned"));
  assert.ok(events.some((event) => event.type === "sms" && event.payload.text.includes("Plan updated")));
});
