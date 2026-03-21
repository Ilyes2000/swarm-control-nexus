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
    addAdaptation: vi.fn(),
    addMasteryUpdate: vi.fn(),
    addRiskSignal: vi.fn(),
    setKnowledgeTwin: vi.fn(),
    setTrainingMode: vi.fn(),
    setDemoMode: vi.fn(),
    setUserInput: vi.fn(),
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

  it("maps study-specific mastery and risk events", () => {
    const actions = createActions();

    applyMissionEvent(
      {
        type: "mastery_updated",
        payload: {
          topic: "Completing the square",
          mastery: 64,
          confidence: 59,
          trend: "up",
        },
        ts: new Date().toISOString(),
      },
      actions,
    );

    applyMissionEvent(
      {
        type: "risk_signal",
        payload: {
          id: "risk-1",
          level: "moderate",
          title: "Confidence dip",
          message: "The student is hesitating before starting the hard set.",
          nextAction: "Start with a five-minute warm-up.",
        },
        ts: new Date().toISOString(),
      },
      actions,
    );

    applyMissionEvent(
      {
        type: "knowledge_twin_updated",
        payload: [
          {
            id: "node-1",
            label: "Completing the square",
            cluster: "algebra",
            mastery: 64,
            confidence: 59,
            status: "developing",
          },
        ],
        ts: new Date().toISOString(),
      },
      actions,
    );

    expect(actions.addMasteryUpdate).toHaveBeenCalledWith({
      topic: "Completing the square",
      mastery: 64,
      confidence: 59,
      trend: "up",
    });
    expect(actions.addRiskSignal).toHaveBeenCalledWith({
      id: "risk-1",
      level: "moderate",
      title: "Confidence dip",
      message: "The student is hesitating before starting the hard set.",
      nextAction: "Start with a five-minute warm-up.",
    });
    expect(actions.setKnowledgeTwin).toHaveBeenCalledWith([
      {
        id: "node-1",
        label: "Completing the square",
        cluster: "algebra",
        mastery: 64,
        confidence: 59,
        status: "developing",
      },
    ]);
  });
});
