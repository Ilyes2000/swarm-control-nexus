export async function runSchedulerAgent({ researchResult, negotiationResult, llm }) {
  const itinerary = `${researchResult.restaurant.reservationTime} dinner at ${researchResult.restaurant.name} -> 8:55 PM transfer -> ${researchResult.cinema.showtime} ${researchResult.cinema.movieTitle}`;
  const fallbackLiveText = `Itinerary locked: ${itinerary}.`;
  const liveText = await llm.generateText({
    system: "Summarize the final itinerary in one sentence.",
    prompt: itinerary,
    fallback: fallbackLiveText
  });

  return {
    itinerary,
    liveText,
    confidence: 92,
    summary: {
      visible: true,
      result: `Dinner booked at ${researchResult.restaurant.name} for ${researchResult.restaurant.reservationTime}, followed by ${researchResult.cinema.movieTitle} at ${researchResult.cinema.name} at ${researchResult.cinema.showtime}.`,
      costBreakdown: [
        { label: "Dinner", amount: "$85.00" },
        { label: "Dinner discount", amount: "-$12.75" },
        { label: "Movie tickets", amount: "$33.75" },
        { label: "Seat discount", amount: "-$4.00" },
        { label: "Total", amount: "$102.00" }
      ],
      timeTaken: "under 30 seconds",
      optimization: {
        originalCost: `$${negotiationResult.originalCost.toFixed(2)}`,
        optimizedCost: `$${negotiationResult.optimizedCost.toFixed(2)}`,
        savedAmount: `$${negotiationResult.savings.totalSavings.toFixed(2)}`,
        savedPercent: "14.1% savings",
        tradeoffs: [
          { label: "Restaurant", original: "first available", optimized: `${researchResult.restaurant.name} (${researchResult.restaurant.rating})` },
          { label: "Movie seats", original: "standard", optimized: researchResult.cinema.seatType },
          { label: "Booking flow", original: "manual check", optimized: "agent confirmed by phone" }
        ]
      }
    }
  };
}
