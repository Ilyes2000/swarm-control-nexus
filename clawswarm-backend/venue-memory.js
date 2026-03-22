// Venue relationship memory — persistent store across missions
// In production this would be a DB — for hackathon it's in-memory
// with a serialization hook ready for Redis/SQLite

const venueStore = new Map();

const TONE_PROFILES = {
  friendly:   { openingStyle: "warm",      pacing: "relaxed",  assertiveness: 1 },
  assertive:  { openingStyle: "direct",    pacing: "brisk",    assertiveness: 3 },
  formal:     { openingStyle: "corporate", pacing: "measured", assertiveness: 2 },
  persuasive: { openingStyle: "engaging",  pacing: "dynamic",  assertiveness: 2 },
};

const LANGUAGE_GREETINGS = {
  en: "Hello",
  fr: "Bonsoir",
  it: "Buonasera",
  es: "Buenas noches",
  de: "Guten Abend",
  ja: "Konbanwa",
};

function detectLanguage(venueName, venueAddress) {
  const name = (venueName + " " + (venueAddress || "")).toLowerCase();
  if (/bella|ristorante|trattoria|pizz|osteria/.test(name)) return "it";
  if (/le |la |café|bistro|brasserie|maison/.test(name)) return "fr";
  if (/casa|el |los |las |tapas|bodega/.test(name)) return "es";
  if (/haus|garten|stube|hof/.test(name)) return "de";
  if (/sushi|ramen|izakaya|yakitori/.test(name)) return "ja";
  return "en";
}

function buildOpeningLine(memory, reservationLine, greeting) {
  const count = memory.callCount;

  if (count === 0) {
    return `${greeting}, I'd like to make a reservation. ${reservationLine}`;
  }

  if (count === 1 && memory.lastOutcome === "accept") {
    return `${greeting}, we had a great experience last time. ${reservationLine}`;
  }

  if (memory.lastOutcome === "counter") {
    const tone = memory.preferredTone;
    if (tone === "assertive") {
      return `${greeting}, I need to confirm availability directly. ${reservationLine} — I need this confirmed today.`;
    }
    return `${greeting}, I'm following up on a previous inquiry. ${reservationLine} — can we make this work?`;
  }

  if (memory.lastDiscount) {
    return `${greeting}, last time you offered ${memory.lastDiscount} — I'm hoping we can do the same. ${reservationLine}`;
  }

  if (memory.preferredTime) {
    return `${greeting}, I know you often suggest ${memory.preferredTime} — would that work tonight? ${reservationLine}`;
  }

  return `${greeting}, this is a returning customer. ${reservationLine}`;
}

export function getVenueMemory(venueName) {
  const key = venueName.toLowerCase().trim();
  if (!venueStore.has(key)) {
    venueStore.set(key, {
      venueName,
      key,
      callCount:         0,
      successCount:      0,
      successRate:       null,
      preferredTone:     "friendly",
      detectedLanguage:  detectLanguage(venueName, ""),
      lastOutcome:       null,
      lastDiscount:      null,
      lastPromoCode:     null,
      preferredTime:     null,
      bestCallHour:      null,
      counterPatterns:   [],
      acceptPatterns:    [],
      escalationRules:   [],
      notes:             [],
      callHistory:       [],
      relationshipLevel: "new",   // new | acquainted | regular | vip
      createdAt:         new Date().toISOString(),
      updatedAt:         new Date().toISOString(),
    });
  }
  return venueStore.get(key);
}

export function buildCallScript(venueName, reservationLine) {
  const memory   = getVenueMemory(venueName);
  const lang     = memory.detectedLanguage;
  const greeting = LANGUAGE_GREETINGS[lang] || LANGUAGE_GREETINGS.en;
  const tone     = TONE_PROFILES[memory.preferredTone] || TONE_PROFILES.friendly;
  const opening  = buildOpeningLine(memory, reservationLine, greeting);

  const escalationScript = memory.escalationRules.length > 0
    ? memory.escalationRules[memory.escalationRules.length - 1]
    : "If unavailable, ask for the next available slot and any current promotions.";

  return {
    language:          lang,
    greeting,
    tone:              memory.preferredTone,
    toneProfile:       tone,
    opening,
    escalation:        escalationScript,
    referenceHistory:  memory.callCount > 0,
    callCount:         memory.callCount,
    relationshipLevel: memory.relationshipLevel,
    contextNotes:      memory.notes.slice(-2),
    suggestedApproach: memory.callCount === 0
      ? "First contact — be warm and professional"
      : memory.successRate >= 75
        ? "High success rate — keep current approach"
        : memory.lastOutcome === "counter"
          ? "They countered last time — be more direct"
          : "Standard follow-up approach",
  };
}

