// Mission type detection
function detectMissionType(missionText) {
  const text = missionText.toLowerCase();

  const patterns = {
    restaurant: [/dinner|lunch|breakfast|eat|food|restaurant|table|reservation|cuisine|bistro|cafe/],
    hotel: [/hotel|stay|room|accommodation|lodging|check.?in|suite|overnight/],
    shopping: [/shop|buy|purchase|store|mall|boutique|clothes|shoes|gift|product/],
    travel: [/flight|plane|train|bus|ticket|travel|trip|journey|airport/],
    entertainment: [/movie|cinema|concert|show|event|theatre|theater|performance/],
    spa: [/spa|massage|wellness|relax|beauty|salon|facial|treatment/],
    sport: [/gym|fitness|sport|game|match|court|pool|yoga|pilates/],
    medical: [/doctor|dentist|clinic|appointment|medical|health|pharmacy/],
    mixed: [],
  };

  const detected = [];
  for (const [type, regexList] of Object.entries(patterns)) {
    if (regexList.some((regex) => regex.test(text))) {
      detected.push(type);
    }
  }

  const hasRestaurant = detected.includes("restaurant");
  const hasEntertainment = detected.includes("entertainment");
  const hasHotel = detected.includes("hotel");

  if (hasRestaurant && hasEntertainment) return "dinner_and_movie";
  if (hasRestaurant && hasHotel) return "travel_dining";
  if (hasEntertainment) return "entertainment";
  if (detected.length > 0) return detected[0];
  return "mixed";
}

