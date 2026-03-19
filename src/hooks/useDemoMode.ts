import { useCallback, useRef } from "react";
import { useMission } from "@/contexts/MissionContext";

export function useDemoMode() {
  const {
    setMissionStatus,
    updateAgent,
    addTimelineEntry,
    setCall,
    addCallTranscript,
    addSMS,
    setSummary,
    setDemoMode,
    setUserInput,
    resetMission,
  } = useMission();

  const timers = useRef<NodeJS.Timeout[]>([]);

  const clearAll = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  const delay = useCallback(
    (fn: () => void, ms: number) => {
      const t = setTimeout(fn, ms);
      timers.current.push(t);
    },
    []
  );

  const startDemo = useCallback(() => {
    resetMission();
    setDemoMode(true);
    setUserInput("Plan a dinner and movie night for tonight");

    delay(() => setMissionStatus("live"), 500);

    // Step 1: Planner activates
    delay(() => {
      updateAgent("planner", { status: "thinking", currentTask: "Analyzing request", liveText: "Breaking down mission into subtasks..." });
      addTimelineEntry({ id: "t1", timestamp: "00:01", agentId: "planner", agentEmoji: "🧠", agentName: "Planner Agent", description: "Analyzing mission: dinner and movie night", status: "pending" });
    }, 1500);

    delay(() => {
      updateAgent("planner", { status: "speaking", liveText: "Created task graph: 1) Research restaurants 2) Find movies 3) Make reservations 4) Book tickets" });
      addTimelineEntry({ id: "t2", timestamp: "00:03", agentId: "planner", agentEmoji: "🧠", agentName: "Planner Agent", description: "Task graph created with 4 subtasks", status: "success" });
    }, 3500);

    // Step 2: Research agent
    delay(() => {
      updateAgent("planner", { status: "idle", liveText: "", currentTask: "" });
      updateAgent("research", { status: "thinking", currentTask: "Finding restaurants & movies", liveText: "Searching for top-rated Italian restaurants nearby..." });
      addTimelineEntry({ id: "t3", timestamp: "00:05", agentId: "research", agentEmoji: "🔍", agentName: "Research Agent", description: "Searching restaurants and movie listings", status: "pending" });
    }, 5500);

    delay(() => {
      updateAgent("research", { status: "speaking", liveText: "Found: La Bella Vita (4.8★), The Grand Cinema showing 'Inception' at 9PM" });
      addTimelineEntry({ id: "t4", timestamp: "00:08", agentId: "research", agentEmoji: "🔍", agentName: "Research Agent", description: "Found La Bella Vita (4.8★) + Inception at 9PM", status: "success" });
    }, 8000);

    // Step 3: Call agent
    delay(() => {
      updateAgent("research", { status: "idle", liveText: "", currentTask: "" });
      updateAgent("call", { status: "calling", currentTask: "Calling restaurant", liveText: "Dialing La Bella Vita..." });
      addTimelineEntry({ id: "t5", timestamp: "00:10", agentId: "call", agentEmoji: "📞", agentName: "Call Agent", description: "Calling La Bella Vita for reservation", status: "pending" });

      setCall({ active: true, caller: "Call Agent", receiver: "La Bella Vita", duration: 0, transcript: [], status: "ringing" });
    }, 10000);

    delay(() => {
      setCall({ active: true, caller: "Call Agent", receiver: "La Bella Vita", duration: 3, transcript: [], status: "connected" });
      addCallTranscript("La Bella Vita", "Good evening, La Bella Vita, how may I help you?");
    }, 12000);

    delay(() => {
      addCallTranscript("Call Agent", "Hi, I'd like to make a reservation for two tonight at 7 PM please.");
      updateAgent("call", { liveText: "Requesting table for two at 7 PM..." });
    }, 14000);

    delay(() => {
      addCallTranscript("La Bella Vita", "Let me check... Yes, we have a window table available at 7 PM.");
    }, 16000);

    delay(() => {
      addCallTranscript("Call Agent", "That would be perfect. Could you hold it under the name 'Johnson'?");
    }, 17500);

    delay(() => {
      addCallTranscript("La Bella Vita", "Of course! Table for two at 7 PM under Johnson. See you tonight!");
      addCallTranscript("Call Agent", "Thank you! Have a great evening.");
    }, 19000);

    delay(() => {
      setCall({ active: true, caller: "Call Agent", receiver: "La Bella Vita", duration: 12, transcript: [], status: "ended" });
      updateAgent("call", { status: "idle", liveText: "", currentTask: "" });
      addTimelineEntry({ id: "t6", timestamp: "00:14", agentId: "call", agentEmoji: "📞", agentName: "Call Agent", description: "Reservation confirmed: 7 PM, table for 2", status: "success" });
    }, 20500);

    // Step 4: Negotiation agent
    delay(() => {
      updateAgent("negotiation", { status: "thinking", currentTask: "Optimizing costs", liveText: "Checking for dinner deals and movie discounts..." });
      addTimelineEntry({ id: "t7", timestamp: "00:16", agentId: "negotiation", agentEmoji: "💰", agentName: "Negotiation Agent", description: "Searching for deals and discounts", status: "pending" });
    }, 21500);

    delay(() => {
      updateAgent("negotiation", { status: "speaking", liveText: "Found 15% off dinner with promo code NIGHT15 + $2 off movie tickets on Fandango" });
      addTimelineEntry({ id: "t8", timestamp: "00:18", agentId: "negotiation", agentEmoji: "💰", agentName: "Negotiation Agent", description: "Saved $18.50 with combined deals", status: "success" });
    }, 23500);

    // Step 5: Scheduler & SMS
    delay(() => {
      updateAgent("negotiation", { status: "idle", liveText: "", currentTask: "" });
      updateAgent("scheduler", { status: "thinking", currentTask: "Creating itinerary", liveText: "Building optimal timeline..." });
      addTimelineEntry({ id: "t9", timestamp: "00:20", agentId: "scheduler", agentEmoji: "📅", agentName: "Scheduler Agent", description: "Creating optimized itinerary", status: "pending" });
    }, 25000);

    delay(() => {
      updateAgent("scheduler", { status: "speaking", liveText: "Itinerary: 7PM Dinner → 8:45PM Travel → 9PM Movie" });
      addTimelineEntry({ id: "t10", timestamp: "00:22", agentId: "scheduler", agentEmoji: "📅", agentName: "Scheduler Agent", description: "Itinerary finalized", status: "success" });

      addSMS({ id: "s1", from: "ClawSwarm", text: "🎉 Your evening is planned!\n\n🍝 7:00 PM — Dinner at La Bella Vita\n🎬 9:00 PM — Inception at The Grand Cinema\n\nTotal saved: $18.50!", timestamp: "8:22 PM", direction: "sent" });
    }, 27000);

    delay(() => {
      addSMS({ id: "s2", from: "User", text: "This looks perfect! Thanks! 🙌", timestamp: "8:23 PM", direction: "received" });
      updateAgent("scheduler", { status: "idle", liveText: "", currentTask: "" });
    }, 29000);

    // Mission complete
    delay(() => {
      setMissionStatus("completed");
      setSummary({
        visible: true,
        result: "Dinner & movie night planned successfully! Table reserved at La Bella Vita for 7 PM, Inception tickets booked for 9 PM at The Grand Cinema.",
        costBreakdown: [
          { label: "Dinner (2 persons)", amount: "$85.00" },
          { label: "Promo discount (NIGHT15)", amount: "-$12.75" },
          { label: "Movie tickets (2x)", amount: "$28.00" },
          { label: "Fandango discount", amount: "-$4.00" },
          { label: "Total", amount: "$96.25" },
        ],
        timeTaken: "22 seconds",
      });
      addTimelineEntry({ id: "t11", timestamp: "00:24", agentId: "planner", agentEmoji: "🧠", agentName: "Planner Agent", description: "Mission completed successfully ✨", status: "success" });
    }, 31000);
  }, [resetMission, setDemoMode, setUserInput, delay, setMissionStatus, updateAgent, addTimelineEntry, setCall, addCallTranscript, addSMS, setSummary]);

  const stopDemo = useCallback(() => {
    clearAll();
    resetMission();
  }, [clearAll, resetMission]);

  return { startDemo, stopDemo };
}
