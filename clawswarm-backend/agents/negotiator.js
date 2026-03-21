export async function runNegotiatorAgent({ researchResult, llm }) {
  const fallbackLiveText = `Applied NIGHT15 to dinner and found a two-dollar seat discount for ${researchResult.cinema.name}.`;
  const liveText = await llm.generateText({
    system: "Summarize the pricing optimization in one sentence.",
    prompt: `Restaurant: ${researchResult.restaurant.name}\nCinema: ${researchResult.cinema.name}`,
    fallback: fallbackLiveText
  });

  return {
    liveText,
    confidence: 96,
    savings: {
      dinnerDiscount: 12.75,
      movieDiscount: 4,
      totalSavings: 16.75
    },
    reasoning: "The dinner promotion reduces the largest cost center, and the movie discount stacks cleanly without changing showtime quality.",
    originalCost: 118.75,
    optimizedCost: 102
  };
}
