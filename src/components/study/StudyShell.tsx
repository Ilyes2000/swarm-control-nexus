import { useMemo, type ComponentType } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpenCheck,
  BrainCircuit,
  CalendarDays,
  Compass,
  GraduationCap,
  Home,
  LifeBuoy,
  NotebookPen,
  Radar,
  Settings,
  Shield,
  Sparkles,
  SquareSigma,
  UserRound,
  Users,
  Wrench
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { studyApi } from "@/lib/study-api";
import type { StudyRole } from "@/lib/study-types";

type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

const studentNav: NavItem[] = [
  { to: "/today", label: "Today", icon: Home },
  { to: "/planner", label: "Planner", icon: CalendarDays },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/learn", label: "Learn", icon: GraduationCap },
  { to: "/practice", label: "Practice", icon: Sparkles },
  { to: "/revision", label: "Revision", icon: Radar },
  { to: "/math-lab", label: "Math Lab", icon: SquareSigma },
  { to: "/war-room", label: "War Room", icon: Shield },
  { to: "/knowledge-twin", label: "Knowledge Twin", icon: BrainCircuit },
  { to: "/notes", label: "Notes", icon: NotebookPen },
  { to: "/resources", label: "Resources", icon: BookOpenCheck },
  { to: "/settings", label: "Settings", icon: Settings }
];

const supportNav: NavItem[] = [
  { to: "/concierge", label: "Concierge", icon: Compass },
  { to: "/guardian", label: "Guardian", icon: UserRound },
  { to: "/teacher", label: "Teacher", icon: Users },
  { to: "/counselor", label: "Counselor", icon: LifeBuoy },
  { to: "/admin", label: "Admin", icon: Wrench },
  { to: "/mission-control", label: "Mission Control", icon: Compass }
];

const roleOptions: StudyRole[] = ["student", "guardian", "teacher", "counselor", "admin"];

const pageTitles: Record<string, string> = {
  "/today": "Today",
  "/planner": "Planner",
  "/calendar": "Calendar",
  "/learn": "Learning Engine",
  "/practice": "Practice Arena",
  "/revision": "Revision Engine",
  "/math-lab": "Math Lab",
  "/war-room": "Exam War Room",
  "/knowledge-twin": "Knowledge Twin",
  "/notes": "Notes",
  "/resources": "Resources",
  "/settings": "Settings",
  "/concierge": "Concierge Workspace",
  "/guardian": "Guardian Dashboard",
  "/teacher": "Teacher Dashboard",
  "/counselor": "Counselor Dashboard",
  "/admin": "Admin Console",
  "/mission-control": "Mission Control"
};

function SidebarLink({ item }: { item: NavItem }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      className="flex items-center gap-2 rounded-xl border border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/20 hover:bg-primary/5 hover:text-foreground"
      activeClassName="border-primary/30 bg-primary/10 text-foreground"
    >
      <Icon className="h-4 w-4" />
      <span>{item.label}</span>
    </NavLink>
  );
}

export function StudyShell() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const { data: authSession } = useQuery({
    queryKey: ["auth-session"],
    queryFn: () => studyApi.getAuthSession()
  });
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => studyApi.getProfile()
  });
  const { data: dashboard } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => studyApi.getDashboard()
  });
  const role = authSession?.role ?? "student";
  const isConciergeWorkspace = location.pathname === "/concierge";
  const roleMutation = useMutation({
    mutationFn: (nextRole: StudyRole) => studyApi.switchRole(nextRole),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["auth-session"] }),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["guardian-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["teacher-dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["risk"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] })
      ]);
    }
  });

  const title = useMemo(() => pageTitles[location.pathname] ?? "Study Mission OS", [location.pathname]);
  const workspaceDescription = isConciergeWorkspace
    ? `${profile?.displayName ?? "Student"} is using the original concierge workflow for research, calling, negotiation, and itinerary planning inside the unified product.`
    : `${profile?.displayName ?? "Student"} is working inside a math-first study system with replanning, mastery tracking, and live mission control.`;
  const missionControlHref = isConciergeWorkspace ? "/mission-control?domain=concierge" : "/mission-control?domain=study";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-border/40 bg-card/50 backdrop-blur-xl lg:w-80 lg:border-b-0 lg:border-r">
          <div className="p-5">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
                <BrainCircuit className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">Study Mission OS</div>
                <div className="text-[11px] font-mono text-muted-foreground">study + concierge mission platform</div>
              </div>
            </Link>

            <div className="mt-5 rounded-2xl border border-border/40 bg-muted/20 p-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Role</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {roleOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => roleMutation.mutate(option)}
                    disabled={roleMutation.isPending}
                    className={`rounded-xl border px-3 py-2 text-left text-xs font-medium capitalize transition-colors ${
                      role === option
                        ? "border-primary/30 bg-primary/10 text-foreground"
                        : "border-border/40 bg-card/30 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                Roles now switch through the shared auth session so the support dashboards reflect the current workspace instead of a frontend-only preview.
              </p>
            </div>

            <div className="mt-5 space-y-2">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Student Workspace</div>
              {studentNav.map((item) => (
                <SidebarLink key={item.to} item={item} />
              ))}
            </div>

            <div className="mt-5 space-y-2">
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Support Network</div>
              {supportNav.map((item) => (
                <SidebarLink key={item.to} item={item} />
              ))}
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="border-b border-border/40 bg-card/40 px-4 py-4 backdrop-blur-xl lg:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Web-first PWA</div>
                <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{workspaceDescription}</p>
                {!authSession?.onboardingCompleted ? (
                  <p className="mt-2 text-sm text-warning">
                    Onboarding is still in draft mode. Finish setup to lock in subjects, targets, and notification defaults.
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="rounded-2xl border border-border/40 bg-muted/20 px-4 py-2">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Role</div>
                  <div className="text-lg font-semibold capitalize">{role}</div>
                </div>
                <div className="rounded-2xl border border-success/20 bg-success/10 px-4 py-2">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-success/80">Readiness</div>
                  <div className="text-lg font-semibold text-success">{dashboard?.hero.readinessScore ?? 0}%</div>
                </div>
                <div className="rounded-2xl border border-border/40 bg-muted/20 px-4 py-2">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Streak</div>
                  <div className="text-lg font-semibold">{dashboard?.hero.streakDays ?? 0} days</div>
                </div>
                <Button asChild variant="outline" className="rounded-2xl">
                  <Link to="/onboarding">{authSession?.onboardingCompleted ? "Review Onboarding" : "Finish Onboarding"}</Link>
                </Button>
                <Button asChild className="rounded-2xl">
                  <Link to={missionControlHref}>Open Mission Control</Link>
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-4 lg:px-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
