import http from "node:http";
import express from "express";
import { loadConfig } from "./config.js";
import { createMissionWebSocketHub } from "./websocket.js";
import { MissionOrchestrator } from "./orchestrator.js";
import { createTelnyxSmsClient } from "./integrations/telnyx-sms.js";
import { getAllVenueMemories, getVenueIntelligenceReport, updateVenueMemory } from "./venue-memory.js";
import {
  getGenomeStats,
  getSkillLibrary,
  getMissionHistory,
  generateReplayDiff,
  checkOpportunisticTraining,
  runOpportunisticConsolidation,
  seedDemoData as seedGenomeDemoData,
} from "./skill-genome.js";

const config = loadConfig();
const app = express();
const server = http.createServer(app);

app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", config.corsOrigin);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
});

let websocketHub;
const orchestrator = new MissionOrchestrator({
  config,
  emitEvent: (event) => websocketHub.broadcast(event)
});
const telnyxSmsClient = createTelnyxSmsClient(config);

websocketHub = createMissionWebSocketHub({
  getState: () => orchestrator.getState()
});
websocketHub.attach(server);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/mission/state", (_req, res) => {
  res.json({ state: orchestrator.getState() });
});

app.post("/api/mission/start", async (req, res) => {
  try {
    const result = await orchestrator.startMission({
      missionText: req.body?.missionText,
      mode: config.simulationMode ? "simulation" : (req.body?.mode === "simulation" ? "simulation" : "live"),
      autonomyMode: req.body?.autonomyMode,
      autonomyConstraints: req.body?.autonomyConstraints
    });
    res.status(202).json(result);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Unable to start mission" });
  }
});

app.post("/api/mission/interrupt", async (req, res) => {
  try {
    const result = await orchestrator.interruptMission({
      command: req.body?.command,
      details: req.body?.details
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

app.post("/api/mission/shadow", async (req, res) => {
  try {
    const result = await orchestrator.startShadowMission({
      missionText: req.body?.missionText,
      mode: config.simulationMode ? "simulation" : (req.body?.mode === "simulation" ? "simulation" : "live")
    });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Shadow mission failed"
    });
  }
});

app.post("/api/mission/shadow/launch", async (req, res) => {
  try {
    const { pathId, missionText, mode, autonomyMode, autonomyConstraints } = req.body;

    const shadowPath = orchestrator.state.shadowPaths?.find(p => p.id === pathId);
    if (!shadowPath) {
      return res.status(404).json({ error: "Shadow path not found" });
    }

    const fallbackMissionText =
      shadowPath.researchResult?.missionType === "dinner_and_movie"
        ? `Plan a dinner at ${shadowPath.restaurant.name} and movie ${shadowPath.cinema.movie}`
        : missionText ||
          `Plan around ${shadowPath.restaurant.name}${
            shadowPath.cinema?.name ? ` and ${shadowPath.cinema.name}` : ""
          }`;

    const result = await orchestrator.startMission({
      missionText: missionText?.trim() || fallbackMissionText,
      mode: config.simulationMode ? "simulation" : (mode === "simulation" ? "simulation" : "live"),
      autonomyMode: autonomyMode || "autobook",
      autonomyConstraints
    });

    res.status(202).json({ ...result, strategy: shadowPath.strategy });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Failed to launch shadow path"
    });
  }
});

app.get("/api/venues/memory", (_req, res) => {
  res.json({ venues: getAllVenueMemories() });
});

app.get("/api/venues/:name/intelligence", (req, res) => {
  const report = getVenueIntelligenceReport(
    decodeURIComponent(req.params.name)
  );
  res.json(report);
});

app.post("/api/venues/seed-demo", (_req, res) => {
  const demoVenues = [
    {
      name: "La Bella Vita",
      calls: [
        { offerType: "counter", text: "8:00 PM works better", details: { time: "8:00 PM" } },
        { offerType: "accept",  text: "Confirmed!",           details: {} },
        { offerType: "promo",   text: "20% off with CLAW20",  details: { promoCode: "CLAW20", discount: "20%" } },
      ]
    },
    {
      name: "Grand Cinema",
      calls: [
        { offerType: "accept",  text: "Seats confirmed",          details: {} },
        { offerType: "offpeak", text: "Quiet screening at 9:45",  details: { time: "9:45 PM" } },
      ]
    },
    {
      name: "Le Bernardin",
      calls: [
        { offerType: "no_response", text: "", details: {} },
        { offerType: "accept",      text: "Bonsoir, bien sûr", details: {} },
      ]
    },
  ];

  for (const venue of demoVenues) {
    for (const outcome of venue.calls) {
      updateVenueMemory(venue.name, outcome);
    }
  }

  res.json({ ok: true, seeded: demoVenues.map(v => v.name) });
});

// ─── Skill Genome routes ───────────────────────────────────────────────────────

app.get("/api/genome/stats", (_req, res) => {
  res.json(getGenomeStats());
});

app.get("/api/genome/skills", (_req, res) => {
  res.json({ skills: getSkillLibrary() });
});

app.get("/api/genome/missions", (_req, res) => {
  res.json({ missions: getMissionHistory() });
});

app.get("/api/genome/missions/:id/replay", (req, res) => {
  const diff = generateReplayDiff(req.params.id);
  if (!diff) return res.status(404).json({ error: "Mission not found" });
  res.json(diff);
});

app.get("/api/genome/training", (_req, res) => {
  res.json(checkOpportunisticTraining());
});

app.post("/api/genome/seed", (_req, res) => {
  seedGenomeDemoData();
  res.json({ ok: true, seeded: true, stats: getGenomeStats() });
});

app.post("/api/genome/train", async (_req, res) => {
  runOpportunisticConsolidation((type, payload) => websocketHub.broadcast({ type, payload, ts: new Date().toISOString() })).catch(() => {});
  res.json({ ok: true, status: "training" });
});

app.post("/api/webhooks/telnyx/sms", async (req, res) => {
  try {
    const parsed = telnyxSmsClient.parseInboundWebhook(req.body);
    if (!parsed.text) {
      res.status(202).json({ ok: true, ignored: true });
      return;
    }
    await orchestrator.handleInboundSms(parsed);
    res.status(202).json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid webhook payload" });
  }
});

app.post("/api/webhooks/telnyx/merchant-sms", async (req, res) => {
  try {
    const parsed = telnyxSmsClient.parseInboundWebhook(req.body);
    if (!parsed.text) {
      res.status(202).json({ ok: true, ignored: true });
      return;
    }
    await orchestrator.handleInboundMerchantSms(parsed);
    res.status(202).json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid webhook payload" });
  }
});

server.listen(config.port, () => {
  console.log(`ClawSwarm backend listening on http://127.0.0.1:${config.port}`);
  seedGenomeDemoData(); // pre-warm demo skill genome
});
