export async function runCallerAgent({
  businessName,
  businessPhone,
  reservationLine,
  mode,
  clawdtalk,
  resemble,
  missionVoiceName
}) {
  const voice = await resemble.cloneVoice({
    name: missionVoiceName,
    sampleUrl: "",
    description: `Mission concierge voice for ${businessName}`
  });

  const clip = await resemble.generateSpeechClip({
    text: reservationLine,
    voiceId: voice.voiceId
  });

  const call = await clawdtalk.placeCall({
    to: businessPhone,
    businessName,
    reservationLine,
    simulation: mode === "simulation",
    voiceClip: clip
  });

  return {
    ...call,
    voice,
    clip
  };
}
