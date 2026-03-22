function getOptimizationProfile(researchResult) {
  const workflow = researchResult.workflow || researchResult.missionType || "mixed";
  const primaryTarget = researchResult.bookingTargets?.[0];
  const secondaryTarget = researchResult.bookingTargets?.[1];

  const profiles = {
    restaurant: {
      fallbackLiveText: `Applied the best available offer to ${primaryTarget?.venueName || "the selected restaurant"}.`,
      prompt: `Workflow: restaurant\nVenue: ${primaryTarget?.venueName || "restaurant"}\nTime: ${primaryTarget?.timeLabel || "TBD"}`,
      savings: { totalSavings: 16.75 },
      reasoning: "The dining promotion reduces the largest expected cost without changing the requested time or venue quality.",
      originalCost: 118.75,
      optimizedCost: 102,
    },
    dinner_and_movie: {
      fallbackLiveText: `Applied the best dining and ticket offers for ${primaryTarget?.venueName || "the restaurant"} and ${secondaryTarget?.venueName || "the cinema"}.`,
      prompt: `Workflow: dinner_and_movie\nPrimary: ${primaryTarget?.venueName || "restaurant"}\nSecondary: ${secondaryTarget?.venueName || "cinema"}`,
      savings: { totalSavings: 16.75 },
      reasoning: "Dining and ticket discounts stack cleanly while preserving the preferred itinerary.",
      originalCost: 118.75,
      optimizedCost: 102,
    },
    travel_dining: {
      fallbackLiveText: `Balanced the room rate at ${primaryTarget?.venueName || "the hotel"} with the meal plan at ${secondaryTarget?.venueName || "the restaurant"}.`,
      prompt: `Workflow: travel_dining\nHotel: ${primaryTarget?.venueName || "hotel"}\nDining: ${secondaryTarget?.venueName || "restaurant"}`,
      savings: { totalSavings: 18 },
      reasoning: "The hotel rate carries the biggest cost, so keeping dining efficient preserves the overall travel budget.",
      originalCost: 274,
      optimizedCost: 256,
    },
    hotel: {
      fallbackLiveText: `Optimized the room selection at ${primaryTarget?.venueName || "the hotel"} without changing check-in timing.`,
      prompt: `Workflow: hotel\nHotel: ${primaryTarget?.venueName || "hotel"}\nCheck-in: ${primaryTarget?.timeLabel || "TBD"}`,
      savings: { totalSavings: 20 },
      reasoning: "A better room rate beats upselling while keeping the same check-in window and location.",
      originalCost: 269,
      optimizedCost: 249,
    },
    travel: {
      fallbackLiveText: `Kept the best fare on ${primaryTarget?.titleLabel || primaryTarget?.venueName || "the selected itinerary"} while preserving departure timing.`,
      prompt: `Workflow: travel\nCarrier: ${primaryTarget?.venueName || "carrier"}\nFlight: ${primaryTarget?.titleLabel || "selected flight"}`,
      savings: { totalSavings: 24.5 },
      reasoning: "The selected fare preserves the departure window while avoiding a more expensive change fee path.",
      originalCost: 356,
      optimizedCost: 331.5,
    },
    entertainment: {
      fallbackLiveText: `Locked the best ticket path for ${primaryTarget?.titleLabel || "the selected show"} at ${primaryTarget?.venueName || "the venue"}.`,
      prompt: `Workflow: entertainment\nVenue: ${primaryTarget?.venueName || "venue"}\nShow: ${primaryTarget?.titleLabel || "selected show"}`,
      savings: { totalSavings: 18 },
      reasoning: "Ticket optimization preserves the preferred showtime while reducing booking-fee overhead.",
      originalCost: 315.5,
      optimizedCost: 297.5,
    },
    shopping: {
      fallbackLiveText: `No price optimization was needed for the shopping support request.`,
      prompt: `Workflow: shopping\nVenue: ${primaryTarget?.venueName || "store"}`,
      savings: { totalSavings: 0 },
      reasoning: "This workflow is informational, so optimization is about convenience rather than direct savings.",
      originalCost: 0,
      optimizedCost: 0,
    },
    spa: {
      fallbackLiveText: `Applied the best spa pricing available at ${primaryTarget?.venueName || "the selected spa"}.`,
      prompt: `Workflow: spa\nVenue: ${primaryTarget?.venueName || "spa"}\nService: ${primaryTarget?.titleLabel || "selected service"}`,
      savings: { totalSavings: 15 },
      reasoning: "The selected spa pricing keeps the service window intact while avoiding higher premium-package pricing.",
      originalCost: 237,
      optimizedCost: 222,
    },
    sport: {
      fallbackLiveText: `Kept the best available rate for ${primaryTarget?.titleLabel || "the selected session"} at ${primaryTarget?.venueName || "the gym"}.`,
      prompt: `Workflow: sport\nVenue: ${primaryTarget?.venueName || "gym"}\nSession: ${primaryTarget?.titleLabel || "selected session"}`,
      savings: { totalSavings: 0 },
      reasoning: "The selected fitness slot already represents the best available rate without time changes.",
      originalCost: 95,
      optimizedCost: 95,
    },
    medical: {
      fallbackLiveText: `Confirmed the best scheduling path for ${primaryTarget?.venueName || "the clinic"}.`,
      prompt: `Workflow: medical\nClinic: ${primaryTarget?.venueName || "clinic"}\nSpecialty: ${primaryTarget?.titleLabel || "appointment"}`,
      savings: { totalSavings: 0 },
      reasoning: "Medical workflows prioritize appointment fit and certainty over price optimization.",
      originalCost: 0,
      optimizedCost: 0,
    },
  };

  return profiles[workflow] || {
    fallbackLiveText: `Optimized the selected mission path for ${primaryTarget?.venueName || "the chosen venue"}.`,
    prompt: `Workflow: ${workflow}\nPrimary: ${primaryTarget?.venueName || "selected venue"}`,
    savings: { totalSavings: 0 },
    reasoning: "The system preserved the highest-confidence path for the selected workflow.",
    originalCost: primaryTarget?.estimatedTotalCost || 0,
    optimizedCost: primaryTarget?.estimatedTotalCost || 0,
  };
}

