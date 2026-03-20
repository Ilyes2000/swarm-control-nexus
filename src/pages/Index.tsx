import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Zap } from "lucide-react";
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

interface MissionTab {
  id: string;
  label: string;
}

function MissionDashboard() {
  const [bottomPanel, setBottomPanel] = useState<"reasoning" | "memory" | "skills">("reasoning");

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header />

      <div className="flex-1 grid grid-cols-[220px_1fr_260px] gap-2 p-2 min-h-0">
        {/* Left — Agent Swarm + 3D Network */}
        <div className="flex flex-col gap-2 min-h-0">
          <div className="glass-panel p-2.5 overflow-hidden flex-1">
            <AgentPanel />
          </div>
          <div className="glass-panel p-1 overflow-hidden h-[220px]">
            <AgentNetworkGraph />
          </div>
        </div>

        {/* Center — Timeline */}
        <div className="glass-panel p-3 overflow-hidden">
          <MissionTimeline />
        </div>

        {/* Right — Tabbed panels */}
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

      {/* Bottom — Mission Summary */}
      <div className="px-2 pb-2">
        <MissionSummary />
      </div>
    </div>
  );
}

const Index = () => {
  const [tabs, setTabs] = useState<MissionTab[]>([
    { id: "mission-1", label: "Mission 1" },
  ]);
  const [activeTab, setActiveTab] = useState("mission-1");

  const addTab = () => {
    const id = `mission-${Date.now()}`;
    setTabs((t) => [...t, { id, label: `Mission ${t.length + 1}` }]);
    setActiveTab(id);
  };

  const removeTab = (id: string) => {
    if (tabs.length <= 1) return;
    setTabs((t) => t.filter((tab) => tab.id !== id));
    if (activeTab === id) setActiveTab(tabs[0].id === id ? tabs[1]?.id : tabs[0].id);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Mission Tabs */}
      {tabs.length > 1 && (
        <div className="flex items-center gap-1 px-2 pt-2 pb-0">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              layout
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-t-lg text-[10px] font-mono transition-colors ${
                activeTab === tab.id
                  ? "bg-card/80 text-foreground border border-border/30 border-b-0"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              <Zap className="w-2.5 h-2.5" />
              {tab.label}
              {tabs.length > 1 && (
                <X
                  className="w-2.5 h-2.5 text-muted-foreground hover:text-destructive transition-colors"
                  onClick={(e) => { e.stopPropagation(); removeTab(tab.id); }}
                />
              )}
            </motion.button>
          ))}
          <button
            onClick={addTab}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-colors rounded"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Active Mission */}
      <AnimatePresence mode="wait">
        {tabs.map((tab) =>
          tab.id === activeTab ? (
            <motion.div
              key={tab.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <MissionProvider>
                <MissionDashboard />
              </MissionProvider>
            </motion.div>
          ) : null
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
