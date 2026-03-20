export async function runPlannerAgent({ missionText, llm }) {
  const fallbackLiveText = "Created task graph: research venues, book dinner, secure movie seats, optimize price, build itinerary.";
  const prompt = [
    "You are the ClawSwarm planner agent.",
    "Summarize the plan for this mission in one compact sentence.",
    `Mission: ${missionText}`
  ].join("\n");

  const liveText = await llm.generateText({
    system: "Produce one concise operational planning sentence.",
    prompt,
    fallback: fallbackLiveText
  });

  return {
    tasks: [
      "Research restaurants and movie listings",
      "Call restaurant for reservation",
      "Call cinema for best available seats",
      "Compare total cost and discounts",
      "Build final itinerary"
    ],
    liveText,
    reasoning: "Dinner timing should anchor the evening. Research has to happen before calls, and price optimization should only run after venue availability is confirmed.",
    confidence: 94
  };
}
