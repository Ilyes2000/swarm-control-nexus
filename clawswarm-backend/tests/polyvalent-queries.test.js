/**
 * Suite A — Polyvalent Query Engine
 * Tests multi-type mission detection and venue routing in research.js
 */
import test from "node:test";
import assert from "node:assert/strict";
import { runResearchAgent } from "../agents/research.js";
import { runPlannerAgent } from "../agents/planner.js";
import { runSchedulerAgent } from "../agents/scheduler.js";

const fakeLlm = { generateText: async ({ fallback }) => fallback };

// ─── Research agent: mission type detection ────────────────────────────────

test("A01 — hotel mission type detected", async () => {
  const r = await runResearchAgent({ missionText: "Book a hotel room for tonight", llm: fakeLlm });
  assert.equal(r.missionType, "hotel");
  assert.ok(r.primary?.name, "primary venue must have name");
  assert.ok(r.primary?.phone, "primary venue must have phone");
  assert.ok(r.primary?.checkIn, "hotel must have checkIn");
});

test("A02 — shopping mission type detected", async () => {
  const r = await runResearchAgent({ missionText: "Go shopping at the mall", llm: fakeLlm });
  assert.equal(r.missionType, "shopping");
  assert.ok(r.primary?.name);
  assert.ok(r.primary?.hours, "shopping must have hours");
});

test("A03 — travel / flight mission type detected", async () => {
  const r = await runResearchAgent({ missionText: "Book a flight to Paris for tomorrow", llm: fakeLlm });
  assert.equal(r.missionType, "travel");
  assert.ok(r.primary?.flightNumber, "travel must have flightNumber");
  assert.ok(r.primary?.departure);
});

test("A04 — entertainment / movie mission type detected", async () => {
  const r = await runResearchAgent({ missionText: "Watch a movie at the cinema this evening", llm: fakeLlm });
  assert.equal(r.missionType, "entertainment");
  assert.ok(r.primary?.showTitle);
  assert.ok(r.primary?.showtime);
});

test("A05 — spa mission type detected", async () => {
  const r = await runResearchAgent({ missionText: "Book a massage at the spa", llm: fakeLlm });
  assert.equal(r.missionType, "spa");
  assert.ok(r.primary?.services?.length > 0, "spa must have services");
  assert.ok(r.primary?.appointmentTime);
});

test("A06 — sport / gym mission type detected", async () => {
  const r = await runResearchAgent({ missionText: "Book a gym session this morning", llm: fakeLlm });
  assert.equal(r.missionType, "sport");
  assert.ok(r.primary?.classType);
});

test("A07 — medical appointment mission type detected", async () => {
  const r = await runResearchAgent({ missionText: "Schedule a doctor appointment", llm: fakeLlm });
  assert.equal(r.missionType, "medical");
  assert.ok(r.primary?.specialty);
  assert.ok(r.primary?.appointmentTime);
});

test("A08 — dinner_and_movie combo detected", async () => {
  const r = await runResearchAgent({ missionText: "Dinner then movie tonight", llm: fakeLlm });
  assert.equal(r.missionType, "dinner_and_movie");
  assert.ok(r.restaurant, "must have backward-compat restaurant field");
  assert.ok(r.cinema, "must have backward-compat cinema field");
  assert.ok(r.restaurant.name);
  assert.ok(r.cinema.movieTitle);
});

test("A09 — restaurant-only mission type detected", async () => {
  const r = await runResearchAgent({ missionText: "Reserve a table at the bistro for Saturday", llm: fakeLlm });
  assert.equal(r.missionType, "restaurant");
  assert.ok(r.primary?.reservationTime);
});

test("A10 — all results include liveText, confidence, sources", async () => {
  const types = [
    "Book a hotel",
    "Book a flight",
    "Book a spa",
    "Book a doctor",
  ];
  for (const missionText of types) {
    const r = await runResearchAgent({ missionText, llm: fakeLlm });
    assert.ok(r.liveText, `${missionText}: must have liveText`);
    assert.ok(typeof r.confidence === "number", `${missionText}: must have confidence`);
    assert.ok(Array.isArray(r.sources), `${missionText}: must have sources`);
  }
});

test("A11 — backward-compat fields always present", async () => {
  const cases = ["Book a hotel", "Book a spa", "Book a flight", "Dinner and movie"];
  for (const missionText of cases) {
    const r = await runResearchAgent({ missionText, llm: fakeLlm });
    assert.ok(r.restaurant, `${missionText}: must have restaurant (backward compat)`);
    assert.ok(r.cinema, `${missionText}: must have cinema (backward compat)`);
  }
});

// ─── Planner agent: type-aware task lists ─────────────────────────────────

test("A12 — planner returns hotel-specific tasks", async () => {
  const r = await runPlannerAgent({ missionText: "Book a hotel for tonight", llm: fakeLlm });
  assert.ok(r.tasks.length >= 3, "must have at least 3 tasks");
  assert.ok(r.missionType, "must return missionType");
  assert.ok(r.liveText);
  assert.ok(r.confidence >= 0);
});

test("A13 — planner returns tasks for unknown type", async () => {
  const r = await runPlannerAgent({ missionText: "Just do something random", llm: fakeLlm });
  assert.ok(r.tasks.length >= 3);
});

// ─── Scheduler agent: type-specific itineraries ────────────────────────────

test("A14 — scheduler handles hotel mission", async () => {
  const research = {
    missionType: "hotel",
    primary: { name: "Grand Hyatt", checkIn: "3:00 PM", roomType: "Deluxe King", pricePerNight: "$249" },
    restaurant: { name: "Grand Hyatt", reservationTime: "3:00 PM" },
    cinema: { name: "Grand Hyatt", movieTitle: "hotel", showtime: "TBD" },
  };
  const negotiation = { originalCost: 249, optimizedCost: 230, savings: { totalSavings: 19 } };
  const r = await runSchedulerAgent({ researchResult: research, negotiationResult: negotiation, llm: fakeLlm });
  assert.ok(r.itinerary.includes("Grand Hyatt"), "itinerary must mention venue");
  assert.ok(r.summary.visible);
  assert.ok(r.summary.costBreakdown.length > 0);
});

test("A15 — scheduler handles spa mission", async () => {
  const research = {
    missionType: "spa",
    primary: { name: "Serenity Spa", appointmentTime: "2:00 PM", services: ["Swedish Massage"], duration: "90 min", price: "$185" },
    restaurant: { name: "Serenity Spa", reservationTime: "2:00 PM" },
    cinema: { name: "Serenity Spa", movieTitle: "spa", showtime: "TBD" },
  };
  const negotiation = { originalCost: 185, optimizedCost: 165, savings: { totalSavings: 20 } };
  const r = await runSchedulerAgent({ researchResult: research, negotiationResult: negotiation, llm: fakeLlm });
  assert.ok(r.itinerary.includes("Serenity Spa"));
  assert.ok(r.summary.result.includes("Serenity Spa"));
});
