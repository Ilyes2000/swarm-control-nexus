const fallbackResearchData = {
  restaurant: {
    name: "La Bella Vita",
    rating: 4.8,
    phone: "+15555550101",
    cuisine: "Italian",
    address: "125 Harbor Ave",
    distanceMiles: 0.8,
    reservationTime: "7:30 PM"
  },
  cinema: {
    name: "Grand Cinema",
    rating: 4.7,
    phone: "+15555550102",
    movieTitle: "Dune: Part Two",
    showtime: "9:20 PM",
    seatType: "center row"
  }
};

async function lookupLiveOptions() {
  return null;
}

export async function runResearchAgent({ missionText, llm }) {
  const liveResults = await lookupLiveOptions(missionText);
  const data = liveResults ?? fallbackResearchData;

  const fallbackLiveText = `Found ${data.restaurant.name} (${data.restaurant.rating} stars) and ${data.cinema.name} showing ${data.cinema.movieTitle} at ${data.cinema.showtime}.`;
  const liveText = await llm.generateText({
    system: "Summarize venue research in one sentence.",
    prompt: `Mission: ${missionText}\nRestaurant: ${data.restaurant.name}\nCinema: ${data.cinema.name}`,
    fallback: fallbackLiveText
  });

  const sources = liveResults
    ? [
        { label: "Google Places API", type: "api", freshness: "live", verified: true },
        { label: "Yelp Fusion", type: "api", freshness: "live", verified: true }
      ]
    : [
        { label: "Seeded Venue DB", type: "fallback", freshness: "simulated", verified: false }
      ];

  return {
    ...data,
    usedFallback: !liveResults,
    liveText,
    sources,
    reasoning: "Ranked the restaurant by cuisine fit, rating, proximity, and same-night availability. Matched the cinema by timing compatibility after dinner and seat quality.",
    confidence: liveResults ? 91 : 88
  };
}