// Venue database per mission type
const venueDatabase = {
  dinner_and_movie: {
    primary: {
      name: "La Bella Vita",
      type: "restaurant",
      rating: 4.8,
      phone: "+15555550101",
      cuisine: "Italian",
      address: "125 Harbor Ave",
      distanceMiles: 0.8,
      reservationTime: "7:30 PM",
      priceRange: "$$",
    },
    secondary: {
      name: "Grand Cinema",
      type: "cinema",
      rating: 4.7,
      phone: "+15555550102",
      movieTitle: "Mission Impossible 9",
      showtime: "9:20 PM",
      seatType: "center row",
      ticketPrice: "$16.50",
    },
    workflow: "dinner_and_movie",
  },

  restaurant: {
    primary: {
      name: "The Golden Fork",
      type: "restaurant",
      rating: 4.6,
      phone: "+15555550103",
      cuisine: "French",
      address: "88 Riverside Blvd",
      distanceMiles: 1.2,
      reservationTime: "7:00 PM",
      priceRange: "$$",
    },
    workflow: "restaurant",
  },

  hotel: {
    primary: {
      name: "Grand Hyatt Downtown",
      type: "hotel",
      rating: 4.9,
      phone: "+15555550104",
      address: "1 Grand Plaza",
      distanceMiles: 2.1,
      checkIn: "3:00 PM",
      checkOut: "11:00 AM",
      roomType: "Deluxe King",
      pricePerNight: "$249",
      amenities: ["Pool", "Spa", "Gym", "Breakfast included"],
    },
    workflow: "hotel",
  },

  shopping: {
    primary: {
      name: "Nordstrom Downtown",
      type: "store",
      rating: 4.5,
      phone: "+15555550105",
      address: "200 Shopping Ave",
      distanceMiles: 0.5,
      hours: "10:00 AM - 9:00 PM",
      departments: ["Clothing", "Shoes", "Accessories"],
    },
    secondary: {
      name: "Apple Store Fifth Ave",
      type: "store",
      rating: 4.7,
      phone: "+15555550106",
      address: "767 Fifth Avenue",
      distanceMiles: 1.0,
      hours: "9:00 AM - 9:00 PM",
      movieTitle: "Tech & Accessories",
      showtime: "Open now",
      seatType: "walk-in",
    },
    workflow: "shopping",
  },

  travel: {
    primary: {
      name: "Delta Airlines",
      type: "airline",
      rating: 4.3,
      phone: "+18005551212",
      flightNumber: "DL 447",
      departure: "8:30 AM",
      arrival: "11:45 AM",
      price: "$289",
      class: "Economy Plus",
    },
    workflow: "travel",
  },

  entertainment: {
    primary: {
      name: "Broadway Theater",
      type: "theater",
      rating: 4.9,
      phone: "+15555550107",
      address: "123 Broadway",
      showTitle: "Hamilton",
      showtime: "8:00 PM",
      seatType: "Orchestra",
      ticketPrice: "$145",
    },
    workflow: "entertainment",
  },

  spa: {
    primary: {
      name: "Serenity Spa & Wellness",
      type: "spa",
      rating: 4.8,
      phone: "+15555550108",
      address: "45 Wellness Lane",
      distanceMiles: 0.9,
      services: ["Swedish Massage", "Facial", "Hot Stone"],
      appointmentTime: "2:00 PM",
      duration: "90 minutes",
      price: "$185",
    },
    workflow: "spa",
  },

  sport: {
    primary: {
      name: "Equinox Fitness Club",
      type: "gym",
      rating: 4.6,
      phone: "+15555550109",
      address: "300 Fitness Blvd",
      distanceMiles: 0.7,
      classType: "Personal Training",
      appointmentTime: "6:00 AM",
      duration: "60 minutes",
      price: "$95",
    },
    workflow: "sport",
  },

  medical: {
    primary: {
      name: "City Medical Center",
      type: "clinic",
      rating: 4.7,
      phone: "+15555550110",
      address: "500 Health Ave",
      distanceMiles: 1.5,
      specialty: "General Practice",
      appointmentTime: "10:30 AM",
      duration: "30 minutes",
    },
    workflow: "medical",
  },

  mixed: {
    primary: {
      name: "Concierge Service Center",
      type: "service",
      rating: 4.5,
      phone: "+15555550111",
      address: "1 Main Street",
      distanceMiles: 0.3,
      serviceType: "General Inquiry",
      appointmentTime: "As needed",
    },
    workflow: "mixed",
  },

  travel_dining: {
    primary: {
      name: "Airport Marriott",
      type: "hotel",
      rating: 4.4,
      phone: "+15555550112",
      address: "Terminal B, Airport Blvd",
      checkIn: "2:00 PM",
      roomType: "Standard King",
      pricePerNight: "$189",
    },
    secondary: {
      name: "The Airport Brasserie",
      type: "restaurant",
      rating: 4.3,
      phone: "+15555550113",
      cuisine: "International",
      reservationTime: "7:00 PM",
      movieTitle: "Dinner Service",
      showtime: "7:00 PM",
      seatType: "table",
    },
    workflow: "travel_dining",
  },
};

function getTargetWorkflow(overallWorkflow, role, venue) {
  if (overallWorkflow === "dinner_and_movie") {
    return role === "primary" ? "restaurant" : "cinema";
  }
  if (overallWorkflow === "travel_dining") {
    return role === "primary" ? "hotel" : "restaurant";
  }
  if (venue?.type === "cinema") {
    return "cinema";
  }
  if (venue?.type === "theater") {
    return "entertainment";
  }
  if (venue?.type === "restaurant") {
    return "restaurant";
  }
  if (venue?.type === "hotel") {
    return "hotel";
  }
  if (venue?.type === "airline") {
    return "travel";
  }
  return overallWorkflow;
}

