import test from "node:test";
import assert from "node:assert/strict";
import { MissionOrchestrator } from "../orchestrator.js";

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
    missionVoiceName: "Test Voice"
  };
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
