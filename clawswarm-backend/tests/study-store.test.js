import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createStudyStore } from "../study-store.js";

test("study store persists auth, goals, uploads, and interventions to disk", () => {
  const persistencePath = path.join(os.tmpdir(), `study-store-${Date.now()}.json`);
  fs.rmSync(persistencePath, { force: true });

  const store = createStudyStore({ persistencePath, persist: true });
  store.switchRole("teacher");
  const goal = store.createGoal({
    title: "Finish integration revision plan",
    subject: "Mathematics",
    deadlineLabel: "Friday",
    targetScore: "85%",
    type: "exam"
  });
  const uploadResult = store.createUpload({
    title: "Integration chapter notes",
    subject: "Mathematics",
    kind: "pdf"
  });
  const intervention = store.createIntervention({
    title: "Confidence-safe restart",
    ownerRole: "counselor",
    summary: "Shrink the next sprint and protect a five-minute warm-up.",
    nextCheckInLabel: "Tomorrow"
  });

  const reloaded = createStudyStore({ persistencePath, persist: true });

  assert.equal(reloaded.getAuthSession().role, "teacher");
  assert.ok(reloaded.listGoals().some((item) => item.id === goal.id));
  assert.ok(reloaded.listUploads().some((item) => item.id === uploadResult.upload.id));
  assert.ok(reloaded.getRisk().interventions.some((item) => item.id === intervention.id));

  fs.rmSync(persistencePath, { force: true });
});

test("study store updates mastery and risk from practice and session workflows", () => {
  const store = createStudyStore({ persist: false });
  const practiceBefore = store.getPractice();
  const masteryBefore = store.getMastery();
  const sessionId = store.listSessions()[0]?.id;

  assert.ok(sessionId);

  const attempt = store.createPracticeAttempt({
    setId: practiceBefore.sets[0].id,
    answer: "I would factor first, verify the root, then check against the graph.",
    confidenceBefore: 52
  });

  const masteryAfter = store.getMastery();
  const sessionResult = store.completeSession(sessionId, {
    confidenceAfter: 42,
    reflection: "Needed a smaller restart before the core sprint."
  });

  assert.equal(attempt.status, "scored");
  assert.ok(masteryAfter.masteryNodes[0].mastery >= masteryBefore.masteryNodes[0].mastery);
  assert.ok(sessionResult?.riskSignal);
  assert.ok(store.getRisk().signals.some((signal) => signal.id === sessionResult?.riskSignal?.id));
});
