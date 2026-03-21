import http from "node:http";
import express from "express";
import { loadConfig } from "./config.js";
import { createMissionWebSocketHub } from "./websocket.js";
import { MissionOrchestrator } from "./orchestrator.js";
import { createTelnyxSmsClient } from "./integrations/telnyx-sms.js";
import { createStudyStore } from "./study-store.js";

const config = loadConfig();
const app = express();
const server = http.createServer(app);

app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", config.corsOrigin);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

const studyStore = createStudyStore();
let websocketHub;
const orchestrator = new MissionOrchestrator({
  config,
  studyStore,
  emitEvent: (event) => websocketHub.broadcast(event)
});
const telnyxSmsClient = createTelnyxSmsClient(config);

websocketHub = createMissionWebSocketHub({
  getState: () => orchestrator.getState()
});
websocketHub.attach(server);

function parseMode(value) {
  return value === "simulation" ? "simulation" : "live";
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, product: "study-mission-os" });
});

app.get("/api/auth/session", (_req, res) => {
  res.json(studyStore.getAuthSession());
});

app.post("/api/auth/role", (req, res) => {
  try {
    res.json(studyStore.switchRole(req.body?.role));
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Unable to switch role" });
  }
});

app.get("/api/auth/claims", (_req, res) => {
  res.json({ claims: studyStore.getRoleClaims() });
});

app.get("/api/auth/consent", (_req, res) => {
  res.json(studyStore.getConsentPolicy());
});

app.patch("/api/auth/consent", (req, res) => {
  res.json(studyStore.updateConsentPolicy(req.body ?? {}));
});

app.get("/api/profiles/me", (_req, res) => {
  res.json({ profile: studyStore.getProfile() });
});

app.patch("/api/profiles/me", (req, res) => {
  res.json({ profile: studyStore.updateProfile(req.body ?? {}) });
});

app.get("/api/profiles/dashboard", (_req, res) => {
  res.json(studyStore.getDashboard());
});

app.get("/api/calendar", (_req, res) => {
  res.json(studyStore.getCalendar());
});

app.post("/api/calendar/sync", (req, res) => {
  res.json(studyStore.syncCalendar(req.body?.provider ?? "google"));
});

app.get("/api/goals", (_req, res) => {
  res.json({ goals: studyStore.listGoals() });
});

app.post("/api/goals", (req, res) => {
  res.status(201).json({ goal: studyStore.createGoal(req.body ?? {}) });
});

app.patch("/api/goals/:goalId", (req, res) => {
  const goal = studyStore.updateGoal(req.params.goalId, req.body ?? {});
  if (!goal) {
    res.status(404).json({ error: "Goal not found" });
    return;
  }

  res.json({ goal });
});

app.get("/api/missions", (_req, res) => {
  res.json({ missions: studyStore.listMissions() });
});

app.get("/api/missions/:missionId", (req, res) => {
  const detail = studyStore.getMissionDetail(req.params.missionId);
  if (!detail) {
    res.status(404).json({ error: "Mission not found" });
    return;
  }

  res.json(detail);
});

app.post("/api/missions/generate", (req, res) => {
  res.status(201).json({ mission: studyStore.createMissionDraft({ prompt: req.body?.prompt ?? "" }) });
});

app.get("/api/tasks", (_req, res) => {
  res.json({ tasks: studyStore.listTasks() });
});

app.patch("/api/tasks/:taskId", (req, res) => {
  const task = studyStore.updateTask(req.params.taskId, req.body ?? {});
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json({ task });
});

app.get("/api/sessions", (_req, res) => {
  res.json({ sessions: studyStore.listSessions() });
});

app.patch("/api/sessions/:sessionId", (req, res) => {
  const session = studyStore.updateSession(req.params.sessionId, req.body ?? {});
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.json({ session });
});

app.post("/api/sessions/:sessionId/complete", (req, res) => {
  const result = studyStore.completeSession(req.params.sessionId, req.body ?? {});
  if (!result) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.json(result);
});

app.get("/api/uploads", (_req, res) => {
  res.json({ uploads: studyStore.listUploads() });
});

