export function loadConfig() {
  return {
    port: Number(process.env.PORT ?? 8787),
    corsOrigin: process.env.CORS_ORIGIN ?? "*",
    simulationDelayMs: Number(process.env.SIMULATION_DELAY_MS ?? 350),
    userPhoneNumber: process.env.USER_PHONE_NUMBER ?? "",
    resembleProjectId: process.env.RESEMBLE_PROJECT_ID ?? "",
    telnyxApiKey: process.env.TELNYX_API_KEY ?? "",
    telnyxPhoneNumber: process.env.TELNYX_PHONE_NUMBER ?? "",
    resembleApiKey: process.env.RESEMBLE_API_KEY ?? "",
    openAiApiKey: process.env.OPENAI_API_KEY ?? "",
    openAiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
    anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest",
    clawdtalkWsUrl: process.env.CLAWDTALK_WS_URL ?? "",
    clawdtalkPhoneNumber: process.env.CLAWDTALK_PHONE_NUMBER ?? "",
    missionVoiceName: process.env.RESEMBLE_VOICE_NAME ?? "ClawSwarm Concierge"
  };
}
