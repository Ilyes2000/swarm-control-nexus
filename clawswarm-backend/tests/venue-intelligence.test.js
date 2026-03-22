/**
 * Suite C — Venue Intelligence (Relationship-Aware Voice Negotiator)
 * Tests venue-memory.js: memory tracking, tone adaptation, call script building
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  getVenueMemory,
  updateVenueMemory,
  buildCallScript,
  getAllVenueMemories,
  getVenueIntelligenceReport,
} from "../venue-memory.js";

// Use unique names per test to avoid cross-test pollution
function venueName(suffix) {
  return `TestVenue_Suite_C_${suffix}_${Date.now()}`;
}

test("C01 — getVenueMemory creates new entry for unknown venue", () => {
  const name = venueName("C01");
  const mem = getVenueMemory(name);
  assert.equal(mem.callCount, 0);
  assert.equal(mem.successCount, 0);
  assert.equal(mem.relationshipLevel, "new");
  assert.equal(mem.successRate, null);
  assert.ok(mem.createdAt);
});

test("C02 — updateVenueMemory increments callCount on accept", () => {
  const name = venueName("C02");
  updateVenueMemory(name, { offerType: "accept" });
  const mem = getVenueMemory(name);
  assert.equal(mem.callCount, 1);
  assert.equal(mem.successCount, 1);
  assert.equal(mem.successRate, 100);
});

test("C03 — updateVenueMemory tracks no_response without counting as success", () => {
  const name = venueName("C03");
  updateVenueMemory(name, { offerType: "no_response" });
  const mem = getVenueMemory(name);
  assert.equal(mem.callCount, 1);
  assert.equal(mem.successCount, 0);
  assert.equal(mem.successRate, 0);
});

test("C04 — relationshipLevel advances from new → acquainted → regular", () => {
  const name = venueName("C04");
  updateVenueMemory(name, { offerType: "accept" });
  assert.equal(getVenueMemory(name).relationshipLevel, "acquainted");
  updateVenueMemory(name, { offerType: "accept" });
  updateVenueMemory(name, { offerType: "accept" });
  assert.equal(getVenueMemory(name).relationshipLevel, "regular");
});

test("C05 — preferredTone adapts to counter pattern", () => {
  const name = venueName("C05");
  updateVenueMemory(name, { offerType: "counter", details: { time: "8PM" } });
  updateVenueMemory(name, { offerType: "counter", details: { time: "8PM" } });
  const mem = getVenueMemory(name);
  assert.equal(mem.preferredTone, "assertive");
});

test("C06 — counterPatterns recorded from counter offers", () => {
  const name = venueName("C06");
  updateVenueMemory(name, { offerType: "counter", details: { time: "8PM" } });
  const mem = getVenueMemory(name);
  assert.ok(mem.counterPatterns.includes("8PM"), "counter time must be stored");
});

test("C07 — buildCallScript returns required fields for new venue", () => {
  const name = venueName("C07");
  const script = buildCallScript(name, "Table for two at 7PM");
  assert.ok(script.language, "must have language");
  assert.ok(script.greeting, "must have greeting");
  assert.ok(script.tone, "must have tone");
  assert.ok(script.opening, "must have opening");
  assert.ok(script.escalation, "must have escalation");
  assert.equal(typeof script.callCount, "number");
  assert.ok(script.suggestedApproach, "must have suggestedApproach");
});

test("C08 — Italian venue gets Italian greeting", () => {
  const script = buildCallScript("La Bella Vita", "Table for two");
  assert.equal(script.language, "it");
  assert.equal(script.greeting, "Buonasera");
});

test("C09 — French venue gets French greeting", () => {
  const script = buildCallScript("Le Bernardin", "Table for two");
  assert.equal(script.language, "fr");
  assert.equal(script.greeting, "Bonsoir");
});

test("C10 — promo code stored in memory", () => {
  const name = venueName("C10");
  updateVenueMemory(name, { offerType: "promo", details: { promoCode: "SAVE10" } });
  const mem = getVenueMemory(name);
  assert.equal(mem.lastPromoCode, "SAVE10");
});

test("C11 — getVenueIntelligenceReport returns memory + script + insights", () => {
  const name = venueName("C11");
  updateVenueMemory(name, { offerType: "accept" });
  const report = getVenueIntelligenceReport(name);
  assert.ok(report.memory, "must have memory");
  assert.ok(report.script, "must have script");
  assert.ok(report.insights, "must have insights");
  assert.ok(typeof report.insights.isKnown === "boolean");
  assert.ok(report.insights.recommendedTone);
  assert.ok(report.insights.successPrediction);
});

test("C12 — getAllVenueMemories returns array sorted by callCount", () => {
  const nameA = venueName("C12a");
  const nameB = venueName("C12b");
  updateVenueMemory(nameA, { offerType: "accept" });
  updateVenueMemory(nameA, { offerType: "accept" });
  updateVenueMemory(nameB, { offerType: "accept" });

  const all = getAllVenueMemories();
  assert.ok(Array.isArray(all), "must return array");

  // Find our test venues and verify ordering
  const idxA = all.findIndex(m => m.venueName === nameA);
  const idxB = all.findIndex(m => m.venueName === nameB);
  assert.ok(idxA < idxB, "higher callCount venue must appear first");
});

test("C13 — discount stored in lastDiscount field", () => {
  const name = venueName("C13");
  updateVenueMemory(name, { offerType: "accept", details: { discount: "15%" } });
  const mem = getVenueMemory(name);
  assert.equal(mem.lastDiscount, "15%");
});

test("C14 — callHistory records each interaction", () => {
  const name = venueName("C14");
  updateVenueMemory(name, { offerType: "accept" });
  updateVenueMemory(name, { offerType: "no_response" });
  const mem = getVenueMemory(name);
  assert.equal(mem.callHistory.length, 2);
  assert.equal(mem.callHistory[0].outcome, "accept");
  assert.equal(mem.callHistory[1].outcome, "no_response");
});
