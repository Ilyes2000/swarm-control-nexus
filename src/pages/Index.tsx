import { MissionProvider } from "@/contexts/MissionContext";
import { Header } from "@/components/dashboard/Header";
import { AgentPanel } from "@/components/dashboard/AgentPanel";
import { MissionTimeline } from "@/components/dashboard/MissionTimeline";
import { CommPanel } from "@/components/dashboard/CommPanel";
import { MissionSummary } from "@/components/dashboard/MissionSummary";

const Index = () => {
  return (
    <MissionProvider>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <Header />

        <div className="flex-1 grid grid-cols-[280px_1fr_280px] gap-3 p-3 min-h-0">
          {/* Left — Agent Swarm */}
          <div className="glass-panel p-3 overflow-hidden">
            <AgentPanel />
          </div>

          {/* Center — Timeline */}
          <div className="glass-panel p-4 overflow-hidden">
            <MissionTimeline />
          </div>

          {/* Right — Comms */}
          <div className="glass-panel p-3 overflow-hidden">
            <CommPanel />
          </div>
        </div>

        {/* Bottom — Mission Summary */}
        <div className="px-3 pb-3">
          <MissionSummary />
        </div>
      </div>
    </MissionProvider>
  );
};

export default Index;
