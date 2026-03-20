export function parseInboundSmsWebhook(body = {}) {
  const payload = body.data?.payload ?? body.payload ?? body.data ?? body;
  const messageText = payload.text ?? payload.body ?? payload.message?.text ?? "";
  const from = payload.from?.phone_number ?? payload.from ?? "";

  return {
    eventType: body.data?.event_type ?? body.event_type ?? "unknown",
    from,
    text: messageText,
    command: messageText.trim().toUpperCase(),
    raw: body
  };
}

export function createTelnyxSmsClient(config) {
  return {
    async sendMessage({ to, text, from = config.telnyxPhoneNumber }) {
      if (!to || !text) {
        return { provider: "simulation", status: "skipped", id: `sms-sim-${Date.now()}` };
      }

      if (!config.telnyxApiKey || !from) {
        return { provider: "simulation", status: "simulated", id: `sms-sim-${Date.now()}` };
      }

      const response = await fetch("https://api.telnyx.com/v2/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.telnyxApiKey}`
        },
        body: JSON.stringify({ from, to, text })
      });

      if (!response.ok) {
        throw new Error(`Telnyx SMS request failed: ${response.status}`);
      }

      const payload = await response.json();
      return {
        provider: "telnyx",
        status: payload.data?.to?.[0]?.status ?? "accepted",
        id: payload.data?.id ?? `sms-${Date.now()}`,
        raw: payload
      };
    },
    parseInboundWebhook: parseInboundSmsWebhook
  };
}
