export async function runSchedulerAgent({ researchResult, negotiationResult, llm }) {
  const missionType = researchResult.missionType || "dinner_and_movie";
  const primary = researchResult.primary || researchResult.restaurant;
  const secondary = researchResult.secondary || researchResult.cinema;

  let itinerary;
  let costBreakdown;
  let result;

  switch (missionType) {
    case "hotel":
      itinerary = `Check-in ${primary.checkIn} at ${primary.name} — ${primary.roomType} — ${primary.pricePerNight}/night`;
      costBreakdown = [
        { label: "Room rate",   amount: primary.pricePerNight || "$249.00" },
        { label: "Taxes & fees", amount: "$35.00" },
        { label: "Total",        amount: "$284.00" },
      ];
      result = `Hotel room booked at ${primary.name}. ${primary.roomType} — check-in at ${primary.checkIn}.`;
      break;

    case "shopping":
      itinerary = `Visit ${primary.name} — open ${primary.hours}`;
      costBreakdown = [
        { label: "Service",         amount: "Free" },
        { label: "Estimated spend", amount: "Budget dependent" },
      ];
      result = `Shopping visit arranged at ${primary.name}. Open ${primary.hours}.`;
      break;

    case "travel":
      itinerary = `${primary.flightNumber} departs ${primary.departure} → arrives ${primary.arrival} — ${primary.price}`;
      costBreakdown = [
        { label: "Flight", amount: primary.price || "$289.00" },
        { label: "Taxes",  amount: "$42.50" },
        { label: "Total",  amount: "$331.50" },
      ];
      result = `Flight booked: ${primary.flightNumber} departing ${primary.departure}.`;
      break;

    case "entertainment":
      itinerary = `${primary.showTitle} at ${primary.showtime} — ${primary.name} — ${primary.seatType} seats`;
      costBreakdown = [
        { label: "2 tickets",    amount: `${primary.ticketPrice} x2` },
        { label: "Booking fee",  amount: "$8.50" },
        { label: "Total",        amount: "$297.50" },
      ];
      result = `Tickets booked for ${primary.showTitle} at ${primary.showtime}.`;
      break;

    case "spa":
      itinerary = `${primary.services?.[0] || "Treatment"} at ${primary.appointmentTime} — ${primary.name} — ${primary.duration}`;
      costBreakdown = [
        { label: "Treatment",       amount: primary.price || "$185.00" },
        { label: "Gratuity (20%)", amount: "$37.00" },
        { label: "Total",           amount: "$222.00" },
      ];
      result = `Spa appointment booked at ${primary.name} for ${primary.appointmentTime}.`;
      break;

    case "sport":
      itinerary = `${primary.classType} at ${primary.appointmentTime} — ${primary.name} — ${primary.duration}`;
      costBreakdown = [
        { label: "Session", amount: primary.price || "$95.00" },
        { label: "Total",   amount: primary.price || "$95.00" },
      ];
      result = `${primary.classType} session booked at ${primary.name} for ${primary.appointmentTime}.`;
      break;

    case "medical":
      itinerary = `${primary.specialty} appointment at ${primary.appointmentTime} — ${primary.name} — ${primary.duration}`;
      costBreakdown = [
        { label: "Consultation", amount: "Covered by insurance" },
      ];
      result = `Appointment booked at ${primary.name} for ${primary.appointmentTime}.`;
      break;

    case "restaurant":
      itinerary = `${primary.reservationTime || researchResult.restaurant.reservationTime} dinner at ${primary.name}`;
      costBreakdown = [
        { label: "Dinner estimate", amount: "$85.00" },
        { label: "Total",           amount: "$85.00" },
      ];
      result = `Dinner booked at ${primary.name} for ${primary.reservationTime || researchResult.restaurant.reservationTime}.`;
      break;

    case "dinner_and_movie":
    default: {
      const restaurant = researchResult.restaurant;
      const cinema = researchResult.cinema;
      itinerary = `${restaurant.reservationTime} dinner at ${restaurant.name} → 8:55 PM transfer → ${cinema.showtime} ${cinema.movieTitle}`;
      costBreakdown = [
        { label: "Dinner",           amount: "$85.00" },
        { label: "Dinner discount",  amount: "-$12.75" },
        { label: "Movie tickets",    amount: "$33.75" },
        { label: "Seat discount",    amount: "-$4.00" },
        { label: "Total",            amount: "$102.00" },
      ];
      result = `Dinner at ${restaurant.name} for ${restaurant.reservationTime}, then ${cinema.movieTitle} at ${cinema.showtime}.`;
      break;
    }
  }

  const originalCost  = negotiationResult.originalCost  ?? 0;
  const optimizedCost = negotiationResult.optimizedCost ?? 0;
  const totalSavings  = negotiationResult.savings?.totalSavings ?? 0;

  const fallbackLiveText = `Itinerary locked: ${itinerary}.`;
  const liveText = await llm.generateText({
    system: "Summarize the final booking in one sentence.",
    prompt: itinerary,
    fallback: fallbackLiveText,
  });

  const savingsPct = originalCost > 0
    ? `${((totalSavings / originalCost) * 100).toFixed(1)}% savings`
    : "0.0% savings";

  return {
    itinerary,
    liveText,
    confidence: 92,
    summary: {
      visible: true,
      result,
      costBreakdown,
      timeTaken: "under 30 seconds",
      optimization: {
        originalCost:  `$${originalCost.toFixed(2)}`,
        optimizedCost: `$${optimizedCost.toFixed(2)}`,
        savedAmount:   `$${totalSavings.toFixed(2)}`,
        savedPercent:  savingsPct,
        tradeoffs: [
          { label: "Venue",        original: "first available",   optimized: primary.name },
          { label: "Booking flow", original: "manual",            optimized: "agent confirmed" },
          { label: "Price",        original: `$${originalCost}`, optimized: `$${optimizedCost}` },
        ],
      },
    },
  };
}