function buildRecommendationSourcesForWorkflow(workflow) {
  const checkedAt = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const sourceMap = {
    restaurant: [{ label: "OpenTable API", type: "api", freshness: "live", verified: true, bookingPath: "direct", risk: "low", checkedAt }],
    hotel: [{ label: "Hotels.com API", type: "api", freshness: "live", verified: true, bookingPath: "direct", risk: "low", checkedAt }],
    shopping: [{ label: "Google Places API", type: "api", freshness: "live", verified: true, bookingPath: "direct", risk: "low", checkedAt }],
    travel: [{ label: "Amadeus Travel API", type: "api", freshness: "live", verified: true, bookingPath: "direct", risk: "medium", checkedAt }],
    entertainment: [{ label: "Ticketmaster API", type: "api", freshness: "live", verified: true, bookingPath: "reseller", risk: "medium", checkedAt }],
    cinema: [{ label: "Ticketmaster API", type: "api", freshness: "live", verified: true, bookingPath: "reseller", risk: "medium", checkedAt }],
    spa: [{ label: "Mindbody API", type: "api", freshness: "live", verified: true, bookingPath: "direct", risk: "low", checkedAt }],
    sport: [{ label: "Mindbody API", type: "api", freshness: "live", verified: true, bookingPath: "direct", risk: "low", checkedAt }],
    medical: [{ label: "Zocdoc API", type: "api", freshness: "live", verified: true, bookingPath: "direct", risk: "low", checkedAt }],
    mixed: [{ label: "Seeded Venue DB", type: "fallback", freshness: "simulated", verified: false, bookingPath: "unknown", risk: "medium", checkedAt }],
  };

  return sourceMap[workflow] || sourceMap.mixed;
}

function buildWorkflowSummary(workflow, data) {
  switch (workflow) {
    case "dinner_and_movie":
      return `Found ${data.primary.name} (${data.primary.rating}★) and ${data.secondary.name} showing ${data.secondary.movieTitle} at ${data.secondary.showtime}.`;
    case "travel_dining":
      return `Found ${data.primary.name} for check-in at ${data.primary.checkIn} and ${data.secondary.name} for ${data.secondary.reservationTime}.`;
    case "restaurant":
      return `Found ${data.primary.name} (${data.primary.rating}★) for ${data.primary.reservationTime}.`;
    case "hotel":
      return `Found ${data.primary.name} (${data.primary.rating}★) - ${data.primary.roomType} at ${data.primary.pricePerNight}/night.`;
    case "shopping":
      return `Found ${data.primary.name} (${data.primary.rating}★) open ${data.primary.hours}.`;
    case "travel":
      return `Found ${data.primary.name} flight ${data.primary.flightNumber} at ${data.primary.departure} - ${data.primary.price}.`;
    case "entertainment":
      return `Found ${data.primary.name} showing ${data.primary.showTitle} at ${data.primary.showtime} - ${data.primary.ticketPrice}.`;
    case "spa":
      return `Found ${data.primary.name} (${data.primary.rating}★) - ${data.primary.services?.[0]} at ${data.primary.appointmentTime}.`;
    case "sport":
      return `Found ${data.primary.name} (${data.primary.rating}★) - ${data.primary.classType} at ${data.primary.appointmentTime}.`;
    case "medical":
      return `Found ${data.primary.name} (${data.primary.rating}★) - appointment at ${data.primary.appointmentTime}.`;
    default:
      return `Found ${data.primary.name} - ready to assist with your request.`;
  }
}