export async function runNegotiatorAgent({ researchResult, llm, merchantOffer }) {
  if (merchantOffer) {
    return evaluateMerchantOffer({ merchantOffer, llm });
  }

  const profile = getOptimizationProfile(researchResult);
  const liveText = await llm.generateText({
    system: "Summarize the pricing optimization in one sentence.",
    prompt: profile.prompt,
    fallback: profile.fallbackLiveText,
  });

  return {
    liveText,
    confidence: 96,
    savings: profile.savings,
    reasoning: profile.reasoning,
    originalCost: profile.originalCost,
    optimizedCost: profile.optimizedCost,
  };
}

async function evaluateMerchantOffer({ merchantOffer, llm }) {
  const { offerType } = merchantOffer;

  if (offerType === "accept") {
    return {
      action: "accept",
      liveText: `${merchantOffer.venueName} confirmed the booking as requested.`,
      confidence: 98,
      reasoning: "Merchant accepted the original request - no negotiation needed.",
    };
  }

  if (offerType === "offpeak") {
    const fallback = `Accepted off-peak offer from ${merchantOffer.venueName} - saves money and avoids crowding.`;
    const liveText = await llm.generateText({
      system: "Summarize why accepting an off-peak offer is a good deal, in one sentence.",
      prompt: `Venue: ${merchantOffer.venueName}\nOffer: ${merchantOffer.merchantResponse}`,
      fallback,
    });
    return {
      action: "accept",
      liveText,
      confidence: 91,
      reasoning: "Off-peak slots reduce wait times, often include perks, and save money - a clear win.",
    };
  }

  if (offerType === "promo") {
    const fallback = `Accepted promo from ${merchantOffer.venueName} - clear savings with code ${merchantOffer.details?.promoCode || "applied"}.`;
    const liveText = await llm.generateText({
      system: "Summarize why accepting a promo code is beneficial, in one sentence.",
      prompt: `Venue: ${merchantOffer.venueName}\nOffer: ${merchantOffer.merchantResponse}`,
      fallback,
    });
    return {
      action: "accept",
      liveText,
      confidence: 93,
      reasoning: "Promo codes provide direct savings without any change to the booking quality.",
    };
  }

  if (offerType === "counter") {
    const fallback = `Evaluating counter-offer from ${merchantOffer.venueName}: ${merchantOffer.merchantResponse}`;
    const liveText = await llm.generateText({
      system: "Evaluate whether a merchant counter-offer is acceptable. Respond in one sentence.",
      prompt: `Venue: ${merchantOffer.venueName}\nCounter: ${merchantOffer.merchantResponse}\nOriginal: ${merchantOffer.originalRequest}`,
      fallback,
    });
    const hasDiscount = merchantOffer.details?.discount;
    return {
      action: hasDiscount ? "accept" : "counter",
      liveText,
      confidence: hasDiscount ? 85 : 72,
      reasoning: hasDiscount
        ? "The counter-offer includes a discount that compensates for the time or condition change."
        : "The counter-offer changes the original request without enough incentive, so the system should push back.",
    };
  }

  return {
    action: "accept",
    liveText: `Proceeding with ${merchantOffer.venueName}'s response.`,
    confidence: 80,
    reasoning: "Unrecognized offer type - defaulting to accept to avoid blocking the mission.",
  };
}
