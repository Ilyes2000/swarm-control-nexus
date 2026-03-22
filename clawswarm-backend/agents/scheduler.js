function buildLegacyTarget(researchResult, workflow, venue, role) {
  if (!venue) {
    return null;
  }
  if (workflow === "hotel") {
    return {
      workflow: "hotel",
      role,
      venueName: venue.name,
      titleLabel: venue.roomType || "selected room",
      timeLabel: venue.checkIn || "TBD",
      estimatedCostLabel: venue.pricePerNight || "$249.00",
      estimatedTotalCost: 249,
    };
  }
  if (workflow === "travel") {
    return {
      workflow: "travel",
      role,
      venueName: venue.name,
      titleLabel: venue.flightNumber || venue.name,
      timeLabel: venue.departure || "TBD",
      estimatedCostLabel: venue.price || "$289.00",
      estimatedTotalCost: 289,
    };
  }
  if (workflow === "entertainment") {
    return {
      workflow: "entertainment",
      role,
      venueName: venue.name,
      titleLabel: venue.showTitle || venue.movieTitle || "selected show",
      timeLabel: venue.showtime || "TBD",
      estimatedCostLabel: venue.ticketPrice || "$297.50",
      estimatedTotalCost: 297.5,
    };
  }
  if (workflow === "restaurant") {
    return {
      workflow: "restaurant",
      role,
      venueName: venue.name,
      titleLabel: null,
      timeLabel: venue.reservationTime || "TBD",
      estimatedCostLabel: "$85.00",
      estimatedTotalCost: 85,
    };
  }
  if (workflow === "spa") {
    return {
      workflow: "spa",
      role,
      venueName: venue.name,
      titleLabel: venue.services?.[0] || "Treatment",
      timeLabel: venue.appointmentTime || "TBD",
      estimatedCostLabel: venue.price || "$185.00",
      estimatedTotalCost: 185,
    };
  }
  if (workflow === "sport") {
    return {
      workflow: "sport",
      role,
      venueName: venue.name,
      titleLabel: venue.classType || "Session",
      timeLabel: venue.appointmentTime || "TBD",
      estimatedCostLabel: venue.price || "$95.00",
      estimatedTotalCost: 95,
    };
  }
  if (workflow === "medical") {
    return {
      workflow: "medical",
      role,
      venueName: venue.name,
      titleLabel: venue.specialty || "Appointment",
      timeLabel: venue.appointmentTime || "TBD",
      estimatedCostLabel: "Covered by insurance",
      estimatedTotalCost: 0,
    };
  }
  if (workflow === "dinner_and_movie") {
    const legacyWorkflow = role === "primary" ? "restaurant" : "cinema";
    return {
      workflow: legacyWorkflow,
      role,
      venueName: venue.name,
      titleLabel: venue.movieTitle || venue.showTitle || null,
      timeLabel: venue.reservationTime || venue.showtime || "TBD",
      estimatedCostLabel: role === "primary" ? "$85.00" : "$33.75",
      estimatedTotalCost: role === "primary" ? 85 : 33.75,
    };
  }
  return {
    workflow,
    role,
    venueName: venue.name,
    titleLabel: null,
    timeLabel: venue.appointmentTime || venue.showtime || venue.reservationTime || "TBD",
    estimatedCostLabel: "Quote needed",
    estimatedTotalCost: 0,
  };
}