export function updateVenueMemory(venueName, outcome) {
  const key    = venueName.toLowerCase().trim();
  const memory = getVenueMemory(venueName);
  const hour   = new Date().getHours();
  const isSuccess = outcome.offerType === "accept"
    || outcome.offerType === "offpeak"
    || outcome.offerType === "promo";

  memory.callCount++;
  if (isSuccess) memory.successCount++;

  memory.successRate = Math.round(
    (memory.successCount / memory.callCount) * 100
  );

  memory.lastOutcome = outcome.offerType;

  if (outcome.offerType === "counter" && outcome.details?.time) {
    memory.preferredTime = outcome.details.time;
    if (!memory.counterPatterns.includes(outcome.details.time)) {
      memory.counterPatterns.push(outcome.details.time);
    }
  }

  if (outcome.details?.discount)  memory.lastDiscount  = outcome.details.discount;
  if (outcome.details?.promoCode) memory.lastPromoCode = outcome.details.promoCode;

  if (isSuccess) memory.bestCallHour = hour;

  if (memory.callCount >= 2) {
    if (memory.successRate >= 75) {
      memory.preferredTone = "friendly";
    } else if (memory.lastOutcome === "counter" && memory.callCount >= 2) {
      memory.preferredTone = "assertive";
    } else if (memory.lastOutcome === "no_response") {
      memory.preferredTone = "formal";
    }
  }

  if (memory.callCount >= 5 && memory.successRate >= 70) {
    memory.relationshipLevel = "vip";
  } else if (memory.callCount >= 3) {
    memory.relationshipLevel = "regular";
  } else if (memory.callCount >= 1) {
    memory.relationshipLevel = "acquainted";
  }

  if (memory.counterPatterns.length >= 2) {
    const rule = `This venue typically counters — open by asking for ${memory.counterPatterns[0]} directly`;
    if (!memory.escalationRules.includes(rule)) {
      memory.escalationRules.push(rule);
    }
  }

  memory.callHistory.push({
    timestamp: new Date().toISOString(),
    outcome:   outcome.offerType,
    offerText: outcome.text?.slice(0, 80),
    hour,
    success:   isSuccess,
  });

  if (memory.callHistory.length > 10) {
    memory.callHistory.shift();
  }

  const note = buildSmartNote(outcome, memory);
  if (note) {
    memory.notes.push(note);
    if (memory.notes.length > 5) memory.notes.shift();
  }

  memory.updatedAt = new Date().toISOString();
  venueStore.set(key, memory);

  return memory;
}

function buildSmartNote(outcome, memory) {
  if (outcome.offerType === "promo" && outcome.details?.promoCode) {
    return `Offered promo code ${outcome.details.promoCode} — use on next call`;
  }
  if (outcome.offerType === "counter" && outcome.details?.time) {
    return `Prefers ${outcome.details.time} — lead with this next time`;
  }
  if (outcome.offerType === "offpeak" && memory.callCount === 1) {
    return `Off-peak offer on first contact — this venue is deal-friendly`;
  }
  if (outcome.offerType === "no_response" && memory.callCount > 1) {
    return `Slow to respond — try calling earlier in the day`;
  }
  if (outcome.offerType === "accept" && memory.callCount >= 2) {
    return `Accepted again — ${memory.preferredTone} tone working well`;
  }
  return null;
}

export function getAllVenueMemories() {
  return [...venueStore.values()].sort(
    (a, b) => b.callCount - a.callCount
  );
}

export function getVenueIntelligenceReport(venueName) {
  const memory = getVenueMemory(venueName);
  const script = buildCallScript(venueName, "make a reservation");
  return {
    memory,
    script,
    insights: {
      isKnown:           memory.callCount > 0,
      recommendedTone:   memory.preferredTone,
      recommendedTime:   memory.bestCallHour != null
        ? `${memory.bestCallHour}:00 - ${memory.bestCallHour + 1}:00`
        : "Any time",
      successPrediction: memory.callCount === 0
        ? "Unknown — first contact"
        : memory.successRate >= 75
          ? "High — this venue responds well"
          : memory.successRate >= 40
            ? "Moderate — expect negotiation"
            : "Low — consider alternative venue",
      relationshipSummary: buildRelationshipSummary(memory),
    },
  };
}

function buildRelationshipSummary(memory) {
  if (memory.callCount === 0) return "No prior contact";
  if (memory.relationshipLevel === "vip") {
    return `VIP relationship — ${memory.callCount} calls, ${memory.successRate}% success`;
  }
  if (memory.relationshipLevel === "regular") {
    return `Regular contact — knows our preferences`;
  }
  if (memory.relationshipLevel === "acquainted") {
    return `1-2 prior contacts — building relationship`;
  }
  return "New contact";
}
