import { buildStudyProfile } from "./study-utils.js";

export async function runRevisionAgent({ missionText, llm, context = {} }) {
  const profile = buildStudyProfile(missionText, context);
  const fallbackLiveText = `Scheduled spaced review, mixed retrieval, and a weakest-skill queue for ${profile.topic}.`;
  const liveText = await llm.generateText({
    system: "Summarize a revision strategy in one sentence.",
    prompt: `Mission: ${missionText}
Focus Areas: ${profile.focusAreas.join(", ")}
Weakest Nodes: ${profile.weakestNodes.map((node) => `${node.label} (${node.mastery}%)`).join(", ") || "n/a"}`,
    fallback: fallbackLiveText
  });

  const masteryUpdates = profile.knowledgeTwin.map((node, index) => ({
    id: node.id ?? `mastery-${index + 1}`,
    topic: node.label,
    mastery: Math.min(96, node.mastery + (index % 2 === 0 ? 8 : 5)),
    confidence: Math.min(94, node.confidence + 7),
    trend: index % 2 === 0 ? "up" : "steady",
    timestamp: new Date().toISOString()
  }));

  return {
    liveText,
    confidence: 94,
    revisionQueue: [
      { title: `${profile.focusAreas[0]} flashcards`, mode: "spaced repetition", count: 12 },
      { title: `${profile.focusAreas[1]} mixed drills`, mode: "timed practice", count: 8 },
      { title: `${profile.focusAreas[2]} oral recall`, mode: "reflection", count: 5 }
    ],
    flashcards: [
      `What clue tells you ${profile.focusAreas[0].toLowerCase()} is the right tool?`,
      `State the fastest verification step after solving a ${profile.topic.toLowerCase()} question.`,
      `Name the most common mistake in ${profile.focusAreas[1].toLowerCase()}.`
    ],
    masteryUpdates,
    knowledgeTwin: profile.knowledgeTwin
  };
}
