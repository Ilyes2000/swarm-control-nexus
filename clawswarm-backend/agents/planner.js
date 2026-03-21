import { buildStudyProfile, createSessionSlots } from "./study-utils.js";

function createTaskPlan(profile) {
  const weakArea = profile.focusAreas[0] ?? profile.topic;
  const secondArea = profile.focusAreas[1] ?? profile.focusAreas[0] ?? profile.topic;
  const thirdArea = profile.focusAreas[2] ?? secondArea;
  const relatedGoal = profile.relatedGoals[0]?.title;

  return [
    {
      title: `Run a baseline diagnostic on ${weakArea}`,
      type: "diagnostic",
      durationMin: profile.rescueMode ? 20 : 25,
      confidenceWeight: "high",
      dueLabel: "Today",
      priorityScore: 96,
      difficultyScore: 35
    },
    {
      title: `Review worked examples for ${secondArea}`,
      type: "learn",
      durationMin: 30,
      confidenceWeight: "medium",
      dueLabel: profile.rescueMode ? "Tonight" : "Tomorrow",
      priorityScore: 84,
      difficultyScore: 44
    },
    {
      title: `Solve 6 exam-style questions on ${weakArea}`,
      type: "practice",
      durationMin: profile.rescueMode ? 45 : 50,
      confidenceWeight: "high",
      dueLabel: profile.rescueMode ? "Before exam" : "This week",
      priorityScore: 92,
      difficultyScore: 68
    },
    {
      title: `Build flashcards for ${thirdArea}`,
      type: "revision",
      durationMin: 20,
      confidenceWeight: "medium",
      dueLabel: "Tomorrow",
      priorityScore: 78,
      difficultyScore: 36
    },
    {
      title: relatedGoal ? `Check progress against ${relatedGoal}` : "Run a confidence check and replan the week",
      type: "reflection",
      durationMin: 10,
      confidenceWeight: "low",
      dueLabel: "After final session",
      priorityScore: 70,
      difficultyScore: 18
    }
  ];
}

export async function runPlannerAgent({ missionText, llm, context = {} }) {
  const profile = buildStudyProfile(missionText, context);
  const fallbackLiveText = `Built a ${profile.sessionMode} plan for ${profile.topic}: diagnostics first, targeted practice second, revision third.`;
  const liveText = await llm.generateText({
    system: "Produce one concise study-planning sentence for a student mission.",
    prompt: `Mission: ${missionText}
Subject: ${profile.subject}
Focus Areas: ${profile.focusAreas.join(", ")}
Energy Pattern: ${profile.energyPattern}
Weakest Nodes: ${profile.weakestNodes.map((node) => `${node.label} (${node.mastery}%)`).join(", ") || "n/a"}
Calendar Conflicts: ${profile.calendarConflicts.length}`,
    fallback: fallbackLiveText
  });

  const tasks = createTaskPlan(profile);
  const sessions = createSessionSlots({
    urgencyDays: profile.urgencyDays,
    rescueMode: profile.rescueMode,
    energyPattern: profile.energyPattern,
    calendarConflicts: profile.calendarConflicts
  }).map((slot, index) => ({
    ...slot,
    title: `${index === 0 ? "Warm start" : index === 1 ? "Core sprint" : "Retention loop"} • ${profile.focusAreas[index] ?? profile.topic}`
  }));

  const reasoningParts = [
    `The plan starts with evidence gathering to verify whether ${profile.focusAreas[0]} is truly the main blocker.`,
    `Deep work is protected for ${profile.energyPattern.toLowerCase()}.`,
    profile.calendarConflicts.length ? "Session duration was softened because the calendar already contains a study conflict." : "No blocking calendar conflict was detected for the primary sprint.",
    profile.activeRisk ? `The first session is confidence-safe because the leading risk signal is ${profile.activeRisk.title.toLowerCase()}.` : "No elevated support signal is currently blocking a standard progression."
  ];

  return {
    ...profile,
    tasks,
    sessions,
    liveText,
    reasoning: reasoningParts.join(" "),
    confidence: profile.rescueMode ? 91 : 94
  };
}