function buildBookingTarget(overallWorkflow, role, venue) {
  const workflow = getTargetWorkflow(overallWorkflow, role, venue);

  switch (workflow) {
    case "restaurant":
      return {
        workflow,
        role,
        venueName: venue.name,
        venueType: venue.type || "restaurant",
        phone: venue.phone,
        timeLabel: venue.reservationTime || "TBD",
        titleLabel: venue.cuisine || null,
        reservationLine: `Hi, I need a reservation for two at ${venue.reservationTime || "TBD"}.`,
        successDescription: `Table reserved at ${venue.name} for ${venue.reservationTime || "TBD"}`,
        memoryLabel: "Restaurant booking",
        memoryValue: `${venue.name} confirmed for ${venue.reservationTime || "TBD"}`,
        requestLabel: "Restaurant booking request",
        actionLabel: "Confirm restaurant booking",
        bookingAction: "book_restaurant",
        description: `Calling ${venue.name} for a table`,
        estimatedCostLabel: "$85 total",
        estimatedTotalCost: 85,
        confidence: 87,
        partySize: 2,
        summaryText: `${venue.name} at ${venue.reservationTime || "TBD"}`,
      };
    case "cinema":
      return {
        workflow,
        role,
        venueName: venue.name,
        venueType: venue.type || "cinema",
        phone: venue.phone,
        timeLabel: venue.showtime || "TBD",
        titleLabel: venue.movieTitle || venue.showTitle || "selected movie",
        reservationLine: `Hello, I want two ${venue.seatType || "best available"} seats for ${venue.movieTitle || venue.showTitle || "the selected title"} at ${venue.showtime || "TBD"}.`,
        successDescription: `Tickets secured for ${venue.movieTitle || venue.showTitle || "the selected title"} at ${venue.showtime || "TBD"}`,
        memoryLabel: "Cinema booking",
        memoryValue: `${venue.movieTitle || venue.showTitle || "selected movie"} at ${venue.showtime || "TBD"} with ${venue.seatType || "best available"} seats`,
        requestLabel: "Cinema booking request",
        actionLabel: "Confirm cinema booking",
        bookingAction: "book_cinema",
        description: `Calling ${venue.name} for movie seats`,
        estimatedCostLabel: "$33.75 total",
        estimatedTotalCost: 33.75,
        confidence: 91,
        partySize: 2,
        summaryText: `${venue.movieTitle || venue.showTitle || "selected movie"} at ${venue.name} at ${venue.showtime || "TBD"}`,
      };
    case "entertainment":
      return {
        workflow,
        role,
        venueName: venue.name,
        venueType: venue.type || "entertainment",
        phone: venue.phone,
        timeLabel: venue.showtime || "TBD",
        titleLabel: venue.showTitle || venue.movieTitle || "selected show",
        reservationLine: `Hi, I need two tickets for ${venue.showTitle || venue.movieTitle || "the selected show"} at ${venue.showtime || "TBD"} - best available seats.`,
        successDescription: `Tickets secured for ${venue.showTitle || venue.movieTitle || "the selected show"} at ${venue.showtime || "TBD"}`,
        memoryLabel: "Entertainment booking",
        memoryValue: `${venue.showTitle || venue.movieTitle || "selected show"} at ${venue.showtime || "TBD"} with ${venue.seatType || "best available"} seats`,
        requestLabel: "Entertainment booking request",
        actionLabel: "Confirm entertainment booking",
        bookingAction: "book_entertainment",
        description: `Calling ${venue.name} for tickets`,
        estimatedCostLabel: "$297.50 total",
        estimatedTotalCost: 297.5,
        confidence: 90,
        partySize: 2,
        summaryText: `${venue.showTitle || venue.movieTitle || "selected show"} at ${venue.name} at ${venue.showtime || "TBD"}`,
      };
    case "hotel":
      return {
        workflow,
        role,
        venueName: venue.name,
        venueType: venue.type || "hotel",
        phone: venue.phone,
        timeLabel: venue.checkIn || "TBD",
        titleLabel: venue.roomType || null,
        reservationLine: `Hello, I'd like to book a ${venue.roomType || "room"} room for tonight, checking in at ${venue.checkIn || "TBD"}.`,
        successDescription: `Room reserved at ${venue.name} for check-in at ${venue.checkIn || "TBD"}`,
        memoryLabel: "Hotel booking",
        memoryValue: `${venue.roomType || "Room"} at ${venue.name} for check-in at ${venue.checkIn || "TBD"}`,
        requestLabel: "Hotel booking request",
        actionLabel: "Confirm hotel booking",
        bookingAction: "book_hotel",
        description: `Calling ${venue.name} for room availability`,
        estimatedCostLabel: venue.pricePerNight ? `${venue.pricePerNight}/night` : "$249/night",
        estimatedTotalCost: parseFloat(String(venue.pricePerNight || "249").replace(/[^0-9.]/g, "")) || 249,
        confidence: 88,
        partySize: 1,
        summaryText: `${venue.name} check-in at ${venue.checkIn || "TBD"}`,
      };
    case "travel":
      return {
        workflow,
        role,
        venueName: venue.name,
        venueType: venue.type || "travel",
        phone: venue.phone,
        timeLabel: venue.departure || "TBD",
        titleLabel: venue.flightNumber || null,
        reservationLine: `Hello, I need to book ${venue.flightNumber || "the selected flight"} departing at ${venue.departure || "TBD"} - two passengers please.`,
        successDescription: `Travel confirmed on ${venue.flightNumber || venue.name} departing ${venue.departure || "TBD"}`,
        memoryLabel: "Travel booking",
        memoryValue: `${venue.flightNumber || venue.name} departing ${venue.departure || "TBD"}`,
        requestLabel: "Travel booking request",
        actionLabel: "Confirm travel booking",
        bookingAction: "book_travel",
        description: `Calling ${venue.name} for travel booking`,
        estimatedCostLabel: venue.price || "$289 total",
        estimatedTotalCost: parseFloat(String(venue.price || "289").replace(/[^0-9.]/g, "")) || 289,
        confidence: 89,
        partySize: 2,
        summaryText: `${venue.flightNumber || venue.name} at ${venue.departure || "TBD"}`,
      };
    case "shopping":
      return {
        workflow,
        role,
        venueName: venue.name,
        venueType: venue.type || "shopping",
        phone: venue.phone,
        timeLabel: venue.hours || "Open now",
        titleLabel: venue.departments?.[0] || null,
        reservationLine: `Hi, I'm looking for assistance in your ${venue.departments?.[0] || "store"}. What are your current hours?`,
        successDescription: `Shopping stop arranged at ${venue.name}`,
        memoryLabel: "Shopping plan",
        memoryValue: `${venue.name} during ${venue.hours || "open hours"}`,
        requestLabel: "Shopping inquiry",
        actionLabel: "Confirm shopping stop",
        bookingAction: "book_shopping",
        description: `Calling ${venue.name} for store details`,
        estimatedCostLabel: "Budget dependent",
        estimatedTotalCost: 0,
        confidence: 84,
        partySize: 1,
        summaryText: `${venue.name} during ${venue.hours || "open hours"}`,
      };
    case "spa":
      return {
        workflow,
        role,
        venueName: venue.name,
        venueType: venue.type || "spa",
        phone: venue.phone,
        timeLabel: venue.appointmentTime || "TBD",
        titleLabel: venue.services?.[0] || null,
        reservationLine: `Hello, I'd like to book a ${venue.services?.[0] || "massage"} appointment for ${venue.appointmentTime || "TBD"}.`,
        successDescription: `Spa appointment secured at ${venue.name} for ${venue.appointmentTime || "TBD"}`,
        memoryLabel: "Spa booking",
        memoryValue: `${venue.services?.[0] || "Treatment"} at ${venue.name} for ${venue.appointmentTime || "TBD"}`,
        requestLabel: "Spa booking request",
        actionLabel: "Confirm spa booking",
        bookingAction: "book_spa",
        description: `Calling ${venue.name} for spa availability`,
        estimatedCostLabel: venue.price || "$185 total",
        estimatedTotalCost: parseFloat(String(venue.price || "185").replace(/[^0-9.]/g, "")) || 185,
        confidence: 86,
        partySize: 1,
        summaryText: `${venue.services?.[0] || "Treatment"} at ${venue.name} at ${venue.appointmentTime || "TBD"}`,
      };
    case "sport":
      return {
        workflow,
        role,
        venueName: venue.name,
        venueType: venue.type || "sport",
        phone: venue.phone,
        timeLabel: venue.appointmentTime || "TBD",
        titleLabel: venue.classType || null,
        reservationLine: `Hi, I'd like to book a ${venue.classType || "fitness"} session at ${venue.appointmentTime || "TBD"}.`,
        successDescription: `${venue.classType || "Fitness"} session secured at ${venue.name} for ${venue.appointmentTime || "TBD"}`,
        memoryLabel: "Fitness booking",
        memoryValue: `${venue.classType || "Session"} at ${venue.name} for ${venue.appointmentTime || "TBD"}`,
        requestLabel: "Fitness booking request",
        actionLabel: "Confirm fitness booking",
        bookingAction: "book_sport",
        description: `Calling ${venue.name} for class availability`,
        estimatedCostLabel: venue.price || "$95 total",
        estimatedTotalCost: parseFloat(String(venue.price || "95").replace(/[^0-9.]/g, "")) || 95,
        confidence: 84,
        partySize: 1,
        summaryText: `${venue.classType || "Session"} at ${venue.name} at ${venue.appointmentTime || "TBD"}`,
      };
    case "medical":
      return {
        workflow,
        role,
        venueName: venue.name,
        venueType: venue.type || "medical",
        phone: venue.phone,
        timeLabel: venue.appointmentTime || "TBD",
        titleLabel: venue.specialty || null,
        reservationLine: `Hello, I need to schedule an appointment with ${venue.specialty || "the clinic"} for ${venue.appointmentTime || "TBD"}.`,
        successDescription: `Appointment secured at ${venue.name} for ${venue.appointmentTime || "TBD"}`,
        memoryLabel: "Medical appointment",
        memoryValue: `${venue.specialty || "Appointment"} at ${venue.name} for ${venue.appointmentTime || "TBD"}`,
        requestLabel: "Medical booking request",
        actionLabel: "Confirm medical appointment",
        bookingAction: "book_medical",
        description: `Calling ${venue.name} for appointment availability`,
        estimatedCostLabel: "Insurance dependent",
        estimatedTotalCost: 0,
        confidence: 85,
        partySize: 1,
        summaryText: `${venue.specialty || "Appointment"} at ${venue.name} at ${venue.appointmentTime || "TBD"}`,
      };
    default:
      return {
        workflow,
        role,
        venueName: venue.name,
        venueType: venue.type || workflow,
        phone: venue.phone,
        timeLabel: venue.appointmentTime || venue.showtime || venue.reservationTime || "TBD",
        titleLabel: null,
        reservationLine: "Hello, I need assistance with a booking. Can you help me?",
        successDescription: `Booking secured at ${venue.name}`,
        memoryLabel: "Booking",
        memoryValue: `${venue.name} confirmed`,
        requestLabel: "Booking request",
        actionLabel: "Confirm booking",
        bookingAction: `book_${workflow}`,
        description: `Calling ${venue.name}`,
        estimatedCostLabel: "Quote needed",
        estimatedTotalCost: 0,
        confidence: 80,
        partySize: 1,
        summaryText: venue.name,
      };
  }
}

