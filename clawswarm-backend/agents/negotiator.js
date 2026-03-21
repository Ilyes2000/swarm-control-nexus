export async function runNegotiatorAgent({ researchResult, llm, merchantOffer }) {
  // Merchant offer evaluation path
  if (merchantOffer) {
    return evaluateMerchantOffer({ merchantOffer, llm });
  }

  // Original pricing optimization path
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

async function evaluateMerchantOffer({ merchantOffer, llm }) {
  const { offerType } = merchantOffer;

  if (offerType === "accept") {
    return {
      action: "accept",
      liveText: `${merchantOffer.venueName} confirmed the booking as requested.`,
      confidence: 98,
      reasoning: "Merchant accepted the original request — no negotiation needed."
    };
  }

  if (offerType === "offpeak") {
    const fallback = `Accepted off-peak offer from ${merchantOffer.venueName} — saves money and avoids crowding.`;
    const liveText = await llm.generateText({
      system: "Summarize why accepting an off-peak restaurant offer is a good deal, in one sentence.",
      prompt: `Venue: ${merchantOffer.venueName}\nOffer: ${merchantOffer.merchantResponse}`,
      fallback
    });
    return {
      action: "accept",
      liveText,
      confidence: 91,
      reasoning: "Off-peak slots reduce wait times, often include perks, and save money — a clear win."
    };
  }

  if (offerType === "promo") {
    const fallback = `Accepted promo from ${merchantOffer.venueName} — clear savings with code ${merchantOffer.details?.promoCode || "applied"}.`;
    const liveText = await llm.generateText({
      system: "Summarize why accepting a restaurant promo code is beneficial, in one sentence.",
      prompt: `Venue: ${merchantOffer.venueName}\nOffer: ${merchantOffer.merchantResponse}`,
      fallback
    });
    return {
      action: "accept",
      liveText,
      confidence: 93,
      reasoning: "Promo codes provide direct savings without any change to the booking quality."
    };
  }

  if (offerType === "counter") {
    const fallback = `Evaluating counter-offer from ${merchantOffer.venueName}: ${merchantOffer.merchantResponse}`;
    const liveText = await llm.generateText({
      system: "Evaluate whether a restaurant's counter-offer (different time slot) is acceptable. Respond in one sentence.",
      prompt: `Venue: ${merchantOffer.venueName}\nCounter: ${merchantOffer.merchantResponse}\nOriginal: ${merchantOffer.originalRequest}`,
      fallback
    });
    // Accept counters with discounts attached
    const hasDiscount = merchantOffer.details?.discount;
    return {
      action: hasDiscount ? "accept" : "counter",
      liveText,
      confidence: hasDiscount ? 85 : 72,
      reasoning: hasDiscount
        ? "The counter-offer includes a discount that compensates for the time change."
        : "The counter-offer changes the time without additional incentive — pushing back."
    };
  }

  return {
    action: "accept",
    liveText: `Proceeding with ${merchantOffer.venueName}'s response.`,
    confidence: 80,
    reasoning: "Unrecognized offer type — defaulting to accept to avoid blocking the mission."
  };
}
