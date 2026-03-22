/**
 * Suite B — Shadow Mission Twin
 * Tests the shadow path parallel planning (3 strategies)
 */
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
    anthropicModel: "claude-haiku-4-5-20251001",
    clawdtalkWsUrl: "",
    userPhoneNumber: "",
    missionVoiceName: "Test Voice",
  };
}

test("B01 — startShadowMission returns 3 strategy paths", async () => {
  const events = [];
  const orchestrator = new MissionOrchestrator({
    config: createTestConfig(),
    emitEvent: (event) => events.push(event),
  });

  const result = await orchestrator.startShadowMission({
    missionText: "Dinner and movie tonight",
    mode: "simulation",
  });

  assert.ok(result.ok, "must return ok");
  assert.ok(Array.isArray(result.paths), "must return paths array");
  assert.equal(result.paths.length, 3, "must have exactly 3 paths");
});

test("B02 — shadow paths contain best_value, fastest, premium strategies", async () => {
  const orchestrator = new MissionOrchestrator({
    config: createTestConfig(),
    emitEvent: () => {},
  });

  const result = await orchestrator.startShadowMission({
    missionText: "Book a dinner tonight",
    mode: "simulation",
  });

  const strategies = result.paths.map((p) => p.strategy);
  assert.ok(strategies.includes("best_value"), "must include best_value");
  assert.ok(strategies.includes("fastest"), "must include fastest");
  assert.ok(strategies.includes("premium"), "must include premium");
});

test("B03 — each shadow path has required fields", async () => {
  const orchestrator = new MissionOrchestrator({
    config: createTestConfig(),
    emitEvent: () => {},
  });

  const result = await orchestrator.startShadowMission({
    missionText: "Plan a dinner",
    mode: "simulation",
  });

  for (const path of result.paths) {
    assert.ok(path.id, `${path.strategy}: must have id`);
    assert.ok(path.label, `${path.strategy}: must have label`);
    assert.ok(typeof path.estimatedCost === "number", `${path.strategy}: must have numeric estimatedCost`);
    assert.ok(typeof path.confidence === "number", `${path.strategy}: must have numeric confidence`);
    assert.ok(path.confidenceLabel, `${path.strategy}: must have confidenceLabel`);
    assert.ok(path.color, `${path.strategy}: must have color`);
    assert.ok(path.noShowRisk, `${path.strategy}: must have noShowRisk`);
    assert.ok(path.restaurant?.name, `${path.strategy}: must have restaurant.name`);
    assert.ok(path.cinema?.name, `${path.strategy}: must have cinema.name`);
  }
});

test("B04 — premium path costs more than best_value", async () => {
  const orchestrator = new MissionOrchestrator({
    config: createTestConfig(),
    emitEvent: () => {},
  });

  const result = await orchestrator.startShadowMission({
    missionText: "Plan a dinner and movie",
    mode: "simulation",
  });

  const bestValue = result.paths.find((p) => p.strategy === "best_value");
  const premium   = result.paths.find((p) => p.strategy === "premium");

  assert.ok(premium.estimatedCost > bestValue.estimatedCost,
    `premium (${premium.estimatedCost}) should cost more than best_value (${bestValue.estimatedCost})`);
});

test("B05 — shadow events are emitted during run", async () => {
  const events = [];
  const orchestrator = new MissionOrchestrator({
    config: createTestConfig(),
    emitEvent: (event) => events.push(event),
  });

  await orchestrator.startShadowMission({
    missionText: "Dinner and show",
    mode: "simulation",
  });

  assert.ok(
    events.some((e) => e.type === "shadow_status" && e.payload.status === "running"),
    "must emit shadow_status running"
  );
  assert.ok(
    events.some((e) => e.type === "shadow_status" && e.payload.status === "ready"),
    "must emit shadow_status ready"
  );
  assert.ok(
    events.some((e) => e.type === "shadow_paths"),
    "must emit shadow_paths event"
  );
});

test("B06 — state reflects shadow paths after run", async () => {
  const orchestrator = new MissionOrchestrator({
    config: createTestConfig(),
    emitEvent: () => {},
  });

  await orchestrator.startShadowMission({
    missionText: "Plan a dinner",
    mode: "simulation",
  });

  const state = orchestrator.getState();
  assert.ok(Array.isArray(state.shadowPaths), "state must have shadowPaths");
  assert.equal(state.shadowPaths.length, 3, "state must have 3 shadow paths");
  assert.equal(state.shadowStatus, "ready", "shadowStatus must be 'ready'");
});

test("B07 — shadow mission works for hotel type", async () => {
  const orchestrator = new MissionOrchestrator({
    config: createTestConfig(),
    emitEvent: () => {},
  });

  const result = await orchestrator.startShadowMission({
    missionText: "Book a hotel room for tonight",
    mode: "simulation",
  });

  assert.equal(result.paths.length, 3);
  for (const path of result.paths) {
    assert.ok(path.researchResult?.missionType, "each path must have missionType in research");
  }
});
