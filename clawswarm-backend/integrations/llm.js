async function callOpenAI(config, { system, prompt }) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openAiApiKey}`
    },
    body: JSON.stringify({
      model: config.openAiModel,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt }
      ],
      temperature: 0.4
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status}`);
  }

  const payload = await response.json();
  return payload.choices?.[0]?.message?.content?.trim() ?? "";
}

async function callAnthropic(config, { system, prompt }) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.anthropicApiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: config.anthropicModel,
      system,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic request failed: ${response.status}`);
  }

  const payload = await response.json();
  return payload.content?.find((item) => item.type === "text")?.text?.trim() ?? "";
}

export function createLlmGateway(config) {
  return {
    async generateText({ system, prompt, fallback }) {
      try {
        if (config.openAiApiKey) {
          const content = await callOpenAI(config, { system, prompt });
          if (content) {
            return content;
          }
        }

        if (config.anthropicApiKey) {
          const content = await callAnthropic(config, { system, prompt });
          if (content) {
            return content;
          }
        }
      } catch (error) {
        console.warn("LLM provider failed, using fallback output.", error);
      }

      return fallback;
    }
  };
}
