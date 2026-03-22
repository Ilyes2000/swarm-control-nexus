export function createResembleClient(config) {
  let cachedFallbackVoice = null;

  return {
    async cloneVoice({ name, sampleUrl, description }) {
      if (!config.resembleApiKey || !sampleUrl) {
        if (!cachedFallbackVoice || cachedFallbackVoice.name !== name) {
          cachedFallbackVoice = { provider: "simulation", voiceId: "demo-voice", name };
        }
        return cachedFallbackVoice;
      }

      try {
        const response = await fetch("https://app.resemble.ai/api/v1/voices", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${config.resembleApiKey}`
          },
          body: JSON.stringify({
            name,
            description,
            sample_url: sampleUrl
          })
        });

        if (!response.ok) {
          throw new Error(`Resemble voice creation failed: ${response.status}`);
        }

        const payload = await response.json();
        return {
          provider: "resemble",
          voiceId: payload.item?.uuid ?? payload.id ?? "resemble-voice",
          name
        };
      } catch (error) {
        console.warn("Resemble voice clone failed, using simulation voice.", error);
        return { provider: "simulation", voiceId: "demo-voice", name };
      }
    },
    async generateSpeechClip({ projectId = config.resembleProjectId, text, voiceId }) {
      if (!config.resembleApiKey || !projectId) {
        return { provider: "simulation", clipId: `clip-sim-${Date.now()}`, audioUrl: "", text, voiceId };
      }

      try {
        const response = await fetch(`https://app.resemble.ai/api/v1/projects/${projectId}/clips`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${config.resembleApiKey}`
          },
          body: JSON.stringify({
            body: text,
            voice_uuid: voiceId
          })
        });

        if (!response.ok) {
          throw new Error(`Resemble clip generation failed: ${response.status}`);
        }

        const payload = await response.json();
        return {
          provider: "resemble",
          clipId: payload.item?.uuid ?? payload.id ?? `clip-${Date.now()}`,
          audioUrl: payload.item?.audio_src ?? "",
          text,
          voiceId
        };
      } catch (error) {
        console.warn("Resemble clip generation failed, using simulation clip.", error);
        return { provider: "simulation", clipId: `clip-sim-${Date.now()}`, audioUrl: "", text, voiceId };
      }
    }
  };
}