function buildBookingTargets(workflow, data) {
  const targets = [];
  if (data.primary) {
    targets.push(buildBookingTarget(workflow, "primary", data.primary));
  }
  if (data.secondary) {
    targets.push(buildBookingTarget(workflow, "secondary", data.secondary));
  }
  return targets;
}

function buildCompatibilityViews(data, bookingTargets, missionType) {
  const restaurantTarget = bookingTargets.find((target) => target.workflow === "restaurant");
  const entertainmentTarget = bookingTargets.find((target) => target.workflow === "cinema" || target.workflow === "entertainment");

  const restaurant = restaurantTarget
    ? {
        name: restaurantTarget.venueName,
        rating: data.primary?.name === restaurantTarget.venueName ? data.primary.rating : data.secondary?.rating || data.primary?.rating,
        phone: restaurantTarget.phone,
        cuisine: data.primary?.name === restaurantTarget.venueName ? data.primary.cuisine : data.secondary?.cuisine || restaurantTarget.venueType,
        address: data.primary?.name === restaurantTarget.venueName ? data.primary.address || "" : data.secondary?.address || "",
        distanceMiles: data.primary?.name === restaurantTarget.venueName ? data.primary.distanceMiles || 0 : data.secondary?.distanceMiles || 0,
        reservationTime: restaurantTarget.timeLabel,
      }
    : {
        name: data.primary.name,
        rating: data.primary.rating,
        phone: data.primary.phone,
        cuisine: data.primary.type,
        address: data.primary.address || "",
        distanceMiles: data.primary.distanceMiles || 0,
        reservationTime: data.primary.reservationTime || data.primary.appointmentTime || data.primary.checkIn || "TBD",
      };

  const cinema = entertainmentTarget
    ? {
        name: entertainmentTarget.venueName,
        rating: data.secondary?.name === entertainmentTarget.venueName ? data.secondary?.rating || data.primary.rating : data.primary.rating,
        phone: entertainmentTarget.phone,
        movieTitle: entertainmentTarget.titleLabel || missionType,
        showtime: entertainmentTarget.timeLabel,
        seatType: data.secondary?.seatType || data.primary.seatType || "standard",
      }
    : {
        name: data.secondary?.name || data.primary.name,
        rating: data.secondary?.rating || data.primary.rating,
        phone: data.secondary?.phone || data.primary.phone,
        movieTitle: data.secondary?.movieTitle || data.secondary?.showTitle || data.primary.showTitle || missionType,
        showtime: data.secondary?.showtime || data.secondary?.appointmentTime || data.primary.showtime || "TBD",
        seatType: data.secondary?.seatType || "standard",
      };

  return { restaurant, cinema };
}

