/**
 * Suite E — End-to-End Integration
 * Full mission lifecycle: start → agents → timeline → skills injected → genome evolved
 */
import test from "node:test";
import assert from "node:assert/strict";
import { MissionOrchestrator } from "../orchestrator.js";
import { getGenomeStats, getMissionHistory, seedDemoData } from "../skill-genome.js";

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

async function runSimulation(missionText) {
  const events = [];
  const orchestrator = new MissionOrchestrator({
    config: createTestConfig(),
    emitEvent: (event) => events.push(event),
  });
  await orchestrator.startMission({ missionText, mode: "simulation" });
  await orchestrator.waitForCurrentRun();
  return { orchestrator, events, state: orchestrator.getState() };
}

// ─── Mission lifecycle ──────────────────────────────────────────────────────

test("E01 — dinner_and_movie mission completes successfully", async () => {
  const { state } = await runSimulation("Plan a dinner and movie tonight");
  assert.equal(state.missionStatus, "completed", "mission must complete");
});

test("E02 — mission emits summary and sms events", async () => {
  const { events } = await runSimulation("Book a dinner for tonight");
  assert.ok(events.some(e => e.type === "summary"), "must emit summary");
  assert.ok(events.some(e => e.type === "sms"), "must emit sms");
});

test("E03 — mission timeline has entries", async () => {
  const { state } = await runSimulation("Plan a dinner and movie");
  assert.ok(Array.isArray(state.timeline), "timeline must be an array");
  assert.ok(state.timeline.length > 0, "timeline must have events");
});

test("E04 — hotel mission completes successfully", async () => {
  const { state } = await runSimulation("Book a hotel room for tonight");
  assert.equal(state.missionStatus, "completed");
});

test("E05 — spa mission completes successfully", async () => {
  const { state } = await runSimulation("Book a spa massage appointment");
  assert.equal(state.missionStatus, "completed");
});

test("E06 — mission status goes live then completed", async () => {
  const { events } = await runSimulation("Plan a dinner tonight");
  const statusEvents = events.filter(e => e.type === "mission_status").map(e => e.payload.status);
  assert.ok(statusEvents.includes("live"), "must pass through 'live'");
  assert.ok(statusEvents.includes("completed"), "must end as 'completed'");
});

// ─── Genome integration ─────────────────────────────────────────────────────

test("E07 — genome mission history grows after simulation", async () => {
  seedDemoData(); // ensure baseline
  const before = getMissionHistory().length;
  await runSimulation("Plan a dinner and movie");
  const after = getMissionHistory().length;
  assert.ok(after > before, "mission count must increase after run");
});

test("E08 — skills_injected event emitted during mission", async () => {
  const { events } = await runSimulation("Book a dinner and movie tonight");
  assert.ok(
    events.some(e => e.type === "skills_injected"),
    "must emit skills_injected event"
  );
});

// ─── Summary payload ────────────────────────────────────────────────────────

test("E09 — summary event has result and cost breakdown", async () => {
  const { events } = await runSimulation("Plan a dinner and a movie this weekend");
  const summaryEvent = events.find(e => e.type === "summary");
  assert.ok(summaryEvent, "must have summary event");
  const payload = summaryEvent.payload;
  assert.ok(payload.result, "summary payload must have result");
  assert.ok(Array.isArray(payload.costBreakdown), "summary must have costBreakdown array");
  assert.ok(payload.visible === true, "summary must be visible");
});

test("E10 — mission state has merchantOffers after simulation", async () => {
  const { state } = await runSimulation("Book a dinner tonight");
  assert.ok(Array.isArray(state.merchantOffers), "must have merchantOffers array");
});

// ─── HTTP integration ───────────────────────────────────────────────────────

test("E11 — GET /health returns ok", async () => {
  const res = await fetch("http://localhost:8787/health");
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.ok);
});

test("E12 — GET /api/mission/state returns state object", async () => {
  const res = await fetch("http://localhost:8787/api/mission/state");
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(body.state, "must have state object");
  assert.ok(typeof body.state.missionStatus === "string");
});

test("E13 — POST /api/mission/start simulation returns 202", async () => {
  const res = await fetch("http://localhost:8787/api/mission/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ missionText: "Book a hotel", mode: "simulation" }),
  });
  assert.equal(res.status, 202, "must return 202 Accepted");
  const body = await res.json();
  assert.ok(body.ok || body.runId || body.missionStatus, "must return meaningful payload");
});

test("E14 — POST /api/mission/start rejects empty missionText", async () => {
  const res = await fetch("http://localhost:8787/api/mission/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ missionText: "", mode: "simulation" }),
  });
  assert.equal(res.status, 400, "empty missionText must return 400");
});

test("E15 — GET /api/genome/stats returns non-zero counts after missions", async () => {
  const res = await fetch("http://localhost:8787/api/genome/stats");
  assert.equal(res.status, 200);
  const stats = await res.json();
  assert.ok(stats.missionCount > 0 || stats.skillCount > 0,
    "genome must have missions or skills after e2e run");
});