app.post("/api/uploads", (req, res) => {
  res.status(201).json(studyStore.createUpload(req.body ?? {}));
});

app.get("/api/resources", (_req, res) => {
  res.json({ resources: studyStore.listResources() });
});

app.post("/api/resources", (req, res) => {
  res.status(201).json({ resource: studyStore.createResource(req.body ?? {}) });
});

app.get("/api/notes", (_req, res) => {
  res.json({ notes: studyStore.listNotes() });
});

app.post("/api/notes", (req, res) => {
  res.status(201).json({ note: studyStore.createNote(req.body ?? {}) });
});

app.patch("/api/notes/:noteId", (req, res) => {
  const note = studyStore.updateNote(req.params.noteId, req.body ?? {});
  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  res.json({ note });
});

app.post("/api/notes/:noteId/summarize", (req, res) => {
  const note = studyStore.summarizeNote(req.params.noteId);
  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  res.json({ note });
});

app.post("/api/notes/:noteId/flashcards", (req, res) => {
  const result = studyStore.convertNoteToFlashcards(req.params.noteId);
  if (!result.note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  res.json(result);
});

app.get("/api/practice", (_req, res) => {
  res.json(studyStore.getPractice());
});

app.post("/api/practice/attempts", (req, res) => {
  try {
    res.status(201).json({ attempt: studyStore.createPracticeAttempt(req.body ?? {}) });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Unable to score attempt" });
  }
});

app.post("/api/practice/:setId/similar", (req, res) => {
  const set = studyStore.createSimilarPracticeSet(req.params.setId);
  if (!set) {
    res.status(404).json({ error: "Practice set not found" });
    return;
  }

  res.status(201).json({ set });
});

app.get("/api/revision", (_req, res) => {
  res.json(studyStore.getRevision());
});

app.post("/api/revision/review", (req, res) => {
  res.json(studyStore.reviewFlashcard(req.body ?? {}));
});

app.get("/api/mastery", (_req, res) => {
  res.json(studyStore.getMastery());
});

app.get("/api/teacher/dashboard", (_req, res) => {
  res.json(studyStore.getTeacherDashboard());
});

app.get("/api/guardian/dashboard", (_req, res) => {
  res.json(studyStore.getGuardianDashboard());
});

app.get("/api/risk", (_req, res) => {
  res.json(studyStore.getRisk());
});

app.post("/api/risk/interventions", (req, res) => {
  res.status(201).json({ intervention: studyStore.createIntervention(req.body ?? {}) });
});

app.get("/api/career", (_req, res) => {
  res.json(studyStore.getCareerPlan());
});

app.patch("/api/career/milestones/:milestoneId", (req, res) => {
  res.json(studyStore.updateCareerMilestone(req.params.milestoneId, req.body?.status));
});

app.get("/api/admin/dashboard", (_req, res) => {
  res.json(studyStore.getAdminDashboard());
});

app.get("/api/mission/state", (_req, res) => {
  res.json({ state: orchestrator.getState() });
});

app.post("/api/mission/start", async (req, res) => {
  try {
    const result = await orchestrator.startMission({
      missionText: req.body?.missionText,
      mode: parseMode(req.body?.mode)
    });
    res.status(202).json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Unable to start mission" });
  }
});

app.post("/api/mission/interrupt", async (req, res) => {
  try {
    const result = await orchestrator.interruptMission({
      command: req.body?.command
    });
    res.status(202).json(result);
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : "Unable to interrupt mission" });
  }
});

app.post("/api/mission/reset", (_req, res) => {
  orchestrator.resetMission();
  res.status(202).json({ ok: true });
});

app.post("/api/webhooks/telnyx/sms", async (req, res) => {
  try {
    const parsed = telnyxSmsClient.parseInboundWebhook(req.body);
    await orchestrator.handleInboundSms(parsed);
    res.status(202).json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid webhook payload" });
  }
});

server.listen(config.port, () => {
  console.log(`Study Mission backend listening on http://127.0.0.1:${config.port}`);
});
