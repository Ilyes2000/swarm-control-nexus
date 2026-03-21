import { buildStudyProfile } from "./study-utils.js";

export async function runSolverAgent({ missionText, llm, context = {} }) {
  const profile = buildStudyProfile(missionText, context);
  const recentAttempt = profile.recentAttempts[0] ?? null;
  const fallbackLiveText = `Scored a sample attempt, caught the first error early, and proposed a safer method.`;
  const liveText = await llm.generateText({
    system: "Summarize a math problem-solving diagnosis in one sentence.",
    prompt: `Mission: ${missionText}
Sample problem: ${profile.sampleProblem}
Recent first error: ${recentAttempt?.firstError ?? "none recorded"}
Weakest area: ${profile.focusAreas[0]}`,
    fallback: fallbackLiveText
  });

  const attemptScore = recentAttempt?.score ?? Math.max(52, Math.min(88, profile.readinessBaseline + 10));
  const firstError = recentAttempt?.firstError ?? "The setup was valid, but the student switched methods mid-solution and dropped a sign.";

  return {
    liveText,
    confidence: 89,
    attemptScore,
    firstError,
    alternativeMethod: `Use a cleaner ${profile.focusAreas[0].toLowerCase()} route before expanding anything.`,
    mistakePatterns: [
      firstError,
      "Skipped the structure-identification step",
      "Did not verify the final answer against the original problem"
    ]
  };
}
