import { buildStudyProfile } from "./study-utils.js";

export async function runTutorAgent({ missionText, llm }) {
  const profile = buildStudyProfile(missionText);
  const fallbackLiveText = `Explained ${profile.topic} with intuitive, formal, and exam-style framing.`;
  const liveText = await llm.generateText({
    system: "Summarize a tutoring strategy in one sentence.",
    prompt: `Mission: ${missionText}\nTopic: ${profile.topic}\nFocus: ${profile.focusAreas.join(", ")}`,
    fallback: fallbackLiveText
  });

  return {
    liveText,
    confidence: 93,
    lessonModes: ["intuitive", "formal", "exam-style"],
    conceptPack: [
      `${profile.focusAreas[0]} explained from first principles.`,
      `Common shortcut and trap for ${profile.focusAreas[1]}.`,
      `A quick recall anchor for ${profile.focusAreas[2]}.`
    ],
    hints: [
      `Start by naming the structure of the problem before manipulating symbols.`,
      `Check whether ${profile.focusAreas[0].toLowerCase()} gives a faster route than raw expansion.`,
      `At the end, verify the result against the graph or context.`
    ],
    transcript: [
      { speaker: "Tutor Agent", text: `Let's anchor ${profile.topic} in one idea you can reuse under pressure.` },
      { speaker: "Student Workspace", text: "I keep mixing up the setup step and the solving step." },
      { speaker: "Tutor Agent", text: `Then we separate them: identify the structure first, then choose the shortest valid method for ${profile.focusAreas[0].toLowerCase()}.` },
      { speaker: "Student Workspace", text: "Can you show me how that looks on an exam-style question?" },
      { speaker: "Tutor Agent", text: `Yes. We solve one example, then I will fade support and ask you to narrate the first step yourself.` }
    ]
  };
}
