import { useMission } from "@/contexts/MissionContext";
import { AgentCard } from "./AgentCard";

export function AgentPanel() {
  const { agents } = useMission();

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto scrollbar-thin pr-1">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
        Agent Swarm
      </h2>
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}
