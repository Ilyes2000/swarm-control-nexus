import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

function PromptCard({ title, detail, prompt }: { title: string; detail: string; prompt: string }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-muted/20 p-5">
      <div className="text-sm font-medium">{title}</div>
      <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
      <div className="mt-4">
        <Button asChild>
          <Link to={`/mission-control?domain=concierge&prompt=${encodeURIComponent(prompt)}`}>Launch Concierge Mission</Link>
        </Button>
      </div>
    </div>
  );
}

export default function ConciergeWorkspace() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <div className="space-y-4">
        <div className="glass-panel overflow-hidden p-5">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-transparent to-primary/10" />
          <div className="relative">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Concierge Workspace</div>
            <h1 className="mt-1 text-2xl font-semibold">Bring back the original real-world mission behavior</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Research venues, place calls, negotiate discounts, and build a live itinerary inside the same product that now runs the study system.
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <PromptCard
            title="Dinner + Movie"
            detail="Research restaurants and showtimes, confirm a table by phone, then optimize the cost and itinerary."
            prompt="Plan a dinner and movie night for tonight"
          />
          <PromptCard
            title="Date Night Rescue"
            detail="Find a high-rated venue, secure the booking, and keep the timing smooth."
            prompt="Plan a romantic dinner near downtown and confirm the reservation"
          />
          <PromptCard
            title="Group Booking"
            detail="Find an option that can handle a larger party and recover if the first venue is unavailable."
            prompt="Book a birthday dinner for six this weekend and handle the reservation by phone if needed"
          />
          <PromptCard
            title="Budget Optimizer"
            detail="Keep the original concierge negotiation behavior alive with discount stacking and value-aware choices."
            prompt="Find a dinner plan under 120 dollars for two and optimize the total cost"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="glass-panel p-5">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Legacy Behavior Restored</div>
          <div className="mt-3 space-y-3">
            {[
              "Research Agent compares restaurants, venues, and showtimes",
              "Call Agent can use the voice-call pipeline with simulation fallbacks",
              "Negotiation Agent applies savings logic before finalizing",
              "Scheduler Agent locks the itinerary and sends the confirmation brief"
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-border/40 bg-muted/20 p-4 text-sm text-foreground/80">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel p-5">
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Quick Links</div>
          <div className="mt-3 flex flex-col gap-3">
            <Button asChild variant="outline">
              <Link to="/mission-control?domain=concierge">Open Concierge Mission Control</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/study">Back to Study Workspace</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
