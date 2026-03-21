import { buildStudyProfile } from "./study-utils.js";

export async function runCoachAgent({ missionText, llm, plannerResult, solverResult, revisionResult, context = {} }) {
  const profile = buildStudyProfile(missionText, context);
  const fallbackLiveText = "Converted the plan into nudges, guardrails, and an exam-readiness trajectory.";
  const liveText = await llm.generateText({
    system: "Summarize an academic coaching plan in one sentence.",
    prompt: `Mission: ${missionText}
Readiness baseline: ${profile.readinessBaseline}
Attempt score: ${solverResult.attemptScore}
Risk signal: ${profile.activeRisk?.title ?? "none"}
Calendar conflicts: ${profile.calendarConflicts.length}`,
    fallback: fallbackLiveText
  });

  const readinessScore = Math.max(
    profile.readinessBaseline,
    Math.min(96, Math.round((solverResult.attemptScore + revisionResult.masteryUpdates[0].mastery + 18) / 2))
  );

  const riskLevel = readinessScore >= 78 ? "low" : readinessScore >= 60 ? "moderate" : "high";
  const highestLiftSession = plannerResult.sessions[1]?.label ?? plannerResult.sessions[0]?.label ?? "next session";

  return {
    liveText,
    confidence: 92,
    readinessScore,
    riskLevel,
    studyMetrics: [
      { label: "Readiness", value: `${readinessScore}%`, tone: readinessScore >= 75 ? "success" : "warning" },
      { label: "Planned", value: `${plannerResult.sessions.length} sessions`, tone: "info" },
      { label: "Revision", value: `${revisionResult.revisionQueue.length} loops`, tone: "info" },
      { label: "Error Risk", value: solverResult.mistakePatterns[0], tone: "warning" }
    ],
    nextActions: [
      `Finish the ${plannerResult.tasks[0].title.toLowerCase()} before the first deep-work block.`,
      `Use the hint ladder only after narrating the setup step aloud.`,
      profile.activeRisk
        ? `Protect the next block against ${profile.activeRisk.title.toLowerCase()} by starting with a 5-minute warm-up.`
        : "Run a 10-minute confidence check after the second session and trigger auto-replan if confidence stays low."
    ],
    nudges: [
      { text: `You are one high-quality session away from stabilizing ${plannerResult.focusAreas[0].toLowerCase()}.`, channel: "coach" },
      { text: `Protect the ${highestLiftSession} session. That block has the highest readiness lift.`, channel: "coach" }
    ],
    riskSignal: {
      id: "risk-focus-drift",
      level: riskLevel,
      title: riskLevel === "low" ? "Focus load is manageable" : "Focus drift risk detected",
      message: riskLevel === "low"
        ? "Current workload fits the student's energy profile if the first diagnostic lands on time."
        : "The student is likely to drift unless the first session starts with a short win and confidence check-in.",
      nextAction: riskLevel === "low" ? "Keep the first sprint intact." : "Start with a 5-minute starter task, then relaunch the full sprint."
    }
  };
}
