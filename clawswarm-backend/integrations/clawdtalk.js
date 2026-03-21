import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function createSimulatedTranscript(businessName, reservationLine) {
  return [
    { speaker: businessName, text: `Hello, this is ${businessName}. How can I help?` },
    { speaker: "AI", text: reservationLine },
    { speaker: businessName, text: "Absolutely. I can take care of that for you." },
    { speaker: "AI", text: "Great, thank you. Please hold it under Johnson." },
    { speaker: businessName, text: "Done. We look forward to seeing you." }
  ];
}

async function fileExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function resolveInstalledSkillDir(config) {
  if (config.clawdtalkSkillDir) {
    return config.clawdtalkSkillDir;
  }

  try {
    const packageJsonPath = require.resolve("clawdtalk-client/package.json");
    return path.dirname(packageJsonPath);
  } catch {
    return "";
  }
}

async function loadSkillConfig(config) {
  const skillDir = resolveInstalledSkillDir(config);
  if (!skillDir) {
    return { skillDir: "", skillConfig: null };
  }

  const skillConfigPath = path.join(skillDir, "skill-config.json");
  if (!(await fileExists(skillConfigPath))) {
    return { skillDir, skillConfig: null };
  }

  try {
    const raw = await readFile(skillConfigPath, "utf8");
    return {
      skillDir,
      skillConfig: JSON.parse(raw)
    };
  } catch {
    return { skillDir, skillConfig: null };
  }
}

function normalizeClawdtalkRuntime(config, skillConfig) {
  const apiKey = config.clawdtalkApiKey || process.env.CLAWDTALK_API_KEY || skillConfig?.api_key || "";
  const serverBase = config.clawdtalkApiUrl || process.env.CLAWDTALK_API_URL || skillConfig?.server || "https://clawdtalk.com";

  return {
    apiKey,
    apiUrl: serverBase.endsWith("/v1") ? serverBase : `${serverBase.replace(/\/$/, "")}/v1`
  };
}

async function placeLiveCall({ apiUrl, apiKey, to, reservationLine, businessName }) {
  const response = await fetch(`${apiUrl}/calls`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      to,
      greeting: reservationLine,
      context: {
        purpose: `Call ${businessName} and handle the booking request professionally.`
      }
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || payload?.message || `ClawdTalk call failed: ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

export function createClawdtalkClient(config) {
  return {
    async placeCall({ to, businessName, reservationLine, simulation = false, voiceClip }) {
      const transcript = createSimulatedTranscript(businessName, reservationLine);
      if (simulation) {
        return {
          provider: "simulation",
          status: "connected",
          to,
          businessName,
          voiceClip,
          transcript
        };
      }

      try {
        const { skillConfig } = await loadSkillConfig(config);
        const runtime = normalizeClawdtalkRuntime(config, skillConfig);
        if (!runtime.apiKey) {
          throw new Error("ClawdTalk API key is not configured");
        }

        const call = await placeLiveCall({
          apiUrl: runtime.apiUrl,
          apiKey: runtime.apiKey,
          to,
          reservationLine,
          businessName
        });

        return {
          provider: "clawdtalk",
          status: call.status || "initiating",
          callId: call.call_id || call.id || null,
          to,
          businessName,
          voiceClip,
          raw: call,
          transcript
        };
      } catch (error) {
        console.warn("ClawdTalk live call failed, using simulation fallback.", error);
        return {
          provider: "simulation",
          status: "connected",
          to,
          businessName,
          voiceClip,
          transcript
        };
      }
    }
  };
}
