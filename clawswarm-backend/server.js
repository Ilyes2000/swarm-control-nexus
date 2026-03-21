import http from "node:http";
import express from "express";
import { loadConfig } from "./config.js";
import { createMissionWebSocketHub } from "./websocket.js";
import { MissionOrchestrator } from "./orchestrator.js";
import { createTelnyxSmsClient } from "./integrations/telnyx-sms.js";

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
      mode: req.body?.mode === "simulation" ? "simulation" : "live",
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

app.post("/api/webhooks/telnyx/sms", async (req, res) => {
  try {
    const parsed = telnyxSmsClient.parseInboundWebhook(req.body);
    await orchestrator.handleInboundSms(parsed);
    res.status(202).json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid webhook payload" });
  }
});

app.post("/api/webhooks/telnyx/merchant-sms", async (req, res) => {
  try {
    const parsed = telnyxSmsClient.parseInboundWebhook(req.body);
    await orchestrator.handleInboundMerchantSms(parsed);
    res.status(202).json({ ok: true });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Invalid webhook payload" });
  }
});

server.listen(config.port, () => {
  console.log(`ClawSwarm backend listening on http://127.0.0.1:${config.port}`);
});
