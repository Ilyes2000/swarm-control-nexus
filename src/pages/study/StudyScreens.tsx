import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Lightbulb,
  LineChart as LineChartIcon,
  ShieldAlert,
  Sigma
} from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { studyApi } from "@/lib/study-api";

function Surface({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`glass-panel relative p-5 ${className}`}>{children}</section>;
}

function SectionTitle({ eyebrow, title, detail }: { eyebrow: string; title: string; detail?: string }) {
  return (
    <div className="mb-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</div>
      <div className="mt-1 text-xl font-semibold">{title}</div>
      {detail ? <p className="mt-1 text-sm text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

function StatTile({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "success" | "warning" }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-muted/20 p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
      <div className={`mt-2 text-2xl font-semibold ${tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : ""}`}>{value}</div>
    </div>
  );
}

function StatusPill({ label, tone = "default" }: { label: string; tone?: "default" | "success" | "warning" | "danger" }) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-[10px] font-mono ${
        tone === "success"
          ? "bg-success/15 text-success"
          : tone === "warning"
            ? "bg-warning/15 text-warning"
            : tone === "danger"
              ? "bg-destructive/15 text-destructive"
              : "bg-primary/10 text-primary"
      }`}
    >
      {label}
    </span>
  );
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => studyApi.getProfile() });
  const [displayName, setDisplayName] = useState("Maya Johnson");
  const [gradeLevel, setGradeLevel] = useState("Grade 11");
  const [curriculumTrack, setCurriculumTrack] = useState("Math-First University Prep");
  const [examBoard, setExamBoard] = useState("AP / GCSE-aligned");
  const [subjects, setSubjects] = useState("Mathematics, Physics, English");
  const [weeklyHours, setWeeklyHours] = useState("12");
  const [targetScore, setTargetScore] = useState("90%+");
  const [energyPattern, setEnergyPattern] = useState("Peak focus after 7 PM");

  useEffect(() => {
    if (!profile) {
      return;
    }

    setDisplayName(profile.displayName);
    setGradeLevel(profile.gradeLevel);
    setCurriculumTrack(profile.curriculumTrack);
    setExamBoard(profile.examBoard);
    setSubjects(profile.subjects.join(", "));
    setWeeklyHours(String(profile.weeklyStudyHours));
    setTargetScore(profile.targetScore);
    setEnergyPattern(profile.energyPattern);
  }, [profile]);

  const mutation = useMutation({
    mutationFn: () =>
      studyApi.updateProfile({
        displayName,
        gradeLevel,
        curriculumTrack,
        examBoard,
        weeklyStudyHours: Number(weeklyHours),
        subjects: subjects.split(",").map((item) => item.trim()).filter(Boolean),
        targetScore,
        energyPattern,
        onboardingCompleted: true
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["auth-session"] }),
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      ]);
      navigate("/today");
    }
  });

  return (
    <div className="min-h-screen bg-background px-4 py-8 text-foreground lg:px-6">
      <div className="mx-auto grid max-w-6xl gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Surface className="overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
          <SectionTitle
            eyebrow="Onboarding"
            title="Set up a study system that plans around real life"
            detail="Configure subjects, energy, and score targets so the planner, tutor, and revision engine stop behaving like generic AI."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Display Name</label>
              <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="bg-muted/30" />
            </div>
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Grade Level</label>
              <Input value={gradeLevel} onChange={(event) => setGradeLevel(event.target.value)} className="bg-muted/30" />
            </div>
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Curriculum Track</label>
              <Input value={curriculumTrack} onChange={(event) => setCurriculumTrack(event.target.value)} className="bg-muted/30" />
            </div>
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Exam Board</label>
              <Input value={examBoard} onChange={(event) => setExamBoard(event.target.value)} className="bg-muted/30" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Subjects</label>
              <Input value={subjects} onChange={(event) => setSubjects(event.target.value)} className="bg-muted/30" />
            </div>
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Weekly Study Hours</label>
              <Input value={weeklyHours} onChange={(event) => setWeeklyHours(event.target.value)} className="bg-muted/30" />
            </div>
            <div>
              <label className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Target Score</label>
              <Input value={targetScore} onChange={(event) => setTargetScore(event.target.value)} className="bg-muted/30" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Energy Pattern</label>
              <Input value={energyPattern} onChange={(event) => setEnergyPattern(event.target.value)} className="bg-muted/30" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              Complete Setup
            </Button>
            <Button variant="outline" onClick={() => navigate("/today")}>
              Explore First
            </Button>
          </div>
        </Surface>

        <div className="space-y-4">
          <Surface>
            <SectionTitle eyebrow="What This Powers" title="Planner, tutor, revision, and support defaults" />
            <div className="space-y-3">
              {[
                "Energy-aware scheduling protects hard math work for high-focus windows.",
                "Mission plans break subjects into diagnostics, deep work, revision, and confidence checks.",
                "Guardian and teacher digests stay aligned with the student’s actual priorities.",
                "Math-first tutoring adapts hints, proof guidance, and review loops to exam pressure."
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-border/40 bg-muted/20 p-4 text-sm text-foreground/80">
                  {item}
                </div>
              ))}
            </div>
          </Surface>

          <Surface>
            <SectionTitle eyebrow="V1 Focus" title="Flagship study surfaces" />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <StatTile label="Math-first" value="enabled" tone="success" />
              <StatTile label="Mission Control" value="live agents" />
              <StatTile label="Knowledge Twin" value="mastery map" />
              <StatTile label="Risk Style" value="supportive" tone="warning" />
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}

export function TodayPage() {
  const { data: dashboard } = useQuery({ queryKey: ["dashboard"], queryFn: () => studyApi.getDashboard() });
  const { data: tasks } = useQuery({ queryKey: ["tasks"], queryFn: () => studyApi.getTasks() });

  return (
    <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
      <div className="space-y-4">
        <Surface className="overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10" />
          <SectionTitle
            eyebrow="Mission Focus"
            title={dashboard?.hero.focusMission?.title ?? "No active mission"}
            detail={dashboard?.hero.focusMission?.prompt ?? "Generate a study mission to build your next sprint."}
          />
          <div className="grid gap-3 md:grid-cols-4">
            {(dashboard?.stats ?? []).map((stat) => (
              <StatTile key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {(dashboard?.focusAreas ?? []).map((area) => (
              <span key={area} className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-mono text-primary">
                {area}
              </span>
            ))}
          </div>
        </Surface>

        <Surface>
          <SectionTitle
            eyebrow="Task Board"
            title="Today’s highest-leverage tasks"
            detail="Complete the evidence-gathering step first, then protect the deep-work block."
          />
          <div className="space-y-3">
            {(tasks ?? []).slice(0, 5).map((task) => (
              <div key={task.id} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{task.title}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {task.subject} · {task.type} · {task.durationMin} min · due {task.dueLabel}
                    </div>
                  </div>
                  <StatusPill
                    label={task.status}
                    tone={task.status === "completed" ? "success" : task.status === "missed" ? "danger" : "default"}
                  />
                </div>
              </div>
            ))}
          </div>
        </Surface>
      </div>

      <div className="space-y-4">
        <Surface>
          <SectionTitle
            eyebrow="Next Session"
            title={dashboard?.hero.nextSession?.title ?? "No session scheduled"}
            detail={dashboard?.hero.nextSession ? `${dashboard.hero.nextSession.startLabel} · ${dashboard.hero.nextSession.durationMin} minutes` : undefined}
          />
          <div className="rounded-2xl border border-success/20 bg-success/10 p-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-success/80">Readiness</div>
            <div className="mt-2 text-4xl font-semibold text-success">{dashboard?.hero.readinessScore ?? 0}%</div>
            <p className="mt-2 text-sm text-muted-foreground">Protect the first 10 minutes and start with an easy win to prevent focus drift.</p>
          </div>
        </Surface>

        <Surface>
          <SectionTitle eyebrow="Risk Radar" title="Supportive alerts" />
          <div className="space-y-3">
            {(dashboard?.risks ?? []).map((risk) => (
              <div key={risk.id} className="rounded-2xl border border-warning/20 bg-warning/10 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-warning">
                  <ShieldAlert className="h-4 w-4" />
                  {risk.title}
                </div>
                <p className="mt-2 text-sm text-foreground/80">{risk.message}</p>
                <p className="mt-2 text-[11px] font-mono text-muted-foreground">{risk.nextAction}</p>
              </div>
            ))}
          </div>
        </Surface>

        <Surface>
          <SectionTitle eyebrow="Reminder Queue" title="What will fire next" />
          <div className="space-y-3">
            {(dashboard?.pendingReminders ?? []).map((reminder) => (
              <div key={reminder.id} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm">{reminder.text}</div>
                  <StatusPill label={reminder.channel} />
                </div>
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}

export function PlannerPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: goals } = useQuery({ queryKey: ["goals"], queryFn: () => studyApi.getGoals() });
  const { data: tasks } = useQuery({ queryKey: ["tasks"], queryFn: () => studyApi.getTasks() });
  const { data: sessions } = useQuery({ queryKey: ["sessions"], queryFn: () => studyApi.getSessions() });
  const { data: missions } = useQuery({ queryKey: ["missions"], queryFn: () => studyApi.getMissions() });
  const [prompt, setPrompt] = useState("Recover algebra before the exam in 3 days with a confidence-safe plan.");
  const [goalTitle, setGoalTitle] = useState("Finish the calculus catch-up loop");
  const [goalSubject, setGoalSubject] = useState("Mathematics");

  const taskMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => studyApi.updateTask(id, { status }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      ]);
    }
  });

  const goalMutation = useMutation({
    mutationFn: () =>
      studyApi.createGoal({
        title: goalTitle,
        subject: goalSubject,
        deadlineLabel: "This week",
        targetScore: "On track",
        type: "weekly"
      }),
    onSuccess: async () => {
      setGoalTitle("");
      await queryClient.invalidateQueries({ queryKey: ["goals"] });
    }
  });

  const completeSessionMutation = useMutation({
    mutationFn: (sessionId: string) => studyApi.completeSession(sessionId, { confidenceAfter: 68, reflection: "Completed with a stable setup and one short recap loop." }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sessions"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["risk"] })
      ]);
    }
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
      <div className="space-y-4">
        <Surface>
          <SectionTitle
            eyebrow="Mission Builder"
            title="Draft or relaunch a study mission"
            detail="Use mission control for live agent planning, tutoring, revision, and replanning."
          />
          <Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} className="min-h-[120px] bg-muted/30" />
          <div className="mt-3 flex flex-wrap gap-3">
            <Button onClick={() => navigate(`/mission-control?prompt=${encodeURIComponent(prompt)}`)}>
              Open Mission Control
            </Button>
            <Button variant="outline" onClick={() => setPrompt("Build a calculus rescue mission with diagnostics, deep work, and spaced revision.")}>
              Load Rescue Template
            </Button>
          </div>
        </Surface>

        <Surface>
          <SectionTitle eyebrow="Goals" title="Academic and life goals" />
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_auto]">
            <Input value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)} placeholder="Add a weekly or exam goal" className="bg-muted/30" />
            <Input value={goalSubject} onChange={(event) => setGoalSubject(event.target.value)} className="bg-muted/30" />
            <Button onClick={() => goalMutation.mutate()} disabled={goalMutation.isPending || !goalTitle.trim()}>
              Add Goal
            </Button>
          </div>
          <div className="space-y-3">
            {(goals ?? []).map((goal) => (
              <div key={goal.id} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{goal.title}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{goal.subject} · {goal.deadlineLabel} · target {goal.targetScore}</div>
                  </div>
                  <div className="text-sm font-semibold">{goal.progress}%</div>
                </div>
                <Progress value={goal.progress} className="mt-3 h-2 bg-muted" />
              </div>
            ))}
          </div>
        </Surface>

        <Surface>
          <SectionTitle eyebrow="Mission History" title="Persisted mission runs" />
          <div className="space-y-3">
            {(missions ?? []).slice(0, 4).map((mission) => (
              <div key={mission.id} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{mission.title}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {mission.subject ?? "General Study"} · readiness {mission.readinessScore}% · {mission.eventCount ?? 0} events
                    </div>
                  </div>
                  <StatusPill label={mission.status} tone={mission.status === "completed" ? "success" : "default"} />
                </div>
              </div>
            ))}
          </div>
        </Surface>
      </div>

      <div className="space-y-4">
        <Surface>
          <SectionTitle eyebrow="Auto-Replanner" title="Mission-owned tasks" />
          <div className="space-y-3">
            {(tasks ?? []).map((task) => {
              const nextStatus = task.status === "completed" ? "planned" : "completed";
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => taskMutation.mutate({ id: task.id, status: nextStatus })}
                  className="w-full rounded-2xl border border-border/40 bg-muted/20 p-4 text-left transition-colors hover:border-primary/30"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">{task.title}</div>
                      <div className="mt-1 text-[11px] text-muted-foreground">{task.dueLabel} · {task.durationMin} min · confidence {task.confidence}</div>
                    </div>
                    <CheckCircle2 className={`h-5 w-5 ${task.status === "completed" ? "text-success" : "text-muted-foreground"}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </Surface>

        <Surface>
          <SectionTitle eyebrow="Session Blueprint" title="Protected focus blocks" />
          <div className="space-y-3">
            {(sessions ?? []).map((session) => (
              <div key={session.id} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{session.title}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {session.startLabel} · {session.durationMin} min · {session.mode} · {session.energyFit}
                    </div>
                  </div>
                  {session.status === "completed" ? (
                    <StatusPill label="completed" tone="success" />
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => completeSessionMutation.mutate(session.id)} disabled={completeSessionMutation.isPending}>
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}

export function CalendarPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["calendar"], queryFn: () => studyApi.getCalendar() });
  const totalMinutes = (data?.sessions ?? []).reduce((sum, session) => sum + session.durationMin, 0);
  const syncMutation = useMutation({
    mutationFn: (provider: string) => studyApi.syncCalendar(provider),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["calendar"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      ]);
    }
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
      <div className="space-y-4">
        <Surface>
          <SectionTitle eyebrow="Calendar" title="Sessions, deadlines, and life-aware scheduling" detail="The calendar layer protects study blocks while respecting work shifts, energy, and deadline pressure." />
          <div className="space-y-3">
            {(data?.sessions ?? []).map((session) => (
              <div key={session.id} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CalendarClock className="h-4 w-4 text-primary" />
                      {session.title}
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {session.startLabel} · {session.durationMin} min · {session.mode} · energy fit {session.energyFit}
                    </div>
                  </div>
                  <StatusPill label={session.status} tone={session.status === "completed" ? "success" : "default"} />
                </div>
              </div>
            ))}
          </div>
        </Surface>

        <Surface>
          <SectionTitle eyebrow="Deadline Radar" title="Task and deadline view" />
          <div className="space-y-3">
            {(data?.tasks ?? []).map((task) => (
              <div key={task.id} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{task.title}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{task.subject} · {task.type} · due {task.dueLabel}</div>
                  </div>
                  <div className="text-sm font-semibold">{task.durationMin} min</div>
                </div>
              </div>
            ))}
          </div>
        </Surface>
      </div>

      <div className="space-y-4">
        <Surface>
          <SectionTitle eyebrow="Calendar Sources" title={data?.syncStatus ?? "Sync status"} />
          <div className="space-y-3">
            {(data?.sources ?? []).map((source) => (
              <div key={source.id} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{source.label}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {source.provider} · {source.type} · last sync {new Date(source.lastSyncedAt).toLocaleString()}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => syncMutation.mutate(source.provider)} disabled={syncMutation.isPending}>
                    Sync
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Surface>

        <Surface>
          <SectionTitle eyebrow="Conflicts And Reminders" title="Protected capacity" />
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
            <StatTile label="Planned Blocks" value={`${data?.sessions.length ?? 0}`} />
            <StatTile label="Scheduled Minutes" value={`${totalMinutes}`} />
            <StatTile label="Open Deadlines" value={`${(data?.tasks ?? []).filter((task) => task.status !== "completed").length}`} tone="warning" />
          </div>
          <div className="mt-4 space-y-3">
            {(data?.conflicts ?? []).map((conflict) => (
              <div key={conflict.id} className="rounded-2xl border border-warning/20 bg-warning/10 p-4">
                <div className="text-sm font-medium text-warning">{conflict.title}</div>
                <p className="mt-2 text-sm text-foreground/80">{conflict.description}</p>
              </div>
            ))}
            {(data?.reminders ?? []).map((reminder) => (
              <div key={reminder.id} className="rounded-2xl border border-border/40 bg-muted/20 p-4 text-sm text-foreground/80">
                {reminder.text}
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}

export function LearnPage() {
  const { data: resources } = useQuery({ queryKey: ["resources"], queryFn: () => studyApi.getResources() });
  const { data: mastery } = useQuery({ queryKey: ["mastery"], queryFn: () => studyApi.getMastery() });

  return (
    <div className="space-y-4">
      <Surface>
        <SectionTitle eyebrow="Tutor Modes" title="Switch the way the AI teaches" />
        <div className="grid gap-3 md:grid-cols-4">
          {[
            { title: "Intuitive", detail: "Builds mental models before symbols." },
            { title: "Formal", detail: "Tight mathematical language and exact definitions." },
            { title: "Exam-style", detail: "Optimized for timed scoring and method selection." },
            { title: "Socratic", detail: "Asks questions first, then reveals the next move." }
          ].map((mode) => (
            <div key={mode.title} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
              <div className="text-sm font-medium">{mode.title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{mode.detail}</p>
            </div>
          ))}
        </div>
      </Surface>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <Surface>
          <SectionTitle eyebrow="Resource Stack" title="Concept packs and worked examples" />
          <div className="space-y-3">
            {(resources ?? []).map((resource) => (
              <div key={resource.id} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{resource.title}</div>
                    <p className="mt-2 text-sm text-muted-foreground">{resource.description}</p>
                  </div>
                  <span className="rounded-full border border-border/40 px-2 py-1 text-[10px] font-mono text-muted-foreground">
                    {resource.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Surface>

        <Surface>
          <SectionTitle eyebrow="Weakest Skills" title="Teach where confidence is fragile" />
          <div className="space-y-3">
            {(mastery?.masteryNodes ?? [])
              .slice()
              .sort((a, b) => a.mastery - b.mastery)
              .slice(0, 4)
              .map((node) => (
                <div key={node.id} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium">{node.label}</div>
                    <div className="text-sm font-semibold">{node.mastery}%</div>
                  </div>
                  <Progress value={node.mastery} className="mt-3 h-2 bg-muted" />
                </div>
              ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}

export function PracticePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: practice } = useQuery({ queryKey: ["practice"], queryFn: () => studyApi.getPractice() });
  const [revealedHints, setRevealedHints] = useState<Record<string, number>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confidenceBySet, setConfidenceBySet] = useState<Record<string, string>>({});

  const attemptMutation = useMutation({
    mutationFn: ({ setId, answer, confidenceBefore }: { setId: string; answer: string; confidenceBefore: number }) =>
      studyApi.submitPracticeAttempt({ setId, answer, confidenceBefore }),
    onSuccess: async (_, variables) => {
      setAnswers((current) => ({ ...current, [variables.setId]: "" }));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["practice"] }),
        queryClient.invalidateQueries({ queryKey: ["mastery"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      ]);
    }
  });

  const similarMutation = useMutation({
    mutationFn: (setId: string) => studyApi.generateSimilarQuestion(setId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["practice"] });
    }
  });

  return (
    <div className="space-y-4">
      <Surface>
        <SectionTitle eyebrow="Practice Arena" title="Hint ladder and error-safe solving" detail="Hints reveal progressively so the student commits to a first step before the system helps further." />
        <div className="grid gap-4 xl:grid-cols-2">
          {(practice?.sets ?? []).map((set) => {
            const revealed = revealedHints[set.id] ?? 0;
            const answer = answers[set.id] ?? "";
            const confidenceValue = confidenceBySet[set.id] ?? "55";

            return (
              <div key={set.id} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{set.title}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{set.subject} · {set.difficulty} · {set.mode}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/mission-control?prompt=${encodeURIComponent(`Coach me through ${set.title} step by step`)}`)}>
                    Live Coach
                  </Button>
                </div>
                <p className="mt-3 text-sm text-foreground/80">{set.prompt}</p>
                <Textarea
                  value={answer}
                  onChange={(event) => setAnswers((current) => ({ ...current, [set.id]: event.target.value }))}
                  className="mt-4 min-h-[100px] bg-muted/30"
                  placeholder="Write your first step, method choice, and answer check."
                />
                <div className="mt-3 grid gap-3 md:grid-cols-[160px_1fr]">
                  <Input
                    value={confidenceValue}
                    onChange={(event) => setConfidenceBySet((current) => ({ ...current, [set.id]: event.target.value }))}
                    className="bg-muted/30"
                    placeholder="Confidence 0-100"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => attemptMutation.mutate({ setId: set.id, answer, confidenceBefore: Number(confidenceValue) || 55 })}
                      disabled={attemptMutation.isPending || !answer.trim()}
                    >
                      Score Attempt
                    </Button>
                    <Button size="sm" onClick={() => setRevealedHints((current) => ({ ...current, [set.id]: Math.min(set.hints.length, revealed + 1) }))}>
                      Reveal Hint
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => similarMutation.mutate(set.id)} disabled={similarMutation.isPending}>
                      Similar Question
                    </Button>
                  </div>
                </div>
                {revealed > 0 ? (
                  <div className="mt-4 space-y-2">
                    {set.hints.slice(0, revealed).map((hint, index) => (
                      <div key={index} className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-foreground/80">
                        Hint {index + 1}: {hint}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </Surface>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Surface>
          <SectionTitle eyebrow="Recent Attempts" title="Evidence that feeds the mastery engine" />
          <div className="space-y-3">
            {(practice?.recentAttempts ?? []).map((attempt) => (
              <div key={attempt.id} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{attempt.setTitle}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      Score {attempt.score}% · confidence {attempt.confidenceBefore}% → {attempt.confidenceAfter}%
                    </div>
                  </div>
                  <StatusPill label={attempt.status} tone="success" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{attempt.firstError}</p>
              </div>
            ))}
          </div>
        </Surface>

        <Surface>
          <SectionTitle eyebrow="Mistake DNA" title="Recurring first-error patterns" />
          <div className="space-y-3">
            {(practice?.mistakePatterns ?? []).map((pattern) => (
              <div key={pattern.id} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">{pattern.label}</div>
                  <div className="text-[11px] font-mono text-muted-foreground">{pattern.frequency}x</div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{pattern.description}</p>
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}

export function RevisionPage() {
  const queryClient = useQueryClient();
  const { data: revision } = useQuery({ queryKey: ["revision"], queryFn: () => studyApi.getRevision() });
  const { data: mastery } = useQuery({ queryKey: ["mastery"], queryFn: () => studyApi.getMastery() });
  const reviewMutation = useMutation({
    mutationFn: ({ flashcardId, rating }: { flashcardId: string; rating: "again" | "good" | "easy" }) => studyApi.reviewFlashcard({ flashcardId, rating }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["revision"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      ]);
    }
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
      <div className="space-y-4">
        <Surface>
          <SectionTitle eyebrow="Revision Engine" title="Spaced repetition, mixed recall, and streak recovery" />
          <div className="grid gap-3 md:grid-cols-3">
            <StatTile label="Streak" value={`${revision?.streakDays ?? 0} days`} tone="success" />
            <StatTile label="Queue" value={`${revision?.queue.length ?? 0} loops`} />
            <StatTile label="Weakest 3" value={`${(mastery?.masteryNodes ?? []).slice().sort((a, b) => a.mastery - b.mastery).slice(0, 3).length}`} tone="warning" />
          </div>
        </Surface>

        <Surface>
          <SectionTitle eyebrow="Tonight’s Queue" title="Review before forgetting" />
          <div className="space-y-3">
            {(revision?.queue ?? []).map((item) => (
              <div key={item.id} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{item.title}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{item.cards} cards · due {item.dueLabel}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
              </div>
            ))}
          </div>
        </Surface>

        <Surface>
          <SectionTitle eyebrow="Flashcard Reviews" title="Update the forgetting curve" />
          <div className="space-y-3">
            {(revision?.flashcards ?? []).map((card) => (
              <div key={card.id} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{card.front}</div>
                    <div className="mt-2 text-sm text-muted-foreground">{card.back}</div>
                    <div className="mt-2 text-[11px] text-muted-foreground">{card.deck} · due {card.dueLabel}</div>
                  </div>
                  <div className="text-sm font-semibold">{card.mastery}%</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => reviewMutation.mutate({ flashcardId: card.id, rating: "again" })} disabled={reviewMutation.isPending}>
                    Again
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => reviewMutation.mutate({ flashcardId: card.id, rating: "good" })} disabled={reviewMutation.isPending}>
                    Good
                  </Button>
                  <Button size="sm" onClick={() => reviewMutation.mutate({ flashcardId: card.id, rating: "easy" })} disabled={reviewMutation.isPending}>
                    Easy
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Surface>
      </div>

      <Surface>
        <SectionTitle eyebrow="Fragile Topics" title="Prioritize the weakest mastery first" />
        <div className="space-y-3">
          {(mastery?.masteryNodes ?? [])
            .slice()
            .sort((a, b) => a.mastery - b.mastery)
            .map((node) => (
              <div key={node.id} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">{node.label}</div>
                  <div className="text-sm font-semibold">{node.mastery}%</div>
                </div>
                <Progress value={node.mastery} className="mt-3 h-2 bg-muted" />
              </div>
            ))}
        </div>
      </Surface>
    </div>
  );
}

export function MathLabPage() {
  const { data: mastery } = useQuery({ queryKey: ["mastery"], queryFn: () => studyApi.getMastery() });
  const points = useMemo(
    () =>
      Array.from({ length: 13 }, (_, index) => {
        const x = index - 6;
        return {
          x,
          y: x * x - 4 * x - 5
        };
      }),
    []
  );

  return (
    <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
      <Surface>
        <SectionTitle eyebrow="Math Lab" title="Visualize before you memorize" detail="V1 ships math-first tooling for graphs, formula fluency, and exam-style method selection." />
        <div className="h-[320px] rounded-2xl border border-border/40 bg-muted/20 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <XAxis dataKey="x" stroke="rgba(255,255,255,0.4)" />
              <YAxis stroke="rgba(255,255,255,0.4)" />
              <Tooltip />
              <Line type="monotone" dataKey="y" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-border/40 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-sm font-medium"><Sigma className="h-4 w-4 text-primary" /> Formula Explorer</div>
            <p className="mt-2 text-sm text-muted-foreground">Map factoring, quadratic formula, and completing the square to the same parabola.</p>
          </div>
          <div className="rounded-2xl border border-border/40 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-sm font-medium"><LineChartIcon className="h-4 w-4 text-secondary" /> Graph Sandbox</div>
            <p className="mt-2 text-sm text-muted-foreground">Use graph behavior as an answer-check and method-selection aid.</p>
          </div>
          <div className="rounded-2xl border border-border/40 bg-muted/20 p-4">
            <div className="flex items-center gap-2 text-sm font-medium"><Lightbulb className="h-4 w-4 text-warning" /> Explain 3 Ways</div>
            <p className="mt-2 text-sm text-muted-foreground">Intuitive, formal, and exam-style explanation modes remain one click away.</p>
          </div>
        </div>
      </Surface>

      <Surface>
        <SectionTitle eyebrow="Math Premium" title="Flagship workflows" />
        <div className="space-y-3">
          {(mastery?.mistakePatterns ?? []).map((pattern) => (
            <div key={pattern.id} className="rounded-2xl border border-border/40 bg-muted/20 p-4 text-sm text-foreground/80">
              {pattern.label}: {pattern.description}
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
}

export function WarRoomPage() {
  const { data: dashboard } = useQuery({ queryKey: ["dashboard"], queryFn: () => studyApi.getDashboard() });
  const { data: risk } = useQuery({ queryKey: ["risk"], queryFn: () => studyApi.getRiskDashboard() });

  return (
    <div className="space-y-4">
      <Surface>
        <SectionTitle eyebrow="Exam War Room" title="Live rescue posture for high-pressure weeks" detail="This screen brings readiness, next session protection, and focus-risk guardrails into one surface." />
        <div className="grid gap-3 md:grid-cols-4">
          <StatTile label="Readiness" value={`${dashboard?.hero.readinessScore ?? 0}%`} tone="success" />
          <StatTile label="Countdown" value="3 days" tone="warning" />
          <StatTile label="Next Block" value={dashboard?.hero.nextSession?.durationMin ? `${dashboard.hero.nextSession.durationMin} min` : "0 min"} />
          <StatTile label="Risk" value={risk?.signals[0]?.level ?? "low"} tone="warning" />
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/mission-control?prompt=Run an algebra exam rescue mission and keep it confidence-safe.">Launch Live Rescue Mode</Link>
          </Button>
          <Button variant="outline">Start Panic Mode</Button>
        </div>
      </Surface>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <Surface>
          <SectionTitle eyebrow="Protected Moves" title="What the student should do next" />
          <div className="space-y-3">
            {(dashboard?.hero.focusMission?.focusAreas ?? []).map((item) => (
              <div key={item} className="rounded-2xl border border-border/40 bg-muted/20 p-4 text-sm text-foreground/80">
                Protect a short warm-up, then attack {item.toLowerCase()} before switching topics.
              </div>
            ))}
          </div>
        </Surface>

        <Surface>
          <SectionTitle eyebrow="Risk Signals" title="Supportive escalation only" />
          <div className="space-y-3">
            {(risk?.signals ?? []).map((signal) => (
              <div key={signal.id} className="rounded-2xl border border-warning/20 bg-warning/10 p-4">
                <div className="text-sm font-medium text-warning">{signal.title}</div>
                <p className="mt-2 text-sm text-foreground/80">{signal.message}</p>
                <p className="mt-2 text-[11px] font-mono text-muted-foreground">{signal.nextAction}</p>
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}

export function KnowledgeTwinPage() {
  const { data } = useQuery({ queryKey: ["mastery"], queryFn: () => studyApi.getMastery() });

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <Surface>
        <SectionTitle eyebrow="Knowledge Twin" title="A living model of what the student really knows" />
        <div className="grid gap-3 md:grid-cols-2">
          {(data?.knowledgeTwin ?? []).map((node) => (
            <div key={node.id} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{node.label}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{node.cluster}</div>
                </div>
                <StatusPill
                  label={node.status}
                  tone={node.status === "solid" ? "success" : node.status === "at-risk" ? "danger" : node.status === "fragile" ? "warning" : "default"}
                />
              </div>
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Mastery</span>
                  <span>{node.mastery}%</span>
                </div>
                <Progress value={node.mastery} className="h-2 bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </Surface>

      <div className="space-y-4">
        <Surface>
          <SectionTitle eyebrow="Calibration" title="Confidence vs reality" />
          <div className="space-y-3">
            {(data?.masteryNodes ?? []).map((node) => (
              <div key={node.id} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">{node.label}</div>
                  <div className="text-[11px] font-mono text-muted-foreground">{node.trend}</div>
                </div>
                <div className="mt-3 space-y-2">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground"><span>Mastery</span><span>{node.mastery}%</span></div>
                    <Progress value={node.mastery} className="h-2 bg-muted" />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px] text-muted-foreground"><span>Confidence</span><span>{node.confidence}%</span></div>
                    <Progress value={node.confidence} className="h-2 bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Surface>

        <Surface>
          <SectionTitle eyebrow="Mistake DNA" title="What keeps recurring" />
          <div className="space-y-3">
            {(data?.mistakePatterns ?? []).map((pattern) => (
              <div key={pattern.id} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">{pattern.label}</div>
                  <div className="text-[11px] font-mono text-muted-foreground">{pattern.frequency}x</div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{pattern.description}</p>
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}

export function NotesPage() {
  const queryClient = useQueryClient();
  const { data: notes } = useQuery({ queryKey: ["notes"], queryFn: () => studyApi.getNotes() });
  const [title, setTitle] = useState("Recovery note");
  const [subject, setSubject] = useState("Mathematics");
  const [body, setBody] = useState("Cue: identify structure before choosing a method.\nSummary: verify against the graph.");

  const createMutation = useMutation({
    mutationFn: () => studyApi.createNote({ title, subject, body }),
    onSuccess: async () => {
      setBody("");
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
    }
  });

  const summarizeMutation = useMutation({
    mutationFn: (noteId: string) => studyApi.summarizeNote(noteId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notes"] });
    }
  });

  const flashcardMutation = useMutation({
    mutationFn: (noteId: string) => studyApi.convertNoteToFlashcards(noteId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["notes"] }),
        queryClient.invalidateQueries({ queryKey: ["revision"] })
      ]);
    }
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
      <Surface>
        <SectionTitle eyebrow="Create Note" title="Cornell notes, retrospectives, and strategy journaling" />
        <div className="grid gap-3 md:grid-cols-2">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} className="bg-muted/30" />
          <Input value={subject} onChange={(event) => setSubject(event.target.value)} className="bg-muted/30" />
        </div>
        <Textarea value={body} onChange={(event) => setBody(event.target.value)} className="mt-3 min-h-[160px] bg-muted/30" />
        <div className="mt-3">
          <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !title.trim() || !body.trim()}>
            Save Note
          </Button>
        </div>
      </Surface>

      <Surface>
        <SectionTitle eyebrow="Saved Notes" title="Turn notes into summaries and flashcards" />
        <div className="space-y-3">
          {(notes ?? []).map((note) => (
            <div key={note.id} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">{note.title}</div>
                <div className="text-[11px] text-muted-foreground">{note.updatedLabel}</div>
              </div>
              <p className="mt-3 text-sm text-foreground/80">{note.preview}</p>
              {note.summary ? <p className="mt-3 text-sm text-muted-foreground">Summary: {note.summary}</p> : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => summarizeMutation.mutate(note.id)} disabled={summarizeMutation.isPending}>
                  Summarize
                </Button>
                <Button size="sm" onClick={() => flashcardMutation.mutate(note.id)} disabled={flashcardMutation.isPending}>
                  Make Flashcards
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
}

export function ResourcesPage() {
  const queryClient = useQueryClient();
  const { data: resources } = useQuery({ queryKey: ["resources"], queryFn: () => studyApi.getResources() });
  const { data: career } = useQuery({ queryKey: ["career"], queryFn: () => studyApi.getCareerPlan() });
  const { data: uploads } = useQuery({ queryKey: ["uploads"], queryFn: () => studyApi.getUploads() });
  const [uploadTitle, setUploadTitle] = useState("Chapter review sheet");
  const [uploadSubject, setUploadSubject] = useState("Mathematics");
  const [uploadKind, setUploadKind] = useState("pdf");

  const uploadMutation = useMutation({
    mutationFn: () => studyApi.createUpload({ title: uploadTitle, subject: uploadSubject, kind: uploadKind as "pdf" | "image" | "audio" | "link" }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["uploads"] }),
        queryClient.invalidateQueries({ queryKey: ["resources"] })
      ]);
    }
  });

  const milestoneMutation = useMutation({
    mutationFn: ({ milestoneId, status }: { milestoneId: string; status: "active" | "planned" | "completed" }) =>
      studyApi.updateCareerMilestone(milestoneId, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["career"] });
    }
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <div className="space-y-4">
        <Surface>
          <SectionTitle eyebrow="Resource Library" title="Curated study assets, not generic clutter" />
          <div className="space-y-3">
            {(resources ?? []).map((resource) => (
              <div key={resource.id} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{resource.title}</div>
                    <p className="mt-2 text-sm text-muted-foreground">{resource.description}</p>
                  </div>
                  <span className="rounded-full border border-border/40 px-2 py-1 text-[10px] font-mono text-muted-foreground">{resource.durationMin} min</span>
                </div>
              </div>
            ))}
          </div>
        </Surface>

        <Surface>
          <SectionTitle eyebrow="Upload Intake" title="Attach PDFs, images, audio, or links" />
          <div className="grid gap-3 md:grid-cols-3">
            <Input value={uploadTitle} onChange={(event) => setUploadTitle(event.target.value)} className="bg-muted/30" />
            <Input value={uploadSubject} onChange={(event) => setUploadSubject(event.target.value)} className="bg-muted/30" />
            <Input value={uploadKind} onChange={(event) => setUploadKind(event.target.value)} className="bg-muted/30" />
          </div>
          <div className="mt-3">
            <Button onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending}>
              Process Upload
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {(uploads ?? []).map((upload) => (
              <div key={upload.id} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{upload.title}</div>
                    <p className="mt-2 text-sm text-muted-foreground">{upload.extractedSummary}</p>
                  </div>
                  <StatusPill label={upload.status} tone="success" />
                </div>
              </div>
            ))}
          </div>
        </Surface>
      </div>

      <Surface>
        <SectionTitle eyebrow="Career Overlay" title={career?.headline ?? "Career Plan"} />
        <div className="space-y-3">
          {(career?.milestones ?? []).map((milestone) => (
            <div key={milestone.id} className="rounded-2xl border border-border/40 bg-muted/20 p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{milestone.title}</div>
                  <div className="mt-1 text-[11px] text-muted-foreground">{milestone.dueLabel}</div>
                </div>
                <Button
                  size="sm"
                  variant={milestone.status === "completed" ? "outline" : "default"}
                  onClick={() => milestoneMutation.mutate({ milestoneId: milestone.id, status: milestone.status === "completed" ? "active" : "completed" })}
                  disabled={milestoneMutation.isPending}
                >
                  {milestone.status === "completed" ? "Reopen" : "Complete"}
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <SectionTitle eyebrow="Responsible AI" title="AI-readiness reminders" />
          <div className="space-y-3">
            {(career?.aiReadiness ?? []).map((item) => (
              <div key={item} className="rounded-2xl border border-border/40 bg-muted/20 p-4 text-sm text-foreground/80">
                {item}
              </div>
            ))}
          </div>
        </div>
      </Surface>
    </div>
  );
}

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => studyApi.getProfile() });
  const { data: consent } = useQuery({ queryKey: ["consent-policy"], queryFn: () => studyApi.getConsentPolicy() });
  const { data: claims } = useQuery({ queryKey: ["role-claims"], queryFn: () => studyApi.getRoleClaims() });
  const [weeklyHours, setWeeklyHours] = useState("12");
  const [energyPattern, setEnergyPattern] = useState("Peak focus after 7 PM");
  const [aiMode, setAiMode] = useState("guided");

  useEffect(() => {
    if (!profile) {
      return;
    }

    setWeeklyHours(String(profile.weeklyStudyHours));
    setEnergyPattern(profile.energyPattern);
    setAiMode(profile.aiReadinessMode);
  }, [profile]);

  const profileMutation = useMutation({
    mutationFn: () =>
      studyApi.updateProfile({
        weeklyStudyHours: Number(weeklyHours),
        energyPattern,
        aiReadinessMode: aiMode
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      ]);
    }
  });

  const consentMutation = useMutation({
    mutationFn: (updates: Parameters<typeof studyApi.updateConsentPolicy>[0]) => studyApi.updateConsentPolicy(updates),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["consent-policy"] });
    }
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
      <Surface>
        <SectionTitle eyebrow="Profile" title="Student planning preferences" />
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Display Name</label>
            <Input value={profile?.displayName ?? "Maya Johnson"} readOnly className="bg-muted/30" />
          </div>
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Weekly Study Hours</label>
            <Input value={weeklyHours} onChange={(event) => setWeeklyHours(event.target.value)} className="bg-muted/30" />
          </div>
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Energy Pattern</label>
            <Input value={energyPattern} onChange={(event) => setEnergyPattern(event.target.value)} className="bg-muted/30" />
          </div>
          <div>
            <label className="mb-2 block text-[11px] uppercase tracking-[0.2em] text-muted-foreground">AI Guidance Mode</label>
            <Input value={aiMode} onChange={(event) => setAiMode(event.target.value)} className="bg-muted/30" />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <Button onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending}>
            Save Preferences
          </Button>
          <Button variant="outline">Export Data</Button>
        </div>
      </Surface>

      <Surface>
        <SectionTitle eyebrow="Accessibility" title="Core inclusion controls" />
        <div className="space-y-3">
          {[
            { label: "ADHD mode", active: profile?.accessibility.adhdMode },
            { label: "Dyslexia mode", active: profile?.accessibility.dyslexiaMode },
            { label: "Reduced motion", active: profile?.accessibility.reducedMotion },
            { label: "Text-to-speech", active: profile?.accessibility.textToSpeech }
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-2xl border border-border/40 bg-muted/20 p-4">
              <span className="text-sm">{item.label}</span>
              <span className={`rounded-full px-2 py-1 text-[10px] font-mono ${item.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                {item.active ? "on" : "off"}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <SectionTitle eyebrow="Consent Policy" title="Support visibility and escalation" />
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-border/40 bg-muted/20 p-4">
              <span className="text-sm">Guardian visibility</span>
              <Button size="sm" variant="outline" onClick={() => consentMutation.mutate({ guardianVisibility: consent?.guardianVisibility === "full" ? "summary" : "full" })} disabled={consentMutation.isPending}>
                {consent?.guardianVisibility ?? "summary"}
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border/40 bg-muted/20 p-4">
              <span className="text-sm">Counselor escalation</span>
              <Button size="sm" variant="outline" onClick={() => consentMutation.mutate({ counselorEscalationEnabled: !consent?.counselorEscalationEnabled })} disabled={consentMutation.isPending}>
                {consent?.counselorEscalationEnabled ? "enabled" : "disabled"}
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border/40 bg-muted/20 p-4">
              <span className="text-sm">Share wellbeing signals</span>
              <Button size="sm" variant="outline" onClick={() => consentMutation.mutate({ shareWellbeingSignals: !consent?.shareWellbeingSignals })} disabled={consentMutation.isPending}>
                {consent?.shareWellbeingSignals ? "on" : "off"}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <SectionTitle eyebrow="Role Claims" title="Workspace access map" />
          <div className="space-y-3">
            {(claims ?? []).map((claim) => (
              <div key={claim.id} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium capitalize">{claim.role}</div>
                  <StatusPill label={claim.status} tone="success" />
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">{claim.scope} · {claim.scopeId}</div>
              </div>
            ))}
          </div>
        </div>
      </Surface>
    </div>
  );
}

export function GuardianPage() {
  const { data } = useQuery({ queryKey: ["guardian-dashboard"], queryFn: () => studyApi.getGuardianDashboard() });

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
      <Surface>
        <SectionTitle eyebrow="Guardian View" title={`Support ${data?.studentName ?? "the student"} without micromanaging`} />
        <div className="grid gap-3 md:grid-cols-2">
          <StatTile label="Consistency" value={data?.consistency ?? "0 day streak"} tone="success" />
          <StatTile label="Next Session" value={data?.nextSession?.startLabel ?? "Not scheduled"} />
        </div>
        <div className="mt-4 rounded-2xl border border-warning/20 bg-warning/10 p-4">
          <div className="text-sm font-medium text-warning">{data?.latestRisk?.title}</div>
          <p className="mt-2 text-sm text-foreground/80">{data?.latestRisk?.message}</p>
        </div>
      </Surface>

      <div className="space-y-4">
        <Surface>
          <SectionTitle eyebrow="Encouragement Prompts" title="Helpful ways to check in" />
          <div className="space-y-3">
            {(data?.encouragementPrompts ?? []).map((prompt) => (
              <div key={prompt} className="rounded-2xl border border-border/40 bg-muted/20 p-4 text-sm text-foreground/80">
                {prompt}
              </div>
            ))}
          </div>
        </Surface>

        <Surface>
          <SectionTitle eyebrow="Approvals" title="Shared visibility rules" />
          <div className="space-y-3">
            {(data?.approvals ?? []).map((item) => (
              <div key={item} className="rounded-2xl border border-border/40 bg-muted/20 p-4 text-sm text-foreground/80">
                {item}
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}

export function TeacherPage() {
  const { data } = useQuery({ queryKey: ["teacher-dashboard"], queryFn: () => studyApi.getTeacherDashboard() });

  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
      <Surface>
        <SectionTitle eyebrow="Teacher Dashboard" title="Class heatmap and intervention prompts" />
        <div className="space-y-3">
          {(data?.classHeatmap ?? []).map((item) => (
            <div key={item.label} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-[11px] text-muted-foreground">{item.risk} students at risk</div>
              </div>
              <Progress value={item.mastery} className="mt-3 h-2 bg-muted" />
            </div>
          ))}
        </div>
      </Surface>

      <div className="space-y-4">
        <Surface>
          <SectionTitle eyebrow="Recommended Interventions" title="Teacher-to-student personalization" />
          <div className="space-y-3">
            {(data?.interventions ?? []).map((item) => (
              <div key={item} className="rounded-2xl border border-border/40 bg-muted/20 p-4 text-sm text-foreground/80">
                {item}
              </div>
            ))}
          </div>
        </Surface>

        <Surface>
          <SectionTitle eyebrow="Assignments" title="Published support work" />
          <div className="space-y-3">
            {(data?.assignments ?? []).map((assignment) => (
              <div key={assignment.id} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{assignment.title}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{assignment.target} · due {assignment.dueLabel}</div>
                  </div>
                  <StatusPill label={assignment.status} tone={assignment.status === "completed" ? "success" : "default"} />
                </div>
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}

export function CounselorPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ["risk"], queryFn: () => studyApi.getRiskDashboard() });
  const [title, setTitle] = useState("Confidence-safe intervention");
  const [summary, setSummary] = useState("Start with a five-minute warm-up, then shrink the next hard block if confidence stays below 60%.");

  const interventionMutation = useMutation({
    mutationFn: () =>
      studyApi.createIntervention({
        title,
        ownerRole: "counselor",
        summary,
        nextCheckInLabel: "Tomorrow"
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["risk"] });
    }
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
      <div className="space-y-4">
        <Surface>
          <SectionTitle eyebrow="Counselor Dashboard" title="Supportive wellbeing and academic-risk signals" />
          <div className="space-y-3">
            {(data?.signals ?? []).map((signal) => (
              <div key={signal.id} className="rounded-2xl border border-warning/20 bg-warning/10 p-4">
                <div className="text-sm font-medium text-warning">{signal.title}</div>
                <p className="mt-2 text-sm text-foreground/80">{signal.message}</p>
                <p className="mt-2 text-[11px] font-mono text-muted-foreground">{signal.nextAction}</p>
              </div>
            ))}
          </div>
        </Surface>

        <Surface>
          <SectionTitle eyebrow="Interventions" title="Logged and auditable support plans" />
          <div className="space-y-3">
            {(data?.interventions ?? []).map((plan) => (
              <div key={plan.id} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium">{plan.title}</div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{plan.ownerRole} · next check-in {plan.nextCheckInLabel}</div>
                  </div>
                  <StatusPill label={plan.status} tone={plan.status === "completed" ? "success" : "default"} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{plan.summary}</p>
              </div>
            ))}
          </div>
        </Surface>
      </div>

      <div className="space-y-4">
        <Surface>
          <SectionTitle eyebrow="New Intervention" title="Create a supportive plan" />
          <Input value={title} onChange={(event) => setTitle(event.target.value)} className="bg-muted/30" />
          <Textarea value={summary} onChange={(event) => setSummary(event.target.value)} className="mt-3 min-h-[140px] bg-muted/30" />
          <div className="mt-3">
            <Button onClick={() => interventionMutation.mutate()} disabled={interventionMutation.isPending || !title.trim() || !summary.trim()}>
              Create Intervention
            </Button>
          </div>
        </Surface>

        <Surface>
          <SectionTitle eyebrow="Policy Note" title="Default behavior" />
          <p className="text-sm leading-relaxed text-muted-foreground">{data?.wellbeingNote}</p>
        </Surface>
      </div>
    </div>
  );
}

export function AdminPage() {
  const { data } = useQuery({ queryKey: ["admin-dashboard"], queryFn: () => studyApi.getAdminDashboard() });

  return (
    <div className="space-y-4">
      <Surface>
        <SectionTitle eyebrow="Admin Console" title="Institution scaffolding for later releases" detail="V1 stays student-first, but tenant, curriculum, analytics, and billing surfaces are now backed by a shared study-domain contract." />
        <div className="grid gap-3 md:grid-cols-4">
          <StatTile label="Active Missions" value={`${data?.activeMissions ?? 0}`} />
          <StatTile label="Role Types" value={`${data?.roleTypes ?? 0}`} />
          <StatTile label="Support Dashboards" value={`${data?.supportDashboards ?? 0}`} />
          <StatTile label="PWA Ready" value={data?.pwaReady ? "yes" : "no"} tone="success" />
        </div>
      </Surface>

      <Surface>
        <SectionTitle eyebrow="Planned Modules" title="Institution rollout path" />
        <div className="grid gap-3 xl:grid-cols-2">
          {(data?.plannedModules ?? []).map((item) => (
            <div key={item} className="rounded-2xl border border-border/40 bg-muted/20 p-4 text-sm text-foreground/80">
              {item}
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
}
