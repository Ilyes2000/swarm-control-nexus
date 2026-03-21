import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useMission } from "@/contexts/MissionContext";
import { getMissionApiUrl, getMissionWsUrl } from "@/lib/mission-client";
import { applyMissionEvent, type MissionEvent, type MissionMode } from "@/lib/mission-events";
import {
  playAgentActivate,
  playCallConnect,
  playCallEnd,
  playMissionComplete,
  playPhoneRing,
  playSMS,
  resumeAudio,
  startAmbient,
  stopAmbient,
} from "@/lib/audio";

type ConnectionState = "disconnected" | "connecting" | "connected";

export function useMissionRuntime() {
  const {
    setMissionStatus,
    updateAgent,
    addTimelineEntry,
    updateTimelineEntry,
    setCall,
    addCallTranscript,
    addSMS,
    setSummary,
    addReasoning,
    addMemory,
    addSkill,
    addAdaptation,
    addMasteryUpdate,
    addRiskSignal,
    setKnowledgeTwin,
    setTrainingMode,
    setDemoMode,
    setUserInput,
    hydrateMission,
    resetMission: resetLocalMission,
  } = useMission();

  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [lastError, setLastError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const shouldReconnectRef = useRef(true);

  const actions = useMemo(
    () => ({
      hydrateMission,
      setMissionStatus,
      updateAgent,
      addTimelineEntry,
      updateTimelineEntry,
      setCall,
      addCallTranscript,
      addSMS,
      setSummary,
      addReasoning,
      addMemory,
      addSkill,
      addAdaptation,
      addMasteryUpdate,
      addRiskSignal,
      setKnowledgeTwin,
      setTrainingMode,
      setDemoMode,
      setUserInput,
    }),
    [
      addAdaptation,
      addCallTranscript,
      addMemory,
      addReasoning,
      addSMS,
      addSkill,
      addTimelineEntry,
      addMasteryUpdate,
      addRiskSignal,
      setKnowledgeTwin,
      hydrateMission,
      setCall,
      setDemoMode,
      setMissionStatus,
      setSummary,
      setTrainingMode,
      setUserInput,
      updateAgent,
      updateTimelineEntry,
    ],
  );

  const handleMissionEvent = useCallback(
    (event: MissionEvent) => {
      if (event.type === "agent_update") {
        const nextStatus = event.payload.updates.status;
        if (nextStatus && nextStatus !== "idle") {
          playAgentActivate();
        }
      }

      if (event.type === "mission_status") {
        if (event.payload.status === "live") {
          resumeAudio();
          startAmbient();
        }
        if (event.payload.status === "completed") {
          playMissionComplete();
          window.setTimeout(() => stopAmbient(), 1500);
        }
      }

      if (event.type === "call_update") {
        if (event.payload.status === "ringing") {
          playPhoneRing();
        }
        if (event.payload.status === "connected") {
          playCallConnect();
        }
        if (event.payload.status === "ended") {
          playCallEnd();
        }
      }

      if (event.type === "sms") {
        playSMS();
      }

      if (event.type === "error") {
        setLastError(event.payload.message);
        toast.error(event.payload.message);
      }

      applyMissionEvent(event, actions);
    },
    [actions],
  );

  const fetchCurrentMissionState = useCallback(async () => {
    try {
      const response = await fetch(getMissionApiUrl("/api/mission/state"));
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { state?: unknown };
      if (payload.state) {
        handleMissionEvent({
          type: "snapshot",
          payload: payload.state as Parameters<typeof hydrateMission>[0],
          ts: new Date().toISOString(),
        });
      }
    } catch {
      // Ignore bootstrap failures until the backend is available.
    }
  }, [handleMissionEvent, hydrateMission]);

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, []);

  const connectMissionStream = useCallback(() => {
    const existing = socketRef.current;
    if (existing && (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)) {
      return;
    }

    clearReconnectTimer();
    setConnectionState("connecting");

    const socket = new WebSocket(getMissionWsUrl());
    socketRef.current = socket;

    socket.onopen = () => {
      setConnectionState("connected");
      setLastError(null);
      void fetchCurrentMissionState();
    };

    socket.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as MissionEvent;
        handleMissionEvent(event);
      } catch {
        setLastError("Received an invalid mission event payload.");
      }
    };

    socket.onerror = () => {
      setLastError("Mission stream unavailable.");
    };

    socket.onclose = () => {
      if (socketRef.current === socket) {
        socketRef.current = null;
      }

      setConnectionState("disconnected");

      if (!shouldReconnectRef.current) {
        return;
      }

      clearReconnectTimer();
      reconnectTimerRef.current = window.setTimeout(() => {
        connectMissionStream();
      }, 1000);
    };
  }, [clearReconnectTimer, fetchCurrentMissionState, handleMissionEvent]);

  useEffect(() => {
    shouldReconnectRef.current = true;
    connectMissionStream();

    return () => {
      shouldReconnectRef.current = false;
      clearReconnectTimer();
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [clearReconnectTimer, connectMissionStream]);

  const postJson = useCallback(async (path: string, body?: Record<string, unknown>) => {
    const response = await fetch(getMissionApiUrl(path), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Request failed: ${response.status}`);
    }

    return response.json().catch(() => ({}));
  }, []);

  const startMission = useCallback(
    async (missionText: string, mode: MissionMode) => {
      const trimmedMission = missionText.trim();
      if (!trimmedMission) {
        toast.error("Enter a study mission before starting.");
        return;
      }

      resumeAudio();
      connectMissionStream();
      setUserInput(trimmedMission);
      setDemoMode(mode === "simulation");

      try {
        await postJson("/api/mission/start", {
          missionText: trimmedMission,
          mode,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to start mission.";
        setLastError(message);
        toast.error(message);
      }
    },
    [connectMissionStream, postJson, setDemoMode, setUserInput],
  );

  const interruptMission = useCallback(
    async (command: string) => {
      const trimmedCommand = command.trim();
      if (!trimmedCommand) {
        return;
      }

      try {
        await postJson("/api/mission/interrupt", { command: trimmedCommand });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to interrupt mission.";
        setLastError(message);
        toast.error(message);
      }
    },
    [postJson],
  );

  const resetMission = useCallback(async () => {
    try {
      await postJson("/api/mission/reset");
    } catch {
      // Fall back to a local reset when the backend is unavailable.
    }

    stopAmbient();
    resetLocalMission();
  }, [postJson, resetLocalMission]);

  return {
    connectionState,
    lastError,
    startMission,
    interruptMission,
    resetMission,
    connectMissionStream,
  };
}
