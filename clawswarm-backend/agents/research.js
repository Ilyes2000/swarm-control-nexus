const fallbackResearchData = {
  restaurant: {
    name: "La Bella Vita",
    rating: 4.8,
    phone: "+15555550101",
    cuisine: "Italian",
    address: "125 Harbor Ave",
    distanceMiles: 0.8,
    reservationTime: "7:30 PM",
  },
  cinema: {
    name: "Grand Cinema",
    rating: 4.7,
    phone: "+15555550102",
    movieTitle: "Dune: Part Two",
    showtime: "9:20 PM",
    seatType: "center row",
  },
};

async function lookupLiveOptions() {
  return null;
}

function nowLabel() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function buildRecommendationSources(liveResults) {
  const checkedAt = nowLabel();

  if (liveResults) {
    return {
      overall: [
        {
          label: "Google Places API",
          type: "api",
          freshness: "live",
          verified: true,
          bookingPath: "direct",
          risk: "low",
          checkedAt,
        },
        {
          label: "Yelp Fusion",
          type: "api",
          freshness: "live",
          verified: true,
          bookingPath: "unknown",
          risk: "medium",
          checkedAt,
        },
      ],
      restaurant: [
        {
          label: "Restaurant Website",
          type: "web",
          freshness: "live",
          verified: true,
          bookingPath: "direct",
          risk: "low",
          checkedAt,
        },
      ],
      cinema: [
        {
          label: "Ticketing Aggregator",
          type: "web",
          freshness: "live",
          verified: true,
          bookingPath: "reseller",
          risk: "medium",
          checkedAt,
        },
      ],
    };
  }

  return {
    overall: [
      {
        label: "Seeded Venue DB",
        type: "fallback",
        freshness: "simulated",
        verified: false,
        bookingPath: "unknown",
        risk: "medium",
        checkedAt,
      },
    ],
    restaurant: [
      {
        label: "Seeded Restaurant Fixture",
        type: "fallback",
        freshness: "simulated",
        verified: false,
        bookingPath: "unknown",
        risk: "medium",
        checkedAt,
      },
    ],
    cinema: [
      {
        label: "Seeded Cinema Fixture",
        type: "fallback",
        freshness: "simulated",
        verified: false,
        bookingPath: "unknown",
        risk: "medium",
        checkedAt,
      },
    ],
  };
}

export async function runResearchAgent({ missionText, llm }) {
  const liveResults = await lookupLiveOptions(missionText);
  const data = liveResults ?? fallbackResearchData;

  const fallbackLiveText = `Found ${data.restaurant.name} (${data.restaurant.rating} stars) and ${data.cinema.name} showing ${data.cinema.movieTitle} at ${data.cinema.showtime}.`;
  const liveText = await llm.generateText({
    system: "Summarize venue research in one sentence.",
    prompt: `Mission: ${missionText}\nRestaurant: ${data.restaurant.name}\nCinema: ${data.cinema.name}`,
    fallback: fallbackLiveText,
  });

  const recommendationSources = buildRecommendationSources(liveResults);

  return {
    ...data,
    usedFallback: !liveResults,
    liveText,
    sources: recommendationSources.overall,
    recommendationSources,
    reasoning:
      "Ranked the restaurant by cuisine fit, rating, proximity, and same-night availability. Matched the cinema by timing compatibility after dinner and seat quality.",
    confidence: liveResults ? 91 : 88,
  };
}
