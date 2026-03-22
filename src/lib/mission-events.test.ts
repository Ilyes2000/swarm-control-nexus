import { describe, expect, it, vi } from "vitest";
import { createInitialMissionState } from "@/contexts/MissionContext";
import { applyMissionEvent, type MissionEventActions } from "@/lib/mission-events";

function createActions(): MissionEventActions {
  return {
    hydrateMission: vi.fn(),
    setMissionStatus: vi.fn(),
    updateAgent: vi.fn(),
    addTimelineEntry: vi.fn(),
    updateTimelineEntry: vi.fn(),
    setCall: vi.fn(),
    addCallTranscript: vi.fn(),
    addSMS: vi.fn(),
    setSummary: vi.fn(),
    addReasoning: vi.fn(),
    addMemory: vi.fn(),
    addSkill: vi.fn(),
    updateSkill: vi.fn(),
    addAdaptation: vi.fn(),
    setTrainingMode: vi.fn(),
    setDemoMode: vi.fn(),
    setUserInput: vi.fn(),
    setPendingApproval: vi.fn(),
    setPendingItineraryConfirmation: vi.fn(),
    addMerchantOffer: vi.fn(),
    updateMerchantOffer: vi.fn(),
    addRecommendationInsight: vi.fn(),
  };
}

describe("applyMissionEvent", () => {
  it("hydrates full snapshots", () => {
    const actions = createActions();
    const snapshot = createInitialMissionState();

    applyMissionEvent(
      {
        type: "snapshot",
        payload: snapshot,
        ts: new Date().toISOString(),
      },
      actions,
    );

    expect(actions.hydrateMission).toHaveBeenCalledWith(snapshot);
  });

  it("maps agent and call events to context actions", () => {
    const actions = createActions();

    applyMissionEvent(
      {
        type: "agent_update",
        payload: {
          id: "planner",
          updates: { status: "thinking", currentTask: "Planning" },
        },
        ts: new Date().toISOString(),
      },
      actions,
    );

    applyMissionEvent(
      {
        type: "call_transcript",
        payload: {
          speaker: "AI",
          text: "Hello there.",
        },
        ts: new Date().toISOString(),
      },
      actions,
    );

    expect(actions.updateAgent).toHaveBeenCalledWith("planner", {
      status: "thinking",
      currentTask: "Planning",
    });
    expect(actions.addCallTranscript).toHaveBeenCalledWith("AI", "Hello there.");
  });

  it("updates mission status and demo mode together", () => {
    const actions = createActions();

    applyMissionEvent(
      {
        type: "mission_status",
        payload: {
          status: "live",
          mode: "simulation",
        },
        ts: new Date().toISOString(),
      },
      actions,
    );

    expect(actions.setMissionStatus).toHaveBeenCalledWith("live");
    expect(actions.setDemoMode).toHaveBeenCalledWith(true);
  });

  it("maps approval events to pending approval state", () => {
    const actions = createActions();

    applyMissionEvent(
      {
        type: "approval_request",
        payload: {
          id: "ar-1",
          agentId: "call",
          action: "book_restaurant",
          details: {
            venue: "Bella Notte",
            time: "7:30 PM",
            partySize: 2,
            estimatedCost: "$65/person",
            confidence: 92,
          },
        },
        ts: new Date().toISOString(),
      },
      actions,
    );

    applyMissionEvent(
      {
        type: "approval_cleared",
        payload: {},
        ts: new Date().toISOString(),
      },
      actions,
    );

    expect(actions.setPendingApproval).toHaveBeenNthCalledWith(1, {
      id: "ar-1",
      agentId: "call",
      action: "book_restaurant",
      details: {
        venue: "Bella Notte",
        time: "7:30 PM",
        partySize: 2,
        estimatedCost: "$65/person",
        confidence: 92,
      },
    });
    expect(actions.setPendingApproval).toHaveBeenNthCalledWith(2, null);
  });

  it("maps merchant offer events into mission state actions", () => {
    const actions = createActions();

    applyMissionEvent(
      {
        type: "merchant_offer",
        payload: {
          id: "offer-1",
          venueName: "Bella Notte",
          offerType: "promo",
          originalRequest: "Dinner for two",
          merchantResponse: "Use code CLAWVIP tonight",
          details: {
            promoCode: "CLAWVIP",
            discount: "25%",
          },
          status: "pending",
          timestamp: new Date().toISOString(),
        },
        ts: new Date().toISOString(),
      },
      actions,
    );

    applyMissionEvent(
      {
        type: "merchant_offer_update",
        payload: {
          id: "offer-1",
          updates: {
            status: "accepted",
          },
        },
        ts: new Date().toISOString(),
      },
      actions,
    );

    expect(actions.addMerchantOffer).toHaveBeenCalled();
    expect(actions.updateMerchantOffer).toHaveBeenCalledWith("offer-1", { status: "accepted" });
  });

  it("maps recommendation insight and skill update events", () => {
    const actions = createActions();

    applyMissionEvent(
      {
        type: "recommendation_insight",
        payload: {
          id: "rec-1",
          workflow: "restaurant",
          venueName: "Bella Notte",
          summary: "Bella Notte at 7:30 PM",
          confidence: 92,
          sources: [],
          primaryBookingPath: "direct",
          primaryRisk: "low",
          fallbackMode: false,
        },
        ts: new Date().toISOString(),
      },
      actions,
    );

    applyMissionEvent(
      {
        type: "skill_update",
        payload: {
          skillKey: "Counter-offer escalation::venue:5550009999",
          updates: { usageCount: 2 },
        },
        ts: new Date().toISOString(),
      },
      actions,
    );

    expect(actions.addRecommendationInsight).toHaveBeenCalled();
    expect(actions.updateSkill).toHaveBeenCalledWith("Counter-offer escalation::venue:5550009999", { usageCount: 2 });
  });
});
