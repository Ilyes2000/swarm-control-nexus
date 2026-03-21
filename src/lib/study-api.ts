import {
  adminDashboardSeed,
  authSessionSeed,
  calendarSeed,
  careerSeed,
  consentPolicySeed,
  dashboardSeed,
  goalsSeed,
  guardianSeed,
  interventionsSeed,
  masteryWorkspaceSeed,
  missionsSeed,
  notesSeed,
  practiceWorkspaceSeed,
  profileSeed,
  resourcesSeed,
  revisionSeed,
  riskSeed,
  roleClaimsSeed,
  teacherSeed,
  uploadsSeed
} from "@/lib/study-seed";
import type {
  AdminDashboard,
  AuthSession,
  CalendarData,
  CareerPlan,
  ConsentPolicy,
  DashboardData,
  GuardianDashboard,
  InterventionPlan,
  MasteryWorkspace,
  MissionDetail,
  PracticeAttempt,
  PracticeWorkspace,
  RevisionData,
  RiskDashboard,
  RoleClaim,
  StudentProfile,
  StudyGoal,
  StudyMission,
  StudyNote,
  StudyResource,
  StudySession,
  StudyTask,
  TeacherDashboard,
  UploadAsset
} from "@/lib/study-types";
import { getMissionApiUrl } from "@/lib/mission-client";

const storagePrefix = "study-mission-os";

async function requestJson<T>(path: string, init: RequestInit, fallback: () => T | Promise<T>): Promise<T> {
  try {
    const response = await fetch(getMissionApiUrl(path), {
      headers: {
        "Content-Type": "application/json"
      },
      ...init
    });
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch {
    return fallback();
  }
}

function readLocalValue<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(`${storagePrefix}.${key}`);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocalValue<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(`${storagePrefix}.${key}`, JSON.stringify(value));
}

function nextLocalId(prefix: string) {
  const key = `${storagePrefix}.sequence`;
  const current = typeof window === "undefined" ? 0 : Number(window.localStorage.getItem(key) ?? "100");
  const next = current + 1;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, String(next));
  }
  return `${prefix}-${next}`;
}

function readProfile(): StudentProfile {
  return readLocalValue("profile", profileSeed);
}

function writeProfile(profile: StudentProfile) {
  writeLocalValue("profile", profile);
}

function readAuthSession(): AuthSession {
  const fallback = {
    ...authSessionSeed,
    userId: readProfile().id,
    role: readProfile().role,
    onboardingCompleted: readProfile().onboardingCompleted
  };
  return readLocalValue("auth-session", fallback);
}

function writeAuthSession(session: AuthSession) {
  writeLocalValue("auth-session", session);
}

function readCollection<T>(key: string, fallback: T[]): T[] {
  return readLocalValue(key, fallback);
}

function writeCollection<T>(key: string, value: T[]) {
  writeLocalValue(key, value);
}

function updateCollectionItem<T extends { id: string }>(key: string, fallback: T[], id: string, updates: Partial<T>): T | null {
  const items = readCollection(key, fallback);
  let updated: T | null = null;
  const next = items.map((item) => {
    if (item.id !== id) {
      return item;
    }
    updated = { ...item, ...updates };
    return updated;
  });
  writeCollection(key, next);
  return updated;
}

function buildLocalRevision(): RevisionData {
  const revision = readLocalValue("revision", revisionSeed);
  const flashcards = readCollection("flashcards", revisionSeed.flashcards);
  return {
    ...revision,
    flashcards
  };
}

function buildLocalMastery(): MasteryWorkspace {
  return {
    masteryNodes: readCollection("mastery", masteryWorkspaceSeed.masteryNodes),
    knowledgeTwin: readCollection("knowledge-twin", masteryWorkspaceSeed.knowledgeTwin),
    mistakePatterns: readCollection("mistake-patterns", masteryWorkspaceSeed.mistakePatterns)
  };
}