function buildSchedulerProfile(researchResult, negotiationResult) {
  const workflow = researchResult.workflow || researchResult.missionType || "mixed";
  const targets =
    researchResult.bookingTargets && researchResult.bookingTargets.length > 0
      ? researchResult.bookingTargets
      : [
          buildLegacyTarget(researchResult, workflow, researchResult.primary || researchResult.restaurant, "primary"),
          buildLegacyTarget(researchResult, workflow, researchResult.secondary || researchResult.cinema, "secondary"),
        ].filter(Boolean);
  const primary = targets[0];
  const secondary = targets[1];
  const originalCost = negotiationResult.originalCost ?? primary?.estimatedTotalCost ?? 0;
  const optimizedCost = negotiationResult.optimizedCost ?? primary?.estimatedTotalCost ?? 0;
  const totalSavings = negotiationResult.savings?.totalSavings ?? Math.max(0, originalCost - optimizedCost);
  const savingsPct = originalCost > 0 ? `${((totalSavings / originalCost) * 100).toFixed(1)}% savings` : "0.0% savings";

  const profiles = {
    restaurant: {
      itinerary: `${primary?.timeLabel || "TBD"} reservation at ${primary?.venueName || "the restaurant"}`,
      result: `${primary?.venueName || "The restaurant"} at ${primary?.timeLabel || "TBD"} confirmed.`,
      costBreakdown: [
        { label: "Restaurant estimate", amount: "$85.00" },
        { label: "Total", amount: "$85.00" },
      ],
    },
    dinner_and_movie: {
      itinerary: `${primary?.timeLabel || "TBD"} reservation at ${primary?.venueName || "the restaurant"} -> ${secondary?.timeLabel || "TBD"} ${secondary?.titleLabel || "show"} at ${secondary?.venueName || "the cinema"}`,
      result: `${primary?.venueName || "The restaurant"} at ${primary?.timeLabel || "TBD"}, then ${secondary?.titleLabel || "the show"} at ${secondary?.venueName || "the cinema"} at ${secondary?.timeLabel || "TBD"}.`,
      costBreakdown: [
        { label: "Restaurant", amount: "$85.00" },
        { label: "Restaurant discount", amount: "-$12.75" },
        { label: "Ticket total", amount: "$33.75" },
        { label: "Ticket discount", amount: "-$4.00" },
        { label: "Total", amount: "$102.00" },
      ],
    },
    travel_dining: {
      itinerary: `${primary?.venueName || "Hotel"} check-in at ${primary?.timeLabel || "TBD"} -> ${secondary?.venueName || "restaurant"} at ${secondary?.timeLabel || "TBD"}`,
      result: `${primary?.venueName || "Hotel"} at ${primary?.timeLabel || "TBD"}, then ${secondary?.venueName || "restaurant"} at ${secondary?.timeLabel || "TBD"}.`,
      costBreakdown: [
        { label: "Hotel estimate", amount: "$189.00" },
        { label: "Dining estimate", amount: "$85.00" },
        { label: "Total", amount: "$274.00" },
      ],
    },
    hotel: {
      itinerary: `Check-in ${primary?.timeLabel || "TBD"} at ${primary?.venueName || "the hotel"} - ${primary?.titleLabel || "selected room"}`,
      result: `${primary?.venueName || "Hotel"} check-in secured for ${primary?.timeLabel || "TBD"}.`,
      costBreakdown: [
        { label: "Room rate", amount: "$249.00" },
        { label: "Taxes & fees", amount: "$35.00" },
        { label: "Total", amount: "$284.00" },
      ],
    },
    travel: {
      itinerary: `${primary?.titleLabel || "Selected flight"} departs ${primary?.timeLabel || "TBD"} with ${primary?.venueName || "the carrier"}`,
      result: `${primary?.titleLabel || "Flight"} booked with ${primary?.venueName || "the carrier"} for ${primary?.timeLabel || "TBD"}.`,
      costBreakdown: [
        { label: "Flight", amount: "$289.00" },
        { label: "Taxes", amount: "$42.50" },
        { label: "Total", amount: "$331.50" },
      ],
    },
    entertainment: {
      itinerary: `${primary?.titleLabel || "Selected show"} at ${primary?.timeLabel || "TBD"} - ${primary?.venueName || "the venue"}`,
      result: `Tickets booked for ${primary?.titleLabel || "the selected show"} at ${primary?.venueName || "the venue"} for ${primary?.timeLabel || "TBD"}.`,
      costBreakdown: [
        { label: "2 tickets", amount: "$145.00 x2" },
        { label: "Booking fee", amount: "$7.50" },
        { label: "Total", amount: "$297.50" },
      ],
    },
    shopping: {
      itinerary: `Visit ${primary?.venueName || "the store"} during ${primary?.timeLabel || "open hours"}`,
      result: `Shopping visit arranged at ${primary?.venueName || "the store"}.`,
      costBreakdown: [
        { label: "Service", amount: "Free" },
        { label: "Estimated spend", amount: "Budget dependent" },
      ],
    },
    spa: {
      itinerary: `${primary?.titleLabel || "Treatment"} at ${primary?.timeLabel || "TBD"} - ${primary?.venueName || "the spa"}`,
      result: `Spa appointment booked at ${primary?.venueName || "the spa"} for ${primary?.timeLabel || "TBD"}.`,
      costBreakdown: [
        { label: "Treatment", amount: "$185.00" },
        { label: "Gratuity (20%)", amount: "$37.00" },
        { label: "Total", amount: "$222.00" },
      ],
    },
    sport: {
      itinerary: `${primary?.titleLabel || "Session"} at ${primary?.timeLabel || "TBD"} - ${primary?.venueName || "the venue"}`,
      result: `${primary?.titleLabel || "Session"} booked at ${primary?.venueName || "the venue"} for ${primary?.timeLabel || "TBD"}.`,
      costBreakdown: [
        { label: "Session", amount: "$95.00" },
        { label: "Total", amount: "$95.00" },
      ],
    },
    medical: {
      itinerary: `${primary?.titleLabel || "Appointment"} at ${primary?.timeLabel || "TBD"} - ${primary?.venueName || "the clinic"}`,
      result: `Appointment booked at ${primary?.venueName || "the clinic"} for ${primary?.timeLabel || "TBD"}.`,
      costBreakdown: [
        { label: "Consultation", amount: "Covered by insurance" },
      ],
    },
  };

  const baseProfile = profiles[workflow] || {
    itinerary: `${primary?.venueName || "Selected venue"} at ${primary?.timeLabel || "TBD"}`,
    result: `${primary?.venueName || "Selected venue"} confirmed.`,
    costBreakdown: [{ label: "Estimated booking", amount: primary?.estimatedCostLabel || "Quote needed" }],
  };

  return {
    ...baseProfile,
    optimization: {
      originalCost: `$${originalCost.toFixed(2)}`,
      optimizedCost: `$${optimizedCost.toFixed(2)}`,
      savedAmount: `$${totalSavings.toFixed(2)}`,
      savedPercent: savingsPct,
      tradeoffs: [
        { label: "Primary target", original: "first available", optimized: primary?.venueName || "selected venue" },
        { label: "Booking flow", original: "manual", optimized: "agent confirmed" },
        { label: "Price", original: `$${originalCost.toFixed(2)}`, optimized: `$${optimizedCost.toFixed(2)}` },
      ],
    },
  };
}

export async function runSchedulerAgent({ researchResult, negotiationResult, llm }) {
  const profile = buildSchedulerProfile(researchResult, negotiationResult);
  const fallbackLiveText = `Itinerary locked: ${profile.itinerary}.`;
  const liveText = await llm.generateText({
    system: "Summarize the final booking in one sentence.",
    prompt: profile.itinerary,
    fallback: fallbackLiveText,
  });

  return {
    itinerary: profile.itinerary,
    liveText,
    confidence: 92,
    summary: {
      visible: true,
      result: profile.result,
      costBreakdown: profile.costBreakdown,
      timeTaken: "under 30 seconds",
      optimization: profile.optimization,
    },
  };
}
