/**
 * Suite D — Skill Genome + Failure Replay (MetaClaw architecture)
 * Tests skill-genome.js in-memory functions and HTTP endpoints
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  seedDemoData,
  getGenomeStats,
  getSkillLibrary,
  getMissionHistory,
  generateReplayDiff,
  checkOpportunisticTraining,
  evolveSkillsFromFailures,
  measureSkillLift,
  retrieveRelevantSkills,
} from "../skill-genome.js";

// Seed once — idempotent
seedDemoData();

// ─── Stats ─────────────────────────────────────────────────────────────────

test("D01 — getGenomeStats returns generation and skill count", () => {
  const stats = getGenomeStats();
  assert.ok(typeof stats.generation === "number", "must have generation");
  assert.ok(typeof stats.currentGeneration === "number", "must have currentGeneration");
  assert.ok(typeof stats.skillCount === "number", "must have skillCount");
  assert.ok(typeof stats.totalSkills === "number", "must have totalSkills");
  assert.ok(stats.skillCount > 0, "seeded data must produce skills");
  assert.ok(stats.totalSkills > 0);
});

test("D02 — getGenomeStats has OMLS and lift fields", () => {
  const stats = getGenomeStats();
  assert.ok(typeof stats.activeSkills === "number", "must have activeSkills");
  assert.ok(typeof stats.avgLiftLabel === "string", "must have avgLiftLabel");
  assert.ok(typeof stats.supportBufferSize === "number", "must have supportBufferSize");
  assert.ok(typeof stats.queryBufferSize === "number", "must have queryBufferSize");
  assert.ok(Array.isArray(stats.generationLog), "must have generationLog array");
  assert.ok(stats.generationLog.length > 0, "generationLog must be non-empty after seed");
});

test("D03 — getGenomeStats has topSkills array", () => {
  const stats = getGenomeStats();
  assert.ok(Array.isArray(stats.topSkills), "topSkills must be array");
  assert.ok(stats.topSkills.length <= 3, "topSkills max 3");
});

// ─── Skill library ─────────────────────────────────────────────────────────

test("D04 — getSkillLibrary returns skills with base fields", () => {
  const skills = getSkillLibrary();
  assert.ok(skills.length > 0, "must have seeded skills");
  for (const skill of skills) {
    assert.ok(skill.skillKey, "must have skillKey");
    assert.ok(skill.title, "must have title");
    assert.ok(skill.description, "must have description");
    assert.ok(skill.category, "must have category");
  }
});

test("D05 — getSkillLibrary skills have generationLabel and status", () => {
  const skills = getSkillLibrary();
  for (const skill of skills) {
    assert.ok(skill.generationLabel, `${skill.skillKey}: must have generationLabel`);
    assert.match(skill.generationLabel, /^Gen \d+/, "generationLabel must match 'Gen N'");
    assert.ok(
      skill.status === "active" || skill.status === "pending",
      `${skill.skillKey}: status must be 'active' or 'pending'`
    );
  }
});

test("D06 — seeded demo skills have liftScore", () => {
  const skills = getSkillLibrary();
  const withLift = skills.filter(s => s.liftScore != null);
  assert.ok(withLift.length > 0, "demo skills must have liftScore");
  for (const s of withLift) {
    assert.ok(s.liftScore >= 0 && s.liftScore <= 1, "liftScore must be 0-1");
  }
});

// ─── Mission history ────────────────────────────────────────────────────────

test("D07 — getMissionHistory returns missions with base fields", () => {
  const missions = getMissionHistory();
  assert.ok(missions.length >= 2, "must have at least 2 demo missions");
  for (const m of missions) {
    assert.ok(m.id, "must have id");
    assert.ok(m.status, "must have status");
    assert.ok(m.timestamp, "must have timestamp");
  }
});

test("D08 — getMissionHistory missions have userInput and skillGeneration", () => {
  const missions = getMissionHistory();
  for (const m of missions) {
    assert.ok(typeof m.userInput === "string", `${m.id}: must have userInput`);
    assert.ok(m.userInput.length > 0, `${m.id}: userInput must be non-empty`);
    assert.ok(typeof m.skillGeneration === "number", `${m.id}: must have skillGeneration`);
  }
});

// ─── Replay diff ────────────────────────────────────────────────────────────

test("D09 — generateReplayDiff for demo-1 returns diff object", () => {
  const diff = generateReplayDiff("mission-demo-1");
  assert.ok(diff, "must return diff for mission-demo-1");
  assert.equal(diff.missionId, "mission-demo-1");
});

test("D10 — replay diff has generationThen and generationNow", () => {
  const diff = generateReplayDiff("mission-demo-1");
  assert.ok(diff, "must return diff");
  assert.ok(typeof diff.generationThen === "number", "must have generationThen");
  assert.ok(typeof diff.generationNow === "number", "must have generationNow");
  assert.ok(diff.generationNow >= diff.generationThen, "generationNow >= generationThen");
});

test("D11 — replay diff has newSkillsSince, improvements, failureAnalysis", () => {
  const diff = generateReplayDiff("mission-demo-1");
  assert.ok(diff);
  assert.ok(typeof diff.newSkillsSince === "number", "must have newSkillsSince");
  assert.ok(Array.isArray(diff.newSkillsAdded), "must have newSkillsAdded array");
  assert.ok(Array.isArray(diff.improvements), "must have improvements array");
  assert.ok(Array.isArray(diff.failureAnalysis), "must have failureAnalysis array");
});

test("D12 — replay diff has improvementPrediction and estimatedLiftLabel", () => {
  const diff = generateReplayDiff("mission-demo-1");
  assert.ok(diff);
  assert.ok(typeof diff.improvementPrediction === "string", "must have improvementPrediction");
  assert.ok(typeof diff.estimatedLiftLabel === "string", "must have estimatedLiftLabel");
  assert.ok(diff.improvementPrediction.length > 0);
});

test("D13 — generateReplayDiff returns null for unknown mission", () => {
  const diff = generateReplayDiff("non-existent-mission");
  assert.equal(diff, null);
});

// ─── OMLS / training ────────────────────────────────────────────────────────

test("D14 — checkOpportunisticTraining has required fields", () => {
  const info = checkOpportunisticTraining();
  assert.ok(typeof info.status === "string", "must have status");
  assert.ok(typeof info.shouldTrain === "boolean", "must have shouldTrain");
  assert.ok(typeof info.queryCount === "number", "must have queryCount");
  assert.ok(typeof info.idleMinutes === "number", "must have idleMinutes");
  assert.ok(typeof info.reason === "string", "must have reason");
  assert.ok(info.reason.length > 0);
});

test("D15 — shouldTrain is true when missions >= 2", () => {
  const info = checkOpportunisticTraining();
  // After seedDemoData, there are 2 missions → shouldTrain must be true
  assert.equal(info.shouldTrain, true, "shouldTrain must be true with 2+ missions");
});

// ─── Skill retrieval & lift ─────────────────────────────────────────────────

test("D16 — retrieveRelevantSkills returns scored skills", () => {
  const skills = retrieveRelevantSkills({ venueKey: "la-bella-vita" });
  assert.ok(Array.isArray(skills), "must return array");
  assert.ok(skills.length <= 5, "max 5 results");
});

test("D17 — measureSkillLift updates liftScore", () => {
  const skills = getSkillLibrary();
  if (skills.length === 0) return; // guard
  const skillKey = skills[0].skillKey;
  const before = skills[0].usageCount;
  measureSkillLift(skillKey, "success");
  const updated = getSkillLibrary().find(s => s.skillKey === skillKey);
  assert.ok(updated.usageCount > before, "usageCount must increment");
  assert.ok(updated.liftScore != null, "liftScore must be set");
  assert.ok(updated.liftScore >= 0 && updated.liftScore <= 1);
});

// ─── HTTP integration ───────────────────────────────────────────────────────

test("D18 — POST /api/genome/seed returns seeded:true", async () => {
  const res = await fetch("http://localhost:8787/api/genome/seed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.seeded, "response must have seeded:true");
  assert.ok(data.ok, "response must have ok:true");
});

test("D19 — GET /api/genome/stats returns generation info", async () => {
  const res = await fetch("http://localhost:8787/api/genome/stats");
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(typeof data.generation === "number");
  assert.ok(typeof data.skillCount === "number");
});

test("D20 — GET /api/genome/skills returns skills array", async () => {
  const res = await fetch("http://localhost:8787/api/genome/skills");
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.skills), "must return skills array");
});

test("D21 — GET /api/genome/missions returns missions array", async () => {
  const res = await fetch("http://localhost:8787/api/genome/missions");
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.missions), "must return missions array");
});

test("D22 — GET /api/genome/missions/mission-demo-1/replay returns diff", async () => {
  const res = await fetch("http://localhost:8787/api/genome/missions/mission-demo-1/replay");
  assert.equal(res.status, 200);
  const diff = await res.json();
  assert.equal(diff.missionId, "mission-demo-1");
  assert.ok(typeof diff.generationThen === "number");
  assert.ok(typeof diff.generationNow === "number");
});

test("D23 — POST /api/genome/train returns ok:true", async () => {
  const res = await fetch("http://localhost:8787/api/genome/train", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.ok, "must return ok:true");
});