function buildLocalCalendar(): CalendarData {
  return {
    ...calendarSeed,
    sources: readCollection("calendar-sources", calendarSeed.sources),
    conflicts: readCollection("calendar-conflicts", calendarSeed.conflicts),
    sessions: readCollection("sessions", calendarSeed.sessions),
    tasks: readCollection("tasks", calendarSeed.tasks),
    reminders: readCollection("reminders", calendarSeed.reminders)
  };
}

function buildLocalDashboard(): DashboardData {
  const profile = readProfile();
  const tasks = readCollection("tasks", calendarSeed.tasks);
  const sessions = readCollection("sessions", calendarSeed.sessions);
  const missions = readCollection("missions", missionsSeed);
  const risks = readCollection("risk-signals", riskSeed.signals);
  const revision = buildLocalRevision();
  const mastery = buildLocalMastery();
  const completedTasks = tasks.filter((task) => task.status === "completed").length;
  const activeTasks = tasks.filter((task) => task.status !== "completed").length;
  const readinessBase = mastery.masteryNodes.length
    ? Math.round(mastery.masteryNodes.reduce((sum, node) => sum + node.mastery, 0) / mastery.masteryNodes.length)
    : dashboardSeed.hero.readinessScore;

  return {
    hero: {
      studentName: profile.displayName,
      readinessScore: readinessBase,
      streakDays: revision.streakDays,
      focusMission: missions[0] ?? null,
      nextSession: sessions.find((session) => session.status === "planned") ?? null
    },
    stats: [
      { label: "Completed Tasks", value: `${completedTasks}` },
      { label: "Active Tasks", value: `${activeTasks}` },
      { label: "Weekly Capacity", value: `${profile.weeklyStudyHours}h` },
      { label: "Risk Signals", value: `${risks.length}` }
    ],
    focusAreas: missions[0]?.focusAreas ?? [],
    upcomingSessions: sessions.slice(0, 3),
    risks,
    pendingReminders: buildLocalCalendar().reminders,
    calendarConflicts: buildLocalCalendar().conflicts
  };
}

function buildLocalPractice(): PracticeWorkspace {
  return {
    sets: readCollection("practice-sets", practiceWorkspaceSeed.sets),
    recentAttempts: readCollection("practice-attempts", practiceWorkspaceSeed.recentAttempts),
    mistakePatterns: readCollection("mistake-patterns", practiceWorkspaceSeed.mistakePatterns)
  };
}

function buildLocalGuardianDashboard(): GuardianDashboard {
  const dashboard = buildLocalDashboard();
  const consent = readLocalValue("consent-policy", consentPolicySeed);
  return {
    studentName: dashboard.hero.studentName,
    consistency: `${buildLocalRevision().streakDays} day streak`,
    latestRisk: dashboard.risks[0] ?? guardianSeed.latestRisk,
    nextSession: dashboard.hero.nextSession ?? guardianSeed.nextSession,
    encouragementPrompts: guardianSeed.encouragementPrompts,
    visibility: consent.guardianVisibility,
    approvals: guardianSeed.approvals
  };
}

function buildLocalTeacherDashboard(): TeacherDashboard {
  const mastery = buildLocalMastery();
  const assignments = readCollection("teacher-assignments", teacherSeed.assignments);
  return {
    classHeatmap: mastery.masteryNodes.slice(0, 4).map((node) => ({
      label: node.label,
      mastery: node.mastery,
      risk: node.mastery < 55 ? 5 : node.mastery < 70 ? 3 : 1
    })),
    interventions: teacherSeed.interventions,
    assignments
  };
}

function buildLocalAdminDashboard(): AdminDashboard {
  const session = readAuthSession();
  const missions = readCollection("missions", missionsSeed);
  return {
    activeMissions: missions.length,
    roleTypes: session.availableRoles.length,
    supportDashboards: 4,
    pwaReady: true,
    plannedModules: adminDashboardSeed.plannedModules
  };
}

