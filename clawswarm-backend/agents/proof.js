import { buildStudyProfile } from "./study-utils.js";

export async function runProofAgent({ missionText, llm }) {
  const profile = buildStudyProfile(missionText);
  const fallbackLiveText = `Built a proof and justification checklist so every step stays defensible.`;
  const liveText = await llm.generateText({
    system: "Summarize a proof or justification strategy in one sentence.",
    prompt: `Mission: ${missionText}\nProof Track: ${profile.proofTrack}`,
    fallback: fallbackLiveText
  });

  return {
    liveText,
    confidence: 87,
    checklist: [
      "State the givens and target clearly.",
      "Name the theorem or property before using it.",
      "Show why the transformation or inference is valid.",
      "Close with a sentence that links the result back to the question."
    ],
    reasoning: profile.proofTrack
  };
}
