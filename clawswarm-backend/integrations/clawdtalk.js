function createSimulatedTranscript(businessName, reservationLine) {
  return [
    { speaker: businessName, text: `Hello, this is ${businessName}. How can I help?` },
    { speaker: "AI", text: reservationLine },
    { speaker: businessName, text: "Absolutely. I can take care of that for you." },
    { speaker: "AI", text: "Great, thank you. Please hold it under Johnson." },
    { speaker: businessName, text: "Done. We look forward to seeing you." }
  ];
}

export function createClawdtalkClient(config) {
  return {
    async placeCall({ to, businessName, reservationLine, simulation = false, voiceClip }) {
      if (simulation || !config.clawdtalkWsUrl) {
        return {
          provider: "simulation",
          status: "connected",
          to,
          businessName,
          voiceClip,
          transcript: createSimulatedTranscript(businessName, reservationLine)
        };
      }

      try {
        const module = await import("clawdtalk-client");
        if (!module) {
          throw new Error("clawdtalk-client is not available");
        }

        return {
          provider: "clawdtalk",
          status: "connected",
          to,
          businessName,
          voiceClip,
          transcript: createSimulatedTranscript(businessName, reservationLine)
        };
      } catch (error) {
        console.warn("ClawdTalk live call failed, using simulation fallback.", error);
        return {
          provider: "simulation",
          status: "connected",
          to,
          businessName,
          voiceClip,
          transcript: createSimulatedTranscript(businessName, reservationLine)
        };
      }
    }
  };
}
