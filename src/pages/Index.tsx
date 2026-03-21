import { useState } from "react";
import { Link } from "react-router-dom";
import { MissionProvider } from "@/contexts/MissionContext";
import { Header } from "@/components/dashboard/Header";
import { AgentPanel } from "@/components/dashboard/AgentPanel";
import { MissionTimeline } from "@/components/dashboard/MissionTimeline";
import { CommPanel } from "@/components/dashboard/CommPanel";
import { ExplainabilityPanel } from "@/components/dashboard/ExplainabilityPanel";
import { MemoryPanel } from "@/components/dashboard/MemoryPanel";
import { MissionSummary } from "@/components/dashboard/MissionSummary";
import { SkillLibrary } from "@/components/dashboard/SkillLibrary";
import { AgentNetworkGraph } from "@/components/dashboard/AgentNetworkGraph";

function MissionDashboard() {
  const [bottomPanel, setBottomPanel] = useState<"reasoning" | "memory" | "skills">("reasoning");

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header />

      <div className="flex-1 grid grid-cols-[220px_1fr_260px] gap-2 p-2 min-h-0">
        <div className="flex flex-col gap-2 min-h-0">
          <div className="glass-panel p-2.5 overflow-hidden flex-1">
            <AgentPanel />
          </div>
          <div className="glass-panel p-1 overflow-hidden h-[220px]">
            <AgentNetworkGraph />
          </div>
        </div>

        <div className="glass-panel p-3 overflow-hidden">
          <MissionTimeline />
        </div>

        <div className="flex flex-col gap-2 min-h-0">
          <div className="glass-panel p-2.5 flex-1 overflow-hidden">
            <CommPanel />
          </div>
          <div className="glass-panel p-2.5 flex-1 overflow-hidden">
            <div className="flex items-center gap-1 mb-2">
              <button
                onClick={() => setBottomPanel("reasoning")}
                className={`text-[9px] font-mono px-2 py-0.5 rounded transition-colors ${
                  bottomPanel === "reasoning" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Reasoning
              </button>
              <button
                onClick={() => setBottomPanel("memory")}
                className={`text-[9px] font-mono px-2 py-0.5 rounded transition-colors ${
                  bottomPanel === "memory" ? "bg-secondary/20 text-secondary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Memory
              </button>
              <button
                onClick={() => setBottomPanel("skills")}
                className={`text-[9px] font-mono px-2 py-0.5 rounded transition-colors ${
                  bottomPanel === "skills" ? "bg-neon-cyan/20 text-neon-cyan" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Skills
              </button>
            </div>
            <div className="h-[calc(100%-28px)] overflow-hidden">
              {bottomPanel === "reasoning" ? <ExplainabilityPanel /> : bottomPanel === "memory" ? <MemoryPanel /> : <SkillLibrary />}
            </div>
          </div>
        </div>
      </div>

      <div className="px-2 pb-2">
        <MissionSummary />
      </div>
    </div>
  );
}

const Index = () => {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <div className="flex items-center justify-between px-2 pt-2 pb-0">
        <div className="inline-flex items-center rounded-t-lg border border-border/30 border-b-0 bg-card/80 px-3 py-1 text-[10px] font-mono text-foreground">
          mission-control
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="rounded-md border border-border/30 bg-card/60 px-2.5 py-1 text-[10px] font-mono text-muted-foreground transition-colors hover:text-foreground"
          >
            product-home
          </Link>
          <Link
            to="/study"
            className="rounded-md border border-border/30 bg-card/60 px-2.5 py-1 text-[10px] font-mono text-muted-foreground transition-colors hover:text-foreground"
          >
            study
          </Link>
          <Link
            to="/concierge"
            className="rounded-md border border-border/30 bg-card/60 px-2.5 py-1 text-[10px] font-mono text-muted-foreground transition-colors hover:text-foreground"
          >
            concierge
          </Link>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <MissionProvider>
          <MissionDashboard />
        </MissionProvider>
      </div>
    </div>
  );
};

export default Index;
