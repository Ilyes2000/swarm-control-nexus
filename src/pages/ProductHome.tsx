import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BrainCircuit, CalendarDays, Compass, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

function HomeCard({
  title,
  detail,
  to,
  cta,
  icon
}: {
  title: string;
  detail: string;
  to: string;
  cta: string;
  icon: ReactNode;
}) {
  return (
    <div className="glass-panel relative overflow-hidden p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
      <div className="relative">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
          {icon}
        </div>
        <h2 className="mt-4 text-2xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{detail}</p>
        <div className="mt-5">
          <Button asChild>
            <Link to={to}>{cta}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ProductHome() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground lg:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="glass-panel overflow-hidden p-6">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10" />
          <div className="relative">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Unified Product</div>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Study Mission OS + Concierge Missions</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              One product, two mission systems: student planning, tutoring, revision, and support on one side, plus the original real-world concierge workflows for reservations, booking, negotiation, and live coordination on the other.
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <HomeCard
            title="Study Workspace"
            detail="Planner, calendar, tutor, practice, revision, math lab, knowledge twin, support dashboards, and study-specific mission control."
            to="/study"
            cta="Open Study Workspace"
            icon={<BrainCircuit className="h-5 w-5" />}
          />
          <HomeCard
            title="Concierge Workspace"
            detail="The original outing and booking behavior is back as a first-class workspace with research, calls, negotiation, itinerary building, and concierge mission control."
            to="/concierge"
            cta="Open Concierge Workspace"
            icon={<Compass className="h-5 w-5" />}
          />
          <HomeCard
            title="Mission Control"
            detail="Launch the live swarm directly when you already know the mission. Mission Control now supports both study and concierge domains."
            to="/mission-control"
            cta="Open Mission Control"
            icon={<Sparkles className="h-5 w-5" />}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="glass-panel p-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CalendarDays className="h-4 w-4 text-primary" />
              Study examples
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "Recover algebra before Friday",
                "Build a calculus rescue plan for the next 3 days",
                "Replan revision around my work shifts"
              ].map((item) => (
                <Link
                  key={item}
                  to={`/mission-control?domain=study&prompt=${encodeURIComponent(item)}`}
                  className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-mono text-primary"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Compass className="h-4 w-4 text-secondary" />
              Concierge examples
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "Plan a dinner and movie night for tonight",
                "Book a birthday dinner for six near downtown",
                "Find a great restaurant and confirm a table by phone"
              ].map((item) => (
                <Link
                  key={item}
                  to={`/mission-control?domain=concierge&prompt=${encodeURIComponent(item)}`}
                  className="rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1 text-[11px] font-mono text-secondary"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
