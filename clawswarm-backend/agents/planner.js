export async function runPlannerAgent({ missionText, llm }) {
  const text = missionText.toLowerCase();

  const taskMap = {
    hotel:         ["Search available hotels", "Check room types and pricing", "Verify amenities", "Book room", "Confirm reservation"],
    shopping:      ["Identify target stores", "Check store hours and inventory", "Contact store for availability", "Reserve or hold items", "Confirm pickup/delivery"],
    travel:        ["Search flight options", "Compare prices and times", "Book selected flight", "Send confirmation", "Add to calendar"],
    entertainment: ["Search event listings", "Check seat availability", "Book best available seats", "Send tickets", "Add showtime to calendar"],
    spa:           ["Search spa options", "Check availability for requested service", "Book appointment slot", "Confirm booking", "Send reminder"],
    sport:         ["Find fitness venues", "Check class schedule", "Book session or class", "Confirm booking", "Add to calendar"],
    medical:       ["Find available providers", "Check appointment availability", "Book appointment", "Confirm with patient info", "Send reminder"],
    default:       ["Research options", "Contact best match", "Negotiate best terms", "Confirm booking", "Build final plan"],
  };

  const detectedType = Object.keys(taskMap).find(k => k !== "default" && text.includes(k)) || "default";
  const tasks = taskMap[detectedType] || taskMap.default;

  const fallbackLiveText = `Created task graph for ${detectedType}: ${tasks.slice(0, 3).join(", ")}.`;
  const liveText = await llm.generateText({
    system: "Produce one concise operational planning sentence.",
    prompt: `Mission type: ${detectedType}\nMission: ${missionText}\nTasks: ${tasks.join(", ")}`,
    fallback: fallbackLiveText,
  });

  return {
    tasks,
    missionType: detectedType,
    liveText,
    reasoning: `Mission classified as ${detectedType}. Plan sequenced for optimal execution: research first, then outreach, then confirmation.`,
    confidence: 94,
  };
}