function scorePracticeAttempt(setTitle: string, answer: string, expectedKeywords: string[], confidenceBefore: number): PracticeAttempt {
  const normalizedAnswer = answer.toLowerCase();
  const matchedKeywords = expectedKeywords.filter((keyword) => normalizedAnswer.includes(keyword.toLowerCase())).length;
  const score = Math.max(35, Math.min(96, 45 + matchedKeywords * 14 + Math.min(20, Math.floor(answer.length / 25))));

  return {
    id: nextLocalId("attempt"),
    setId: "",
    setTitle,
    subject: "Mathematics",
    answer,
    score,
    confidenceBefore,
    confidenceAfter: Math.max(confidenceBefore, Math.min(95, confidenceBefore + Math.round(score / 12))),
    firstError: matchedKeywords >= 2
      ? "The method is mostly sound, but the justification is still too thin under exam conditions."
      : "The first step is under-specified, so the method choice still feels unstable.",
    createdAt: new Date().toISOString(),
    status: "scored"
  };
}

export const studyApi = {
  async getAuthSession(): Promise<AuthSession> {
    return requestJson<AuthSession>("/api/auth/session", { method: "GET" }, () => readAuthSession());
  },
  async switchRole(role: AuthSession["role"]): Promise<AuthSession> {
    return requestJson<AuthSession>(
      "/api/auth/role",
      { method: "POST", body: JSON.stringify({ role }) },
      () => {
        const session = { ...readAuthSession(), role };
        writeAuthSession(session);
        const profile = { ...readProfile(), role };
        writeProfile(profile);
        return session;
      }
    );
  },
  async getRoleClaims(): Promise<RoleClaim[]> {
    return requestJson<{ claims: RoleClaim[] }>("/api/auth/claims", { method: "GET" }, () => ({ claims: roleClaimsSeed })).then((payload) => payload.claims);
  },
  async getConsentPolicy(): Promise<ConsentPolicy> {
    return requestJson<ConsentPolicy>("/api/auth/consent", { method: "GET" }, () => readLocalValue("consent-policy", consentPolicySeed));
  },
  async updateConsentPolicy(updates: Partial<ConsentPolicy>): Promise<ConsentPolicy> {
    return requestJson<ConsentPolicy>(
      "/api/auth/consent",
      { method: "PATCH", body: JSON.stringify(updates) },
      () => {
        const next = { ...readLocalValue("consent-policy", consentPolicySeed), ...updates, lastUpdated: new Date().toISOString() };
        writeLocalValue("consent-policy", next);
        return next;
      }
    );
  },
  async getProfile(): Promise<StudentProfile> {
    const payload = await requestJson<{ profile: StudentProfile }>("/api/profiles/me", { method: "GET" }, () => ({ profile: readProfile() }));
    writeProfile(payload.profile);
    return payload.profile;
  },
  async updateProfile(updates: Partial<StudentProfile>): Promise<StudentProfile> {
    const profile = readProfile();
    const payload = await requestJson<{ profile: StudentProfile }>(
      "/api/profiles/me",
      { method: "PATCH", body: JSON.stringify(updates) },
      () => ({
        profile: {
          ...profile,
          ...updates,
          accessibility: { ...profile.accessibility, ...(updates.accessibility ?? {}) },
          notificationPreferences: { ...profile.notificationPreferences, ...(updates.notificationPreferences ?? {}) }
        }
      })
    );
    writeProfile(payload.profile);
    writeAuthSession({ ...readAuthSession(), role: payload.profile.role, onboardingCompleted: payload.profile.onboardingCompleted });
    return payload.profile;
  },
  async getDashboard(): Promise<DashboardData> {
    return requestJson<DashboardData>("/api/profiles/dashboard", { method: "GET" }, () => buildLocalDashboard());
  },
  async getCalendar(): Promise<CalendarData> {
    return requestJson<CalendarData>("/api/calendar", { method: "GET" }, () => buildLocalCalendar());
  },
  async syncCalendar(provider: string): Promise<CalendarData> {
    return requestJson<CalendarData>(
      "/api/calendar/sync",
      { method: "POST", body: JSON.stringify({ provider }) },
      () => {
        const sources = readCollection("calendar-sources", calendarSeed.sources).map((source) =>
          source.provider === provider ? { ...source, lastSyncedAt: new Date().toISOString(), status: "connected" } : source
        );
        writeCollection("calendar-sources", sources);
        return buildLocalCalendar();
      }
    );
  },
  async getGoals(): Promise<StudyGoal[]> {
    return requestJson<{ goals: StudyGoal[] }>("/api/goals", { method: "GET" }, () => ({ goals: readCollection("goals", goalsSeed) })).then((payload) => payload.goals);
  },
  async createGoal(goal: Omit<StudyGoal, "id" | "progress"> & { progress?: number }): Promise<StudyGoal> {
    return requestJson<{ goal: StudyGoal }>(
      "/api/goals",
      { method: "POST", body: JSON.stringify(goal) },
      () => {
        const nextGoal = { id: nextLocalId("goal"), progress: goal.progress ?? 0, ...goal };
        writeCollection("goals", [nextGoal, ...readCollection("goals", goalsSeed)]);
        return { goal: nextGoal };
      }
    ).then((payload) => payload.goal);
  },
  async updateGoal(goalId: string, updates: Partial<StudyGoal>): Promise<StudyGoal | null> {
    return requestJson<{ goal: StudyGoal | null }>(
      `/api/goals/${goalId}`,
      { method: "PATCH", body: JSON.stringify(updates) },
      () => ({ goal: updateCollectionItem("goals", goalsSeed, goalId, updates) })
    ).then((payload) => payload.goal);
  },
  async getMissions(): Promise<StudyMission[]> {
    return requestJson<{ missions: StudyMission[] }>("/api/missions", { method: "GET" }, () => ({ missions: readCollection("missions", missionsSeed) })).then((payload) => payload.missions);
  },
  async getMission(missionId: string): Promise<MissionDetail | null> {
    return requestJson<MissionDetail | null>(`/api/missions/${missionId}`, { method: "GET" }, () => {
      const mission = readCollection("missions", missionsSeed).find((item) => item.id === missionId);
      if (!mission) {
        return null;
      }
      return {
        mission,
        tasks: readCollection("tasks", calendarSeed.tasks).filter((task) => task.missionId === missionId),
        sessions: readCollection("sessions", calendarSeed.sessions).filter((session) => session.missionId === missionId),
        activity: []
      };
    });
  },
  async getTasks(): Promise<StudyTask[]> {
    return requestJson<{ tasks: StudyTask[] }>("/api/tasks", { method: "GET" }, () => ({ tasks: readCollection("tasks", calendarSeed.tasks) })).then((payload) => payload.tasks);
  },
  async updateTask(taskId: string, updates: Partial<StudyTask>): Promise<StudyTask> {
    return requestJson<{ task: StudyTask }>(
      `/api/tasks/${taskId}`,
      { method: "PATCH", body: JSON.stringify(updates) },
      () => ({ task: updateCollectionItem("tasks", calendarSeed.tasks, taskId, updates) ?? { ...calendarSeed.tasks[0], ...updates } })
    ).then((payload) => payload.task);
  },
  async getSessions(): Promise<StudySession[]> {
    return requestJson<{ sessions: StudySession[] }>("/api/sessions", { method: "GET" }, () => ({ sessions: readCollection("sessions", calendarSeed.sessions) })).then((payload) => payload.sessions);
  },
  async updateSession(sessionId: string, updates: Partial<StudySession>): Promise<StudySession> {
    return requestJson<{ session: StudySession }>(
      `/api/sessions/${sessionId}`,
      { method: "PATCH", body: JSON.stringify(updates) },
      () => ({ session: updateCollectionItem("sessions", calendarSeed.sessions, sessionId, updates) ?? { ...calendarSeed.sessions[0], ...updates } })
    ).then((payload) => payload.session);
  },
  async completeSession(sessionId: string, input: { confidenceAfter: number; reflection: string }): Promise<{ session: StudySession; riskSignal?: RiskDashboard["signals"][number] }> {
    return requestJson<{ session: StudySession; riskSignal?: RiskDashboard["signals"][number] }>(
      `/api/sessions/${sessionId}/complete`,
      { method: "POST", body: JSON.stringify(input) },
      () => {
        const session = updateCollectionItem("sessions", calendarSeed.sessions, sessionId, {
          status: "completed",
          confidenceAfter: input.confidenceAfter,
          reflection: input.reflection
        }) ?? { ...calendarSeed.sessions[0], status: "completed", confidenceAfter: input.confidenceAfter, reflection: input.reflection };

        let riskSignal;
        if (input.confidenceAfter < 55) {
          riskSignal = {
            id: nextLocalId("risk"),
            level: "moderate",
            title: "Low confidence after session",
            message: "The student finished the block, but confidence stayed fragile.",
            nextAction: "Trigger a 10-minute recap and shorten the next hard block.",
            category: "confidence"
          } as const;
          writeCollection("risk-signals", [riskSignal, ...readCollection("risk-signals", riskSeed.signals)]);
        }

        return { session, riskSignal };
      }
    );
  },
  async getResources(): Promise<StudyResource[]> {
    return requestJson<{ resources: StudyResource[] }>("/api/resources", { method: "GET" }, () => ({ resources: readCollection("resources", resourcesSeed) })).then((payload) => payload.resources);
  },
  async createResource(resource: Omit<StudyResource, "id">): Promise<StudyResource> {
    return requestJson<{ resource: StudyResource }>(
      "/api/resources",
      { method: "POST", body: JSON.stringify(resource) },
      () => {
        const nextResource = { id: nextLocalId("resource"), ...resource };
        writeCollection("resources", [nextResource, ...readCollection("resources", resourcesSeed)]);
        return { resource: nextResource };
      }
    ).then((payload) => payload.resource);
  },
  async getNotes(): Promise<StudyNote[]> {
    return requestJson<{ notes: StudyNote[] }>("/api/notes", { method: "GET" }, () => ({ notes: readCollection("notes", notesSeed) })).then((payload) => payload.notes);
  },
  async createNote(note: Omit<StudyNote, "id" | "updatedLabel" | "preview"> & { preview?: string }): Promise<StudyNote> {
    return requestJson<{ note: StudyNote }>(
      "/api/notes",
      { method: "POST", body: JSON.stringify(note) },
      () => {
        const body = note.body ?? "";
        const preview = note.preview ?? (body.slice(0, 120) || "New note");
        const nextNote = { id: nextLocalId("note"), updatedLabel: "Just now", flashcardCount: 0, ...note, preview };
        writeCollection("notes", [nextNote, ...readCollection("notes", notesSeed)]);
        return { note: nextNote };
      }
    ).then((payload) => payload.note);
  },
  async updateNote(noteId: string, updates: Partial<StudyNote>): Promise<StudyNote | null> {
    return requestJson<{ note: StudyNote | null }>(
      `/api/notes/${noteId}`,
      { method: "PATCH", body: JSON.stringify(updates) },
      () => ({ note: updateCollectionItem("notes", notesSeed, noteId, { ...updates, updatedLabel: "Just now" }) })
    ).then((payload) => payload.note);
  },
  async summarizeNote(noteId: string): Promise<StudyNote | null> {
    return requestJson<{ note: StudyNote | null }>(
      `/api/notes/${noteId}/summarize`,
      { method: "POST" },
      () => {
        const notes = readCollection("notes", notesSeed);
        const note = notes.find((item) => item.id === noteId);
        if (!note) {
          return { note: null };
        }
        const summary = (note.body ?? note.preview).split(/[.!?]\s/).slice(0, 2).join(". ");
        const updated = updateCollectionItem("notes", notesSeed, noteId, { summary, updatedLabel: "Just now" });
        return { note: updated };
      }
    ).then((payload) => payload.note);
  },
  async convertNoteToFlashcards(noteId: string): Promise<{ note: StudyNote | null; createdCards: number }> {
    return requestJson<{ note: StudyNote | null; createdCards: number }>(
      `/api/notes/${noteId}/flashcards`,
      { method: "POST" },
      () => {
        const notes = readCollection("notes", notesSeed);
        const note = notes.find((item) => item.id === noteId);
        if (!note) {
          return { note: null, createdCards: 0 };
        }

        const sentences = (note.body ?? note.preview)
          .split(/\n|[.!?]\s/)
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 3);
        const flashcards = readCollection("flashcards", revisionSeed.flashcards);
        const newCards = sentences.map((sentence, index) => ({
          id: nextLocalId("flashcard"),
          subject: note.subject,
          deck: note.title,
          front: `Recall ${index + 1} from ${note.title}`,
          back: sentence,
          dueLabel: index === 0 ? "Tonight" : "Tomorrow",
          mastery: 35
        }));
        writeCollection("flashcards", [...newCards, ...flashcards]);
        const updated = updateCollectionItem("notes", notesSeed, noteId, {
          flashcardCount: (note.flashcardCount ?? 0) + newCards.length,
          updatedLabel: "Just now"
        });
        return { note: updated, createdCards: newCards.length };
      }
    );
  },
  async getUploads(): Promise<UploadAsset[]> {
    return requestJson<{ uploads: UploadAsset[] }>("/api/uploads", { method: "GET" }, () => ({ uploads: readCollection("uploads", uploadsSeed) })).then((payload) => payload.uploads);
  },
  async createUpload(input: { title: string; subject: string; kind: UploadAsset["kind"] }): Promise<{ upload: UploadAsset; resource: StudyResource }> {
    return requestJson<{ upload: UploadAsset; resource: StudyResource }>(
      "/api/uploads",
      { method: "POST", body: JSON.stringify(input) },
      () => {
        const upload = {
          id: nextLocalId("upload"),
          kind: input.kind,
          title: input.title,
          subject: input.subject,
          status: "processed",
          extractedSummary: `Extracted a ${input.kind} study asset for ${input.subject} and attached it to the resource library.`,
          createdAt: new Date().toISOString()
        } as UploadAsset;
        const resource = {
          id: nextLocalId("resource"),
          title: input.title,
          type: `${input.kind} upload`,
          subject: input.subject,
          durationMin: 15,
          description: upload.extractedSummary,
          uploadId: upload.id
        } satisfies StudyResource;
        writeCollection("uploads", [upload, ...readCollection("uploads", uploadsSeed)]);
        writeCollection("resources", [resource, ...readCollection("resources", resourcesSeed)]);
        return { upload, resource };
      }
    );
  },
  async getPractice(): Promise<PracticeWorkspace> {
    return requestJson<PracticeWorkspace>("/api/practice", { method: "GET" }, () => buildLocalPractice());
  },
  async submitPracticeAttempt(input: { setId: string; answer: string; confidenceBefore: number }): Promise<{ attempt: PracticeAttempt }> {
    return requestJson<{ attempt: PracticeAttempt }>(
      "/api/practice/attempts",
      { method: "POST", body: JSON.stringify(input) },
      () => {
        const practice = buildLocalPractice();
        const set = practice.sets.find((item) => item.id === input.setId) ?? practiceWorkspaceSeed.sets[0];
        const attempt = {
          ...scorePracticeAttempt(set.title, input.answer, set.expectedKeywords ?? [], input.confidenceBefore),
          setId: set.id,
          subject: set.subject
        };
        writeCollection("practice-attempts", [attempt, ...readCollection("practice-attempts", practiceWorkspaceSeed.recentAttempts)]);
        const mistakePatterns = practice.mistakePatterns.map((pattern, index) =>
          index === 0 ? { ...pattern, frequency: pattern.frequency + 1 } : pattern
        );
        writeCollection("mistake-patterns", mistakePatterns);
        const masteryNodes = buildLocalMastery().masteryNodes.map((node, index) =>
          index === 0
            ? {
                ...node,
                mastery: Math.min(96, node.mastery + Math.max(1, Math.round(attempt.score / 18))),
                confidence: Math.min(95, node.confidence + Math.max(1, Math.round((attempt.confidenceAfter - input.confidenceBefore) / 2))),
                trend: "up" as const
              }
            : node
        );
        writeCollection("mastery", masteryNodes);
        return { attempt };
      }
    );
  },
  async generateSimilarQuestion(setId: string): Promise<PracticeSet> {
    return requestJson<{ set: PracticeSet }>(
      `/api/practice/${setId}/similar`,
      { method: "POST" },
      () => {
        const base = buildLocalPractice().sets.find((item) => item.id === setId) ?? practiceWorkspaceSeed.sets[0];
        const next = {
          ...base,
          id: nextLocalId("practice"),
          title: `${base.title} Remix`,
          prompt: `${base.prompt} This time, justify the method before solving the final step.`
        };
        writeCollection("practice-sets", [next, ...readCollection("practice-sets", practiceWorkspaceSeed.sets)]);
        return { set: next };
      }
    ).then((payload) => payload.set);
  },
  async getRevision(): Promise<RevisionData> {
    return requestJson<RevisionData>("/api/revision", { method: "GET" }, () => buildLocalRevision());
  },
  async reviewFlashcard(input: { flashcardId: string; rating: "again" | "good" | "easy" }): Promise<RevisionData> {
    return requestJson<RevisionData>(
      "/api/revision/review",
      { method: "POST", body: JSON.stringify(input) },
      () => {
        const flashcards = readCollection("flashcards", revisionSeed.flashcards).map((card) =>
          card.id === input.flashcardId
            ? {
                ...card,
                dueLabel: input.rating === "again" ? "Tonight" : input.rating === "easy" ? "In 3 days" : "Tomorrow",
                mastery: Math.max(10, Math.min(95, card.mastery + (input.rating === "again" ? -5 : input.rating === "easy" ? 12 : 7)))
              }
            : card
        );
        writeCollection("flashcards", flashcards);
        const revision = { ...buildLocalRevision(), flashcards };
        writeLocalValue("revision", { ...revision, streakDays: revision.streakDays + 1 });
        return { ...revision, streakDays: revision.streakDays + 1 };
      }
    );
  },
  async getMastery(): Promise<MasteryWorkspace> {
    return requestJson<MasteryWorkspace>("/api/mastery", { method: "GET" }, () => buildLocalMastery());
  },
  async getGuardianDashboard(): Promise<GuardianDashboard> {
    return requestJson<GuardianDashboard>("/api/guardian/dashboard", { method: "GET" }, () => buildLocalGuardianDashboard());
  },
  async getTeacherDashboard(): Promise<TeacherDashboard> {
    return requestJson<TeacherDashboard>("/api/teacher/dashboard", { method: "GET" }, () => buildLocalTeacherDashboard());
  },
  async getRiskDashboard(): Promise<RiskDashboard> {
    return requestJson<RiskDashboard>("/api/risk", { method: "GET" }, () => ({
      ...riskSeed,
      signals: readCollection("risk-signals", riskSeed.signals),
      interventions: readCollection("interventions", interventionsSeed)
    }));
  },
  async createIntervention(input: Omit<InterventionPlan, "id" | "status"> & { status?: InterventionPlan["status"] }): Promise<InterventionPlan> {
    return requestJson<{ intervention: InterventionPlan }>(
      "/api/risk/interventions",
      { method: "POST", body: JSON.stringify(input) },
      () => {
        const intervention = { id: nextLocalId("intervention"), status: input.status ?? "active", ...input };
        writeCollection("interventions", [intervention, ...readCollection("interventions", interventionsSeed)]);
        return { intervention };
      }
    ).then((payload) => payload.intervention);
  },
  async getCareerPlan(): Promise<CareerPlan> {
    return requestJson<CareerPlan>("/api/career", { method: "GET" }, () => readLocalValue("career-plan", careerSeed));
  },
  async updateCareerMilestone(milestoneId: string, status: "active" | "planned" | "completed"): Promise<CareerPlan> {
    return requestJson<CareerPlan>(
      `/api/career/milestones/${milestoneId}`,
      { method: "PATCH", body: JSON.stringify({ status }) },
      () => {
        const career = readLocalValue("career-plan", careerSeed);
        const next = {
          ...career,
          milestones: career.milestones.map((milestone) => milestone.id === milestoneId ? { ...milestone, status } : milestone)
        };
        writeLocalValue("career-plan", next);
        return next;
      }
    );
  },
  async getAdminDashboard(): Promise<AdminDashboard> {
    return requestJson<AdminDashboard>("/api/admin/dashboard", { method: "GET" }, () => buildLocalAdminDashboard());
  }
};
