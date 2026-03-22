import test from "node:test";
import assert from "node:assert/strict";
import { parseMerchantResponseText, MissionOrchestrator } from "../orchestrator.js";

function createTestConfig(overrides = {}) {
  return {
    simulationDelayMs: 0,
    autoApprovalDelayMs: 5,
    merchantResponseTimeoutMs: 50,
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
    missionVoiceName: "Test Voice",
    ...overrides
  };
}

// --- parseMerchantResponseText tests ---

test("parseMerchantResponseText — accept keywords", () => {
  for (const word of ["ACCEPT", "yes", "Confirmed", "ok", "Ok"]) {
    const result = parseMerchantResponseText(word);
    assert.equal(result.offerType, "accept", `expected "accept" for "${word}"`);
  }
});

test("parseMerchantResponseText — accepts trailing confirmation text", () => {
  const result = parseMerchantResponseText("ACCEPT, thanks");
  assert.equal(result.offerType, "accept");
});

test("parseMerchantResponseText — counter with time", () => {
  const result = parseMerchantResponseText("How about 8:00 PM?");
  assert.equal(result.offerType, "counter");
  assert.equal(result.details.time, "8:00 PM");
});

test("parseMerchantResponseText — discount extraction", () => {
  const result = parseMerchantResponseText("10% off if you come at 6:15");
  assert.equal(result.offerType, "counter");
  assert.equal(result.details.discount, "10%");
  assert.equal(result.details.time, "6:15");
});

test("parseMerchantResponseText — promo code", () => {
  const result = parseMerchantResponseText("Use code SPRING25 for tonight");
  assert.equal(result.offerType, "promo");
  assert.equal(result.details.promoCode, "SPRING25");
});

test("parseMerchantResponseText — offpeak keywords", () => {
  const result = parseMerchantResponseText("Quiet table with complimentary appetizer");
  assert.equal(result.offerType, "offpeak");
});

// --- Orchestrator integration tests ---

test("simulation still records merchant offers when the merchant does not respond immediately", async () => {
  const events = [];
  const orchestrator = new MissionOrchestrator({
    config: createTestConfig({ merchantResponseTimeoutMs: 50 }),
    emitEvent: (event) => events.push(event)
  });

  await orchestrator.startMission({
    missionText: "Plan a dinner and movie night",
    mode: "simulation"
  });
  await orchestrator.waitForCurrentRun();

  assert.equal(orchestrator.getState().missionStatus, "completed");
  assert.ok(events.some((e) => e.type === "merchant_offer"));
});

test("handleInboundMerchantSms resolves pending merchant", async () => {
  const events = [];
  const orchestrator = new MissionOrchestrator({
    config: createTestConfig(),
    emitEvent: (event) => events.push(event)
  });

  let resolvedValue = null;
  const promise = new Promise((resolve) => {
    orchestrator.pendingMerchantResolver = (response) => {
      resolvedValue = response;
      resolve();
    };
    orchestrator.pendingMerchantTarget = {
      venueName: "Test Restaurant",
      venuePhone: "5550009999"
    };
  });

  await orchestrator.handleInboundMerchantSms({ from: "+1 (555) 000-9999", text: "ACCEPT" });
  await promise;

  assert.equal(resolvedValue.offerType, "accept");
  assert.equal(orchestrator.pendingMerchantResolver, null);
  assert.equal(orchestrator.pendingMerchantTarget, null);
  assert.ok(events.some((e) => e.type === "sms" && e.payload.direction === "received"));
  assert.ok(events.some((e) => e.type === "timeline_entry" && e.payload.description.includes("replied")));
});

test("stale merchant SMS is ignored when no merchant response is pending", async () => {
  const events = [];
  const orchestrator = new MissionOrchestrator({
    config: createTestConfig(),
    emitEvent: (event) => events.push(event)
  });

  await orchestrator.handleInboundMerchantSms({ from: "+1 (555) 000-9998", text: "ACCEPT" });

  assert.equal(orchestrator.getState().merchantOffers.length, 0);
  assert.ok(events.some((e) => e.type === "sms" && e.payload.direction === "received"));
});

test("resetMission clears merchant state", () => {
  const orchestrator = new MissionOrchestrator({
    config: createTestConfig(),
    emitEvent: () => {}
  });

  orchestrator.pendingMerchantResolver = () => {};
  orchestrator.pendingMerchantTarget = {
    venueName: "Some Place",
    venuePhone: "5551234567"
  };
  orchestrator.pendingMerchantTimer = setTimeout(() => {}, 100000);

  orchestrator.resetMission();

  assert.equal(orchestrator.pendingMerchantResolver, null);
  assert.equal(orchestrator.pendingMerchantTarget, null);
  assert.equal(orchestrator.pendingMerchantTimer, null);
});
