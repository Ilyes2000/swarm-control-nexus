import { buildCallScript, getVenueIntelligenceReport } from "../venue-memory.js";

export async function runCallerAgent({
  businessName,
  businessPhone,
  reservationLine,
  mode,
  clawdtalk,
  resemble,
  missionVoiceName
}) {
  // Get venue intelligence BEFORE the call
  const intelligence = getVenueIntelligenceReport(businessName);
  const script       = intelligence.script;

  // Use relationship-aware opening instead of generic line
  const adaptedReservationLine = script.referenceHistory
    ? script.opening
    : reservationLine;

  // Adapt voice tone based on relationship
  const voiceName = script.tone === "assertive"
    ? `${missionVoiceName} Assertive`
    : script.tone === "formal"
      ? `${missionVoiceName} Formal`
      : missionVoiceName;

  const voice = await resemble.cloneVoice({
    name:        voiceName,
    sampleUrl:   "",
    description: `${script.tone} concierge voice for ${businessName} (${script.language})`
  });

  const clip = await resemble.generateSpeechClip({
    text:    adaptedReservationLine,
    voiceId: voice.voiceId
  });

  const call = await clawdtalk.placeCall({
    to:              businessPhone,
    businessName,
    reservationLine: adaptedReservationLine,
    simulation:      mode === "simulation",
    voiceClip:       clip
  });

  // Build relationship-aware transcript
  const transcript = buildRelationshipAwareTranscript(
    businessName,
    adaptedReservationLine,
    script
  );

  return {
    ...call,
    voice,
    clip,
    transcript,
    venueIntelligence: intelligence,
    adaptedScript:     script,
    relationshipLevel: script.relationshipLevel,
    toneUsed:          script.tone,
    languageUsed:      script.language,
  };
}

function buildRelationshipAwareTranscript(businessName, openingLine, script) {
  const base = [
    { speaker: businessName, text: `${script.greeting === "Hello" ? "Hello" : script.greeting + ","} this is ${businessName}. How can I help?` },
    { speaker: "AI",         text: openingLine },
    { speaker: businessName, text: "Of course. Let me check availability for you." },
  ];

  if (script.callCount >= 2 && script.relationshipLevel !== "new") {
    base.push({
      speaker: businessName,
      text: "We remember your preference — happy to accommodate you again."
    });
  }

  if (script.toneProfile?.assertiveness >= 3) {
    base.push(
      { speaker: "AI",         text: "I need this confirmed within the hour — can you do that?" },
      { speaker: businessName, text: "Yes, I'll hold that for you right now." }
    );
  } else {
    base.push(
      { speaker: businessName, text: "We look forward to seeing you." },
      { speaker: "AI",         text: "Perfect. Please hold it under Johnson." }
    );
  }

  return base;
}
