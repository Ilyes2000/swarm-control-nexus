import { useCallback, useRef } from "react";
import { useMission } from "@/contexts/MissionContext";
import {
  resumeAudio, startAmbient, stopAmbient,
  playBlip, playAgentActivate, playPhoneRing,
  playCallConnect, playCallEnd, playSMS,
  playMissionComplete, playTyping,
} from "@/lib/audio";

export function useDemoMode() {
  const {
    setMissionStatus, updateAgent, addTimelineEntry, updateTimelineEntry,
    setCall, addCallTranscript, addSMS, setSummary, addReasoning, addMemory,
    addSkill, addAdaptation, setTrainingMode,
    setDemoMode, setUserInput, resetMission,
  } = useMission();

  const timers = useRef<NodeJS.Timeout[]>([]);

  const clearAll = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const delay = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
  }, []);

  const startDemo = useCallback(() => {
    resetMission();
    setDemoMode(true);
    setUserInput("Plan a dinner and movie night for tonight");
    resumeAudio();

    // Seed memory with user preferences
    delay(() => {
      addMemory({ id: "m1", agentId: "planner", type: "preference", label: "Cuisine Preference", value: "Italian, Mediterranean — avoids spicy food", timestamp: "saved" });
      addMemory({ id: "m2", agentId: "planner", type: "preference", label: "Budget Range", value: "$80–$120 per evening for two", timestamp: "saved" });
      addMemory({ id: "m3", agentId: "planner", type: "context", label: "Location", value: "Downtown, within 2 mile radius", timestamp: "saved" });
      addMemory({ id: "m4", agentId: "planner", type: "decision", label: "Last Booking", value: "Chez Pierre — French, 3 weeks ago (rated 4/5)", timestamp: "Feb 26" });
    }, 300);

    delay(() => {
      setMissionStatus("live");
      startAmbient();
    }, 500);

    // Step 1: Planner activates
    delay(() => {
      playAgentActivate();
      updateAgent("planner", { status: "thinking", currentTask: "Analyzing request", liveText: "Breaking down mission into subtasks...", confidence: 78 });
      addTimelineEntry({ id: "t1", timestamp: "00:01", agentId: "planner", agentEmoji: "🧠", agentName: "Planner Agent", description: "Analyzing mission: dinner and movie night", status: "pending" });
      playBlip();
    }, 1500);

    delay(() => {
      playTyping();
      updateAgent("planner", { status: "speaking", liveText: "Created task graph: 1) Research restaurants 2) Find movies 3) Make reservations 4) Book tickets", confidence: 95 });
      addTimelineEntry({ id: "t2", timestamp: "00:03", agentId: "planner", agentEmoji: "🧠", agentName: "Planner Agent", description: "Task graph created with 4 subtasks", status: "success" });
      addReasoning({
        id: "r1", agentId: "planner", agentEmoji: "🧠", agentName: "Planner Agent", timestamp: "00:03",
        decision: "Decomposed into 4 parallel subtasks",
        reasoning: "Dinner + movie requires sequential booking (dinner first to set timeline). Research must precede calls. Negotiation can run after research completes.",
        confidence: 95,
        alternatives: ["Single sequential pipeline (slower)", "3-task split without negotiation", "Parallel restaurant + movie research"],
      });
      addMemory({ id: "m5", agentId: "planner", type: "decision", label: "Task Decomposition", value: "4-task parallel graph with dependency chain", timestamp: "00:03" });
      playBlip();
    }, 3500);

    // Step 2: Research agent — with listening state
    delay(() => {
      playAgentActivate();
      updateAgent("planner", { status: "idle", liveText: "", currentTask: "", confidence: 0 });
      updateAgent("research", { status: "listening", listeningTo: "Planner Agent", currentTask: "Receiving task brief", liveText: "", confidence: 0 });
    }, 5000);

    delay(() => {
      updateAgent("research", { status: "thinking", listeningTo: null, currentTask: "Finding restaurants & movies", liveText: "Searching for top-rated Italian restaurants nearby...", confidence: 65 });
      addTimelineEntry({ id: "t3", timestamp: "00:05", agentId: "research", agentEmoji: "🔍", agentName: "Research Agent", description: "Searching restaurants and movie listings", status: "pending" });
      playBlip();
    }, 5800);

    // RETRY: First attempt fails — triggers learning loop
    delay(() => {
      updateAgent("research", { liveText: "Error: Yelp API rate limit exceeded", confidence: 30 });
      addTimelineEntry({ id: "t3f", timestamp: "00:06", agentId: "research", agentEmoji: "🔍", agentName: "Research Agent", description: "Yelp API rate limit — request failed", status: "failed" });
      addAdaptation({ id: "a1", message: "🧠 Analyzing failure...", timestamp: "00:06", type: "learning" });
      playBlip();
    }, 6800);

    delay(() => {
      addAdaptation({ id: "a2", message: "⚡ New skill created: API Fallback Strategy", timestamp: "00:07", type: "evolved" });
      addSkill({ id: "sk1", title: "API Fallback Strategy", description: "When primary API fails with rate limit, automatically switch to Google Places as fallback provider", source: "Yelp API failure", version: 1, usageCount: 0, createdAt: "00:07", agentId: "research" });
      addTimelineEntry({ id: "t3l", timestamp: "00:07", agentId: "research", agentEmoji: "🧠", agentName: "System", description: "Learning from failure... New skill acquired", status: "fallback" });
      updateAgent("research", { status: "retrying", liveText: "Switching to Google Places fallback...", confidence: 55 });
      addTimelineEntry({ id: "t3r", timestamp: "00:07", agentId: "research", agentEmoji: "🔍", agentName: "Research Agent", description: "Retrying with Google Places API (fallback)", status: "retrying", retryCount: 1 });
    }, 7500);

    delay(() => {
      playTyping();
      updateAgent("research", { status: "speaking", liveText: "Found: La Bella Vita (4.8★), The Grand Cinema showing 'Inception' at 9PM", confidence: 92 });
      addTimelineEntry({ id: "t4", timestamp: "00:08", agentId: "research", agentEmoji: "🔍", agentName: "Research Agent", description: "Found La Bella Vita (4.8★) + Inception at 9PM via fallback", status: "success" });
      addReasoning({
        id: "r2", agentId: "research", agentEmoji: "🔍", agentName: "Research Agent", timestamp: "00:08",
        decision: "Selected La Bella Vita over 12 other options",
        reasoning: "Ranked by composite score: rating (4.8★ × 0.4) + proximity (0.8mi × 0.3) + availability (tonight × 0.2) + cuisine match (Italian × 0.1). Auto-retried via Google Places after Yelp failure.",
        confidence: 92,
        alternatives: ["Chez Pierre (4.6★, French, 1.2mi)", "Sakura Garden (4.9★, Japanese, 2.5mi — too far)"],
      });
      addMemory({ id: "m6", agentId: "research", type: "context", label: "API Fallback Used", value: "Yelp → Google Places (rate limit hit)", timestamp: "00:08" });
      playBlip();
    }, 8500);

    // Step 3: Call agent — listens to research first
    delay(() => {
      updateAgent("research", { status: "idle", liveText: "", currentTask: "", confidence: 0 });
      updateAgent("call", { status: "listening", listeningTo: "Research Agent", liveText: "", confidence: 0 });
    }, 9500);

    delay(() => {
      playAgentActivate();
      updateAgent("call", { status: "calling", listeningTo: null, currentTask: "Calling restaurant", liveText: "Dialing La Bella Vita...", confidence: 75 });
      addTimelineEntry({ id: "t5", timestamp: "00:10", agentId: "call", agentEmoji: "📞", agentName: "Call Agent", description: "Calling La Bella Vita for reservation", status: "pending" });
      playBlip();
      setCall({ active: true, caller: "Call Agent", receiver: "La Bella Vita", duration: 0, transcript: [], status: "ringing" });
      playPhoneRing();
    }, 10500);

    delay(() => {
      playCallConnect();
      updateAgent("call", { confidence: 82 });
      setCall({ active: true, caller: "Call Agent", receiver: "La Bella Vita", duration: 3, transcript: [], status: "connected" });
      addCallTranscript("La Bella Vita", "Good evening, La Bella Vita, how may I help you?");
    }, 12500);

    delay(() => {
      playTyping();
      addCallTranscript("Call Agent", "Hi, I'd like to make a reservation for two tonight at 7 PM please.");
      updateAgent("call", { liveText: "Requesting table for two at 7 PM..." });
    }, 14500);

    delay(() => {
      playTyping();
      addCallTranscript("La Bella Vita", "Let me check... Yes, we have a window table available at 7 PM.");
      updateAgent("call", { confidence: 90 });
    }, 16500);

    delay(() => {
      playTyping();
      addCallTranscript("Call Agent", "That would be perfect. Could you hold it under the name 'Johnson'?");
    }, 18000);

    delay(() => {
      playTyping();
      addCallTranscript("La Bella Vita", "Of course! Table for two at 7 PM under Johnson. See you tonight!");
      addCallTranscript("Call Agent", "Thank you! Have a great evening.");
    }, 19500);

    delay(() => {
      playCallEnd();
      updateAgent("call", { status: "idle", liveText: "", currentTask: "", confidence: 0 });
      setCall({ active: true, caller: "Call Agent", receiver: "La Bella Vita", duration: 12, transcript: [], status: "ended" });
      addTimelineEntry({ id: "t6", timestamp: "00:14", agentId: "call", agentEmoji: "📞", agentName: "Call Agent", description: "Reservation confirmed: 7 PM, table for 2", status: "success" });
      addReasoning({
        id: "r3", agentId: "call", agentEmoji: "📞", agentName: "Call Agent", timestamp: "00:14",
        decision: "Used phone call instead of online booking",
        reasoning: "La Bella Vita's online reservation system showed 'unavailable'. Phone call bypasses web limits — hosts hold tables for phone requests. Window table secured that wasn't listed online.",
        confidence: 88,
        alternatives: ["OpenTable (no availability)", "Walk-in (no guarantee)", "Different restaurant"],
      });
      addMemory({ id: "m7", agentId: "call", type: "decision", label: "Booking Method", value: "Phone call (online unavailable) — window table secured", timestamp: "00:14" });
      playBlip();
    }, 21000);

    // Step 4: Negotiation agent — listens to call result
    delay(() => {
      updateAgent("negotiation", { status: "listening", listeningTo: "Call Agent", confidence: 0 });
    }, 21500);

    delay(() => {
      playAgentActivate();
      updateAgent("negotiation", { status: "thinking", listeningTo: null, currentTask: "Optimizing costs", liveText: "Checking for dinner deals and movie discounts...", confidence: 70 });
      addTimelineEntry({ id: "t7", timestamp: "00:16", agentId: "negotiation", agentEmoji: "💰", agentName: "Negotiation Agent", description: "Searching for deals and discounts", status: "pending" });
      playBlip();
    }, 22500);

    delay(() => {
      playTyping();
      updateAgent("negotiation", { status: "speaking", liveText: "Found 15% off dinner with promo code NIGHT15 + $2 off movie tickets on Fandango", confidence: 97 });
      addTimelineEntry({ id: "t8", timestamp: "00:18", agentId: "negotiation", agentEmoji: "💰", agentName: "Negotiation Agent", description: "Saved $18.50 with combined deals", status: "success" });
      addReasoning({
        id: "r4", agentId: "negotiation", agentEmoji: "💰", agentName: "Negotiation Agent", timestamp: "00:18",
        decision: "Applied NIGHT15 promo + Fandango discount stack",
        reasoning: "Cross-referenced 8 coupon databases and 3 cashback platforms. NIGHT15 (15% off) is the highest valid dinner promo. Fandango $2 off is stackable. Combined savings of $18.50 (16.1% total discount).",
        confidence: 97,
        alternatives: ["Groupon deal (12% off, requires prepay)", "Restaurant loyalty program (5%)", "Full price"],
      });
      playBlip();
    }, 24500);

    // Step 5: Scheduler
    delay(() => {
      updateAgent("negotiation", { status: "idle", liveText: "", currentTask: "", confidence: 0 });
      updateAgent("scheduler", { status: "listening", listeningTo: "Negotiation Agent", confidence: 0 });
    }, 25500);

    delay(() => {
      playAgentActivate();
      updateAgent("scheduler", { status: "thinking", listeningTo: null, currentTask: "Creating itinerary", liveText: "Building optimal timeline...", confidence: 80 });
      addTimelineEntry({ id: "t9", timestamp: "00:20", agentId: "scheduler", agentEmoji: "📅", agentName: "Scheduler Agent", description: "Creating optimized itinerary", status: "pending" });
      playBlip();
    }, 26500);

    delay(() => {
      playTyping();
      updateAgent("scheduler", { status: "speaking", liveText: "Itinerary: 7PM Dinner → 8:45PM Travel → 9PM Movie", confidence: 91 });
      addTimelineEntry({ id: "t10", timestamp: "00:22", agentId: "scheduler", agentEmoji: "📅", agentName: "Scheduler Agent", description: "Itinerary finalized", status: "success" });
      addReasoning({
        id: "r5", agentId: "scheduler", agentEmoji: "📅", agentName: "Scheduler Agent", timestamp: "00:22",
        decision: "7 PM dinner → 9 PM movie with 15min buffer",
        reasoning: "Average Italian dinner: 75min. Travel: 12min by car. 7 PM start → 105min total, 15min buffer at cinema.",
        confidence: 91,
        alternatives: ["6:30 PM (too early)", "7:30 PM (8min buffer — tight)", "9:30 PM show (late return)"],
      });
      addMemory({ id: "m8", agentId: "scheduler", type: "decision", label: "Itinerary", value: "7PM Dinner → 8:45PM Travel → 9PM Movie (15min buffer)", timestamp: "00:22" });
      playBlip();

      playSMS();
      addSMS({ id: "s1", from: "ClawSwarm", text: "🎉 Your evening is planned!\n\n🍝 7:00 PM — Dinner at La Bella Vita\n🎬 9:00 PM — Inception at The Grand Cinema\n\nTotal saved: $18.50!", timestamp: "8:22 PM", direction: "sent" });
    }, 28500);

    delay(() => {
      playSMS();
      addSMS({ id: "s2", from: "User", text: "This looks perfect! Thanks! 🙌", timestamp: "8:23 PM", direction: "received" });
      updateAgent("scheduler", { status: "idle", liveText: "", currentTask: "", confidence: 0 });
    }, 30500);

    // Mission complete
    delay(() => {
      playMissionComplete();
      setMissionStatus("completed");
      setSummary({
        visible: true,
        result: "Dinner & movie night planned successfully! Table reserved at La Bella Vita for 7 PM, Inception tickets booked for 9 PM at The Grand Cinema.",
        costBreakdown: [
          { label: "Dinner (2 persons)", amount: "$85.00" },
          { label: "Promo discount", amount: "-$12.75" },
          { label: "Movie tickets (2x)", amount: "$28.00" },
          { label: "Fandango discount", amount: "-$4.00" },
          { label: "Total", amount: "$96.25" },
        ],
        timeTaken: "24 seconds",
        optimization: {
          originalCost: "$114.75",
          optimizedCost: "$96.25",
          savedAmount: "$18.50",
          savedPercent: "16.1% savings",
          tradeoffs: [
            { label: "Restaurant", original: "First available", optimized: "Best rated (4.8★)" },
            { label: "Booking", original: "Online ($5 fee)", optimized: "Phone (free)" },
            { label: "Tickets", original: "Box office", optimized: "Fandango (-$4)" },
          ],
        },
      });
      addTimelineEntry({ id: "t11", timestamp: "00:24", agentId: "planner", agentEmoji: "🧠", agentName: "Planner Agent", description: "Mission completed successfully ✨", status: "success" });
      playBlip();
      setTimeout(() => stopAmbient(), 3000);
    }, 33000);
  }, [resetMission, setDemoMode, setUserInput, delay, setMissionStatus, updateAgent, addTimelineEntry, updateTimelineEntry, setCall, addCallTranscript, addSMS, setSummary, addReasoning, addMemory]);

  const interruptMission = useCallback((command: string) => {
    clearAll();
    playAgentActivate();
    addTimelineEntry({ id: `int-${Date.now()}`, timestamp: "⚡", agentId: "planner", agentEmoji: "⚡", agentName: "User Interrupt", description: `"${command}"`, status: "pending" });

    delay(() => {
      playAgentActivate();
      updateAgent("planner", { status: "thinking", currentTask: "Re-planning mission", liveText: `Processing interrupt: "${command}"`, confidence: 72 });
      addTimelineEntry({ id: `int-plan-${Date.now()}`, timestamp: "⚡+1", agentId: "planner", agentEmoji: "🧠", agentName: "Planner Agent", description: "Re-evaluating mission with new constraint", status: "pending" });
    }, 800);

    delay(() => {
      playTyping();
      updateAgent("planner", { status: "speaking", liveText: `Adapting plan: "${command}" — reassigning agents...`, confidence: 85 });
      addReasoning({
        id: `r-int-${Date.now()}`, agentId: "planner", agentEmoji: "🧠", agentName: "Planner Agent", timestamp: "⚡+2",
        decision: `Accepted user override: "${command}"`,
        reasoning: "User interrupt received mid-mission. Halted pending actions. Re-evaluating task graph with new constraint.",
        confidence: 85, alternatives: ["Ignore interrupt", "Queue for after current task"],
      });
      addMemory({ id: `m-int-${Date.now()}`, agentId: "planner", type: "context", label: "User Interrupt", value: command, timestamp: "⚡+2" });
      playBlip();
    }, 2500);

    delay(() => {
      playAgentActivate();
      updateAgent("planner", { status: "idle", liveText: "", currentTask: "", confidence: 0 });
      updateAgent("research", { status: "thinking", currentTask: "Searching alternatives", liveText: `Finding options matching: "${command}"`, confidence: 60 });
      addTimelineEntry({ id: `int-r-${Date.now()}`, timestamp: "⚡+3", agentId: "research", agentEmoji: "🔍", agentName: "Research Agent", description: `Searching alternatives: "${command}"`, status: "pending" });
      playBlip();
    }, 4000);

    delay(() => {
      playTyping();
      updateAgent("research", { status: "speaking", liveText: "Found 3 matching alternatives. Updating...", confidence: 89 });
      addTimelineEntry({ id: `int-rd-${Date.now()}`, timestamp: "⚡+5", agentId: "research", agentEmoji: "🔍", agentName: "Research Agent", description: "Updated options found", status: "success" });
      playBlip();
    }, 6500);

    delay(() => {
      updateAgent("research", { status: "idle", liveText: "", currentTask: "", confidence: 0 });
      updateAgent("negotiation", { status: "thinking", currentTask: "Re-checking deals", liveText: "Validating discounts...", confidence: 75 });
    }, 8000);

    delay(() => {
      playTyping();
      updateAgent("negotiation", { status: "speaking", liveText: "Updated deal applied!", confidence: 93 });
      addTimelineEntry({ id: `int-n-${Date.now()}`, timestamp: "⚡+7", agentId: "negotiation", agentEmoji: "💰", agentName: "Negotiation Agent", description: "Deals re-validated for updated plan", status: "success" });
      playBlip();
    }, 10000);

    delay(() => {
      updateAgent("negotiation", { status: "idle", liveText: "", currentTask: "", confidence: 0 });
      playSMS();
      addSMS({
        id: `sms-int-${Date.now()}`, from: "ClawSwarm",
        timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        text: `📝 Plan updated!\n\nYour request: "${command}"\n\n✅ Mission adapted successfully.`,
        direction: "sent",
      });
      addTimelineEntry({ id: `int-d-${Date.now()}`, timestamp: "⚡+9", agentId: "planner", agentEmoji: "🧠", agentName: "Planner Agent", description: "Mission re-planned successfully ✨", status: "success" });
      playMissionComplete();
    }, 12000);
  }, [clearAll, delay, updateAgent, addTimelineEntry, addReasoning, addSMS, addMemory]);

  const stopDemo = useCallback(() => {
    clearAll();
    stopAmbient();
    resetMission();
  }, [clearAll, resetMission]);

  return { startDemo, stopDemo, interruptMission };
}