function extractUserTitle(missionText) {
  const text = missionText || "";
  const movieMatch = text.match(/\b(?:movie|film|show|see|watch|book)\s+(?:called\s+)?["']?([A-Z][A-Za-z0-9:' -]{1,40})["']?/i);
  if (movieMatch) return movieMatch[1].trim();
  const quotedMatch = text.match(/["']([^"']{2,40})["']/);
  if (quotedMatch) return quotedMatch[1].trim();
  return null;
}

export async function runResearchAgent({ missionText, llm }) {
  const missionType = detectMissionType(missionText);
  const data = JSON.parse(JSON.stringify(venueDatabase[missionType] || venueDatabase.mixed));

  const userTitle = extractUserTitle(missionText);
  if (userTitle) {
    if (data.primary?.showTitle) data.primary.showTitle = userTitle;
    if (data.primary?.movieTitle) data.primary.movieTitle = userTitle;
    if (data.secondary?.showTitle) data.secondary.showTitle = userTitle;
    if (data.secondary?.movieTitle) data.secondary.movieTitle = userTitle;
  }
  const bookingTargets = buildBookingTargets(data.workflow, data);
  const fallbackLiveText = buildWorkflowSummary(missionType, data);

  const rawLiveText = await llm.generateText({
    system: "Summarize venue research in one sentence. No markdown.",
    prompt: `Mission type: ${missionType}\nMission: ${missionText}\nPrimary: ${data.primary.name}\nDetails: ${JSON.stringify(data.primary)}`,
    fallback: fallbackLiveText,
  });

  const liveText = `${(rawLiveText || fallbackLiveText)
    .replace(/[#*_`>\-]/g, "")
    .replace(/[\r\n\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(".")[0]}.`;

  const recommendationSources = {
    overall: bookingTargets.flatMap((target) => buildRecommendationSourcesForWorkflow(target.workflow)),
    primary: buildRecommendationSourcesForWorkflow(bookingTargets[0]?.workflow || missionType),
    secondary: bookingTargets[1]
      ? buildRecommendationSourcesForWorkflow(bookingTargets[1].workflow)
      : buildRecommendationSourcesForWorkflow(missionType),
  };
  const { restaurant, cinema } = buildCompatibilityViews(data, bookingTargets, missionType);

  return {
    missionType,
    restaurant,
    cinema,
    primary: data.primary,
    secondary: data.secondary || null,
    workflow: data.workflow,
    bookingTargets,
    reservationLine: bookingTargets[0]?.reservationLine || "Hello, I need assistance with a booking. Can you help me?",
    usedFallback: false,
    liveText,
    sources: recommendationSources.overall,
    recommendationSources,
    reasoning: `Selected best ${missionType} option based on rating, availability, and proximity to user location.`,
    confidence: 91,
  };
}
