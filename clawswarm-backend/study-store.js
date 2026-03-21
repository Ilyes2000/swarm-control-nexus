import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function clone(value) {
  return structuredClone(value);
}

function nowIso() {
  return new Date().toISOString();
}

function currentTimeLabel() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  });
}

const defaultPersistencePath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".data",
  "study-db.json"
);

function createSeedState() {
  let sequence = 0;
  const nextId = (prefix) => `${prefix}-${++sequence}`;

  const institutionId = nextId("institution");
  const classroomId = nextId("classroom");
  const missionId = nextId("mission");
  const noteId = nextId("note");
  const sessionOneId = nextId("session");
  const sessionTwoId = nextId("session");
  const sessionThreeId = nextId("session");
  const practiceOneId = nextId("practice");
  const practiceTwoId = nextId("practice");
  const masteryFactoringId = nextId("mastery");
  const masterySquareId = nextId("mastery");
  const masteryGraphId = nextId("mastery");
  const masteryRecallId = nextId("mastery");

  const state = {
    meta: {
      sequence,
      dbVersion: 1,
      seededAt: nowIso()
    },
    authSession: {
      status: "authenticated",
      userId: "student-1",
      role: "student",
      availableRoles: ["student", "guardian", "teacher", "counselor", "admin"],
      onboardingCompleted: false
    },
    roleClaims: [
      { id: nextId("claim"), role: "student", scope: "student", scopeId: "student-1", status: "active" },
      { id: nextId("claim"), role: "guardian", scope: "student", scopeId: "student-1", status: "active" },
      { id: nextId("claim"), role: "teacher", scope: "classroom", scopeId: classroomId, status: "active" },
      { id: nextId("claim"), role: "counselor", scope: "institution", scopeId: institutionId, status: "active" },
      { id: nextId("claim"), role: "admin", scope: "institution", scopeId: institutionId, status: "active" }
    ],
    consentPolicy: {
      guardianVisibility: "summary",
      teacherAccess: "classroom",
      counselorEscalationEnabled: true,
      shareWellbeingSignals: false,
      shareAcademicRiskSignals: true,
      lastUpdated: nowIso()
    },
    institutions: [
      {
        id: institutionId,
        name: "Openclaw STEM Academy"
      }
    ],
    classrooms: [
      {
        id: classroomId,
        institutionId,
        name: "Grade 11 STEM"
      }
    ],
    guardianLinks: [
      {
        id: nextId("guardian-link"),
        studentId: "student-1",
        guardianName: "Elena Johnson",
        relation: "Parent",
        visibility: "summary",
        status: "active"
      }
    ],
    profile: {
      id: "student-1",
      displayName: "Maya Johnson",
      role: "student",
      onboardingCompleted: false,
      gradeLevel: "Grade 11",
      curriculumTrack: "Math-First University Prep",
      examBoard: "AP / GCSE-aligned",
      timezone: "Asia/Dubai",
      weeklyStudyHours: 12,
      workSchedule: ["Tue 5:00 PM - 8:00 PM", "Thu 4:00 PM - 7:00 PM"],
      subjects: ["Mathematics", "Physics", "English"],
      energyPattern: "Peak focus after 7 PM",
      learningPreferences: ["visual", "step-by-step", "active recall"],
      targetScore: "90%+",
      institutionId,
      classroomIds: [classroomId],
      primaryLanguage: "English",
      accessibility: {
        dyslexiaMode: false,
        adhdMode: true,
        reducedMotion: false,
        textToSpeech: false,
        screenReaderOptimized: false
      },
      notificationPreferences: {
        push: true,
        email: true,
        whatsapp: false
      },
      aiReadinessMode: "guided"
    },
    subjects: [
      { id: nextId("subject"), name: "Mathematics" },
      { id: nextId("subject"), name: "Physics" },
      { id: nextId("subject"), name: "English" }
    ],
    curriculumTracks: [
      { id: nextId("track"), name: "Math-First University Prep" }
    ],
    calendarSources: [
      { id: nextId("calendar"), label: "Google Calendar", provider: "google", type: "personal", status: "connected", lastSyncedAt: nowIso() },
      { id: nextId("calendar"), label: "School Timetable", provider: "school", type: "school", status: "connected", lastSyncedAt: nowIso() }
    ],
    calendarConflicts: [
      { id: nextId("conflict"), title: "Work shift overlaps core sprint", description: "Thursday work hours overlap the planned 90-minute exam block.", severity: "moderate", sessionId: sessionTwoId }
    ],
    reminders: [
      { id: nextId("reminder"), kind: "session-start", channel: "push", text: "Warm start begins in 30 minutes.", scheduledFor: nowIso(), status: "scheduled" },
      { id: nextId("reminder"), kind: "streak-recovery", channel: "email", text: "Protect your revision streak with one 10-minute recall loop.", scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), status: "scheduled" }
    ],
    goals: [
      { id: nextId("goal"), title: "Raise algebra test score to 90%", subject: "Mathematics", deadlineLabel: "In 3 days", targetScore: "90%", progress: 64, type: "exam" },
      { id: nextId("goal"), title: "Keep revision streak alive for 10 days", subject: "Study Skills", deadlineLabel: "This week", targetScore: "10 day streak", progress: 70, type: "habit" },
      { id: nextId("goal"), title: "Finish scholarship essay outline", subject: "Career", deadlineLabel: "In 8 days", targetScore: "Draft ready", progress: 35, type: "career" }
    ],
    missions: [
      {
        id: missionId,
        title: "Quadratic Confidence Reset",
        prompt: "Recover algebra before the Friday test",
        status: "completed",
        focusAreas: ["Factoring quadratics", "Completing the square", "Graph interpretation"],
        readinessScore: 74,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        subject: "Mathematics",
        eventCount: 5
      }
    ],
    missionActivity: [
      { id: nextId("activity"), missionId, type: "plan_generated", summary: "Generated a three-session algebra rescue plan.", timestamp: nowIso() },
      { id: nextId("activity"), missionId, type: "mastery_updated", summary: "Mastery moved up after the last revision loop.", timestamp: nowIso() }
    ],
    tasks: [
      { id: nextId("task"), title: "Run quadratic diagnostic", subject: "Mathematics", type: "diagnostic", durationMin: 25, dueLabel: "Today", status: "completed", confidence: "medium", missionId, priorityScore: 92, difficultyScore: 40 },
      { id: nextId("task"), title: "Solve 6 factoring questions", subject: "Mathematics", type: "practice", durationMin: 45, dueLabel: "Tonight", status: "active", confidence: "high", missionId, priorityScore: 88, difficultyScore: 66 },
      { id: nextId("task"), title: "Flashcards: completing the square", subject: "Mathematics", type: "revision", durationMin: 20, dueLabel: "Tomorrow", status: "planned", confidence: "medium", missionId, priorityScore: 76, difficultyScore: 48 },
      { id: nextId("task"), title: "Confidence check-in", subject: "Study Skills", type: "reflection", durationMin: 10, dueLabel: "Tomorrow", status: "planned", confidence: "low", missionId, priorityScore: 64, difficultyScore: 18 }
    ],
    sessions: [
      { id: sessionOneId, title: "Warm start • Factoring quadratics", subject: "Mathematics", startLabel: "Tonight • 7:00 PM", durationMin: 50, mode: "deep-work", energyFit: "peak", status: "planned", missionId, startAt: nowIso(), confidenceAfter: null, reflection: null },
      { id: sessionTwoId, title: "Core sprint • Completing the square", subject: "Mathematics", startLabel: "Tomorrow • 6:30 PM", durationMin: 90, mode: "exam-sprint", energyFit: "peak", status: "planned", missionId, startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), confidenceAfter: null, reflection: null },
      { id: sessionThreeId, title: "Retention loop • Graph interpretation", subject: "Mathematics", startLabel: "Tomorrow • 8:15 PM", durationMin: 25, mode: "recall", energyFit: "low", status: "planned", missionId, startAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), confidenceAfter: null, reflection: null }
    ],
    resources: [
      { id: nextId("resource"), title: "Quadratic Methods Map", type: "concept guide", subject: "Mathematics", durationMin: 12, description: "One-page chooser between factoring, formula, and completing the square.", uploadId: "upload-1" },
      { id: nextId("resource"), title: "Mistake-proof Equation Solving", type: "worked examples", subject: "Mathematics", durationMin: 18, description: "Annotated solutions showing the first error checkpoint.", uploadId: "upload-2" },
      { id: nextId("resource"), title: "Scholarship Planning Checklist", type: "career", subject: "Career", durationMin: 10, description: "Application milestones, deadlines, and prompt tracking." }
    ],
    notes: [
      { id: noteId, title: "Cornell: Quadratics", subject: "Mathematics", preview: "Structure first, then choose method. Verify with roots/graph.", updatedLabel: "Today", body: "Cues:\n- look for structure\n- choose method before expanding\nSummary:\nUse graph checks after solving.", flashcardCount: 2, summary: "Choose the shortest valid method, then verify visually." },
      { id: nextId("note"), title: "Revision Journal", subject: "Study Skills", preview: "Confidence drops when I switch methods mid-solution.", updatedLabel: "Yesterday", body: "I lose confidence when I abandon a method halfway through.", flashcardCount: 0, summary: "Method switching is a trigger for avoidable errors." }
    ],
    uploads: [
      { id: "upload-1", kind: "pdf", title: "Quadratic pack.pdf", subject: "Mathematics", status: "processed", extractedSummary: "Quadratic methods, worked examples, and verification steps.", createdAt: nowIso() },
      { id: "upload-2", kind: "image", title: "Teacher board snapshot", subject: "Mathematics", status: "processed", extractedSummary: "Annotated worked solution highlighting the first sign-change pitfall.", createdAt: nowIso() }
    ],
    practiceSets: [
      { id: practiceOneId, title: "Quadratic Rescue Set", subject: "Mathematics", difficulty: "adaptive", mode: "exam-style", prompt: "Solve, justify, and verify the method you used.", hints: ["Name the structure.", "Choose a method.", "Check the result."], expectedKeywords: ["factor", "verify", "root"] },
      { id: practiceTwoId, title: "Proof Warm-up", subject: "Mathematics", difficulty: "medium", mode: "reasoning", prompt: "State givens, theorem, and claim before writing the proof.", hints: ["Write the goal.", "Mark the diagram.", "Justify each inference."], expectedKeywords: ["given", "therefore", "congruent"] }
    ],
    attempts: [
      { id: nextId("attempt"), setId: practiceOneId, setTitle: "Quadratic Rescue Set", subject: "Mathematics", answer: "I would factor first, then check the roots on the graph.", score: 68, confidenceBefore: 52, confidenceAfter: 60, firstError: "The setup was right, but the student switched methods mid-solution and dropped a sign.", createdAt: nowIso(), status: "scored" }
    ],
    flashcards: [
      { id: nextId("flashcard"), subject: "Mathematics", deck: "Quadratic Rescue", front: "What clue tells you factoring is the fastest tool?", back: "Look for factorable integer roots and a clean trinomial structure.", dueLabel: "Tonight", mastery: 42 },
      { id: nextId("flashcard"), subject: "Mathematics", deck: "Quadratic Rescue", front: "What is the quickest verification after solving?", back: "Substitute or verify roots against the graph/context.", dueLabel: "Tomorrow", mastery: 56 }
    ],
    masteryNodes: [
      { id: masteryFactoringId, label: "Factoring quadratics", subject: "Mathematics", mastery: 58, confidence: 49, trend: "up", status: "fragile", prerequisiteIds: [masteryRecallId] },
      { id: masterySquareId, label: "Completing the square", subject: "Mathematics", mastery: 43, confidence: 38, trend: "up", status: "at-risk", prerequisiteIds: [masteryRecallId] },
      { id: masteryGraphId, label: "Parabola features", subject: "Mathematics", mastery: 61, confidence: 57, trend: "steady", status: "developing", prerequisiteIds: [masteryFactoringId] },
      { id: masteryRecallId, label: "Active recall discipline", subject: "Study Skills", mastery: 69, confidence: 66, trend: "up", status: "solid", prerequisiteIds: [] }
    ],
    knowledgeTwin: [
      { id: nextId("twin"), label: "Factoring quadratics", cluster: "algebra", mastery: 58, confidence: 49, status: "fragile" },
      { id: nextId("twin"), label: "Completing the square", cluster: "algebra", mastery: 43, confidence: 38, status: "at-risk" },
      { id: nextId("twin"), label: "Parabola features", cluster: "visualization", mastery: 61, confidence: 57, status: "developing" },
      { id: nextId("twin"), label: "Confidence calibration", cluster: "metacognition", mastery: 54, confidence: 45, status: "fragile" }
    ],
    mistakePatterns: [
      { id: nextId("mistake"), label: "Sign error after rearranging terms", description: "A valid setup becomes unstable after a mid-solution sign slip.", frequency: 4, severity: "moderate", subject: "Mathematics" },
      { id: nextId("mistake"), label: "Method switching under pressure", description: "The student abandons a working approach too early.", frequency: 3, severity: "moderate", subject: "Mathematics" }
    ],
    riskSignals: [
      { id: nextId("risk"), level: "moderate", title: "Confidence dip before practice", message: "The student delays practice when the first example feels messy.", nextAction: "Use a 5-minute starter question before the deep-work block.", category: "confidence" }
    ],
    interventions: [
      { id: nextId("intervention"), title: "Confidence-safe restart plan", ownerRole: "counselor", summary: "Start with a five-minute warm-up, then resume the main sprint only after one correct setup.", status: "active", nextCheckInLabel: "Tomorrow" }
    ],
    teacherAssignments: [
      { id: nextId("assignment"), title: "Worked-example pair", target: "Algebra small group", dueLabel: "Thursday", status: "active" }
    ],
    studyGroups: [
      { id: nextId("group"), name: "STEM Sprint Circle", memberCount: 4, nextMeetingLabel: "Wednesday • 5:30 PM" }
    ],
    revision: {
      streakDays: 6
    },
    careerPlan: {
      headline: "Applied Math + Data Pathway",
      milestones: [
        { id: nextId("career"), title: "Scholarship shortlist", dueLabel: "In 2 weeks", status: "active" },
        { id: nextId("career"), title: "Portfolio math project", dueLabel: "This month", status: "planned" }
      ],
      aiReadiness: [
        "Use citation mode when summarizing sources.",
        "Keep answer-only mode off for teacher-restricted assignments.",
        "Document how AI support changed your revision plan."
      ],
      portfolio: ["Quadratic visualizer mini-project", "STEM tutoring volunteer hours"]
    },
    policyRules: [
      { id: nextId("policy"), title: "Answer-only blocked for restricted assignments", scope: "student", mode: "guardrail", status: "active" },
      { id: nextId("policy"), title: "Citation mode required for sourced summaries", scope: "student", mode: "citation", status: "active" }
    ]
  };

  state.meta.sequence = sequence;
  return state;
}

function ensureStateShape(rawState) {
  const seed = createSeedState();
  const merged = {
    ...seed,
    ...rawState,
    authSession: { ...seed.authSession, ...(rawState?.authSession ?? {}) },
    consentPolicy: { ...seed.consentPolicy, ...(rawState?.consentPolicy ?? {}) },
    profile: {
      ...seed.profile,
      ...(rawState?.profile ?? {}),
      accessibility: { ...seed.profile.accessibility, ...(rawState?.profile?.accessibility ?? {}) },
      notificationPreferences: { ...seed.profile.notificationPreferences, ...(rawState?.profile?.notificationPreferences ?? {}) }
    },
    revision: { ...seed.revision, ...(rawState?.revision ?? {}) },
    careerPlan: {
      ...seed.careerPlan,
      ...(rawState?.careerPlan ?? {}),
      milestones: rawState?.careerPlan?.milestones ?? seed.careerPlan.milestones,
      aiReadiness: rawState?.careerPlan?.aiReadiness ?? seed.careerPlan.aiReadiness,
      portfolio: rawState?.careerPlan?.portfolio ?? seed.careerPlan.portfolio
    }
  };

  merged.meta = {
    ...seed.meta,
    ...(rawState?.meta ?? {})
  };

  [
    "roleClaims",
    "institutions",
    "classrooms",
    "guardianLinks",
    "subjects",
    "curriculumTracks",
    "calendarSources",
    "calendarConflicts",
    "reminders",
    "goals",
    "missions",
    "missionActivity",
    "tasks",
    "sessions",
    "resources",
    "notes",
    "uploads",
    "practiceSets",
    "attempts",
    "flashcards",
    "masteryNodes",
    "knowledgeTwin",
    "mistakePatterns",
    "riskSignals",
    "interventions",
    "teacherAssignments",
    "studyGroups",
    "policyRules"
  ].forEach((key) => {
    merged[key] = Array.isArray(rawState?.[key]) ? rawState[key] : seed[key];
  });

  return merged;
}

function scorePracticeAttempt(set, answer, confidenceBefore) {
  const normalizedAnswer = String(answer ?? "").toLowerCase();
  const expectedKeywords = Array.isArray(set.expectedKeywords) ? set.expectedKeywords : [];
  const matchedKeywords = expectedKeywords.filter((keyword) => normalizedAnswer.includes(String(keyword).toLowerCase())).length;
  const score = Math.max(35, Math.min(96, 45 + matchedKeywords * 14 + Math.min(20, Math.floor(normalizedAnswer.length / 25))));

  return {
    score,
    confidenceAfter: Math.max(confidenceBefore, Math.min(95, confidenceBefore + Math.round(score / 12))),
    firstError: matchedKeywords >= 2
      ? "The method is mostly sound, but the justification is still too thin under exam conditions."
      : "The first step is under-specified, so the method choice still feels unstable."
  };
}

export function createStudyStore({ persistencePath = defaultPersistencePath, persist = true } = {}) {
  let state;
  if (persist && fs.existsSync(persistencePath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(persistencePath, "utf8"));
      state = ensureStateShape(raw);
    } catch {
      state = createSeedState();
    }
  } else {
    state = createSeedState();
  }

  const nextId = (prefix) => {
    state.meta.sequence += 1;
    return `${prefix}-${state.meta.sequence}`;
  };

  const persistState = () => {
    if (!persist) {
      return;
    }

    fs.mkdirSync(path.dirname(persistencePath), { recursive: true });
    fs.writeFileSync(persistencePath, JSON.stringify(state, null, 2));
  };

  const recordMissionActivity = (missionId, type, summary) => {
    state.missionActivity.unshift({
      id: nextId("activity"),
      missionId,
      type,
      summary,
      timestamp: nowIso()
    });

    state.missions = state.missions.map((mission) =>
      mission.id === missionId
        ? {
            ...mission,
            eventCount: (mission.eventCount ?? 0) + 1,
            updatedAt: nowIso()
          }
        : mission
    );
  };

  const buildRevisionQueue = () =>
    state.flashcards
      .slice(0, 4)
      .map((card) => ({
        id: card.id,
        title: card.front,
        dueLabel: card.dueLabel,
        cards: 1
      }));

  const buildDashboard = () => {
    const completedTasks = state.tasks.filter((task) => task.status === "completed").length;
    const activeTasks = state.tasks.filter((task) => task.status !== "completed").length;
    const readiness = state.masteryNodes.length
      ? Math.round(state.masteryNodes.reduce((sum, node) => sum + node.mastery, 0) / state.masteryNodes.length)
      : 0;

    return {
      hero: {
        studentName: state.profile.displayName,
        readinessScore: readiness,
        streakDays: state.revision.streakDays,
        focusMission: state.missions[0] ?? null,
        nextSession: state.sessions.find((session) => session.status === "planned") ?? null
      },
      stats: [
        { label: "Completed Tasks", value: `${completedTasks}` },
        { label: "Active Tasks", value: `${activeTasks}` },
        { label: "Weekly Capacity", value: `${state.profile.weeklyStudyHours}h` },
        { label: "Risk Signals", value: `${state.riskSignals.length}` }
      ],
      focusAreas: state.missions[0]?.focusAreas ?? [],
      upcomingSessions: clone(state.sessions.slice(0, 3)),
      risks: clone(state.riskSignals.slice(0, 4)),
      pendingReminders: clone(state.reminders.slice(0, 4)),
      calendarConflicts: clone(state.calendarConflicts)
    };
  };

  const markNoteLabelFresh = (note) => ({
    ...note,
    updatedLabel: "Just now"
  });

  persistState();

  return {
    getSnapshot() {
      return clone(state);
    },
    getDashboard() {
      return buildDashboard();
    },
    getPlanningContext({ missionText } = {}) {
      return clone({
        missionText,
        profile: state.profile,
        goals: state.goals,
        tasks: state.tasks,
        sessions: state.sessions,
        masteryNodes: state.masteryNodes,
        knowledgeTwin: state.knowledgeTwin,
        attempts: state.attempts.slice(0, 6),
        riskSignals: state.riskSignals,
        calendarSources: state.calendarSources,
        calendarConflicts: state.calendarConflicts,
        policyRules: state.policyRules
      });
    },
    getAuthSession() {
      return clone(state.authSession);
    },
    switchRole(role) {
      if (!state.authSession.availableRoles.includes(role)) {
        throw new Error("Role not available");
      }

      state.authSession = {
        ...state.authSession,
        role
      };
      state.profile = {
        ...state.profile,
        role
      };
      persistState();
      return this.getAuthSession();
    },
    getRoleClaims() {
      return clone(state.roleClaims);
    },
    getConsentPolicy() {
      return clone(state.consentPolicy);
    },
    updateConsentPolicy(updates) {
      state.consentPolicy = {
        ...state.consentPolicy,
        ...updates,
        lastUpdated: nowIso()
      };
      persistState();
      return this.getConsentPolicy();
    },
    getProfile() {
      return clone(state.profile);
    },
    updateProfile(updates) {
      state.profile = {
        ...state.profile,
        ...updates,
        accessibility: {
          ...state.profile.accessibility,
          ...(updates.accessibility ?? {})
        },
        notificationPreferences: {
          ...state.profile.notificationPreferences,
          ...(updates.notificationPreferences ?? {})
        }
      };
      state.authSession = {
        ...state.authSession,
        role: state.profile.role,
        onboardingCompleted: state.profile.onboardingCompleted
      };
      persistState();
      return this.getProfile();
    },
    getCalendar() {
      return {
        sources: clone(state.calendarSources),
        conflicts: clone(state.calendarConflicts),
        sessions: clone(state.sessions),
        tasks: clone(state.tasks),
        reminders: clone(state.reminders),
        syncStatus: `${state.calendarSources.filter((source) => source.status === "connected").length} sources connected`
      };
    },
    syncCalendar(provider) {
      state.calendarSources = state.calendarSources.map((source) =>
        source.provider === provider
          ? {
              ...source,
              status: "connected",
              lastSyncedAt: nowIso()
            }
          : source
      );
      persistState();
      return this.getCalendar();
    },
    listGoals() {
      return clone(state.goals);
    },
    createGoal(goal) {
      const record = {
        id: nextId("goal"),
        progress: 0,
        type: "weekly",
        ...goal
      };
      state.goals.unshift(record);
      persistState();
      return clone(record);
    },
    updateGoal(id, updates) {
      let updatedGoal = null;
      state.goals = state.goals.map((goal) => {
        if (goal.id !== id) {
          return goal;
        }

        updatedGoal = { ...goal, ...updates };
        return updatedGoal;
      });
      persistState();
      return updatedGoal ? clone(updatedGoal) : null;
    },
    listMissions() {
      return clone(state.missions);
    },
    getMissionDetail(missionId) {
      const mission = state.missions.find((item) => item.id === missionId);
      if (!mission) {
        return null;
      }

      return {
        mission: clone(mission),
        tasks: clone(state.tasks.filter((task) => task.missionId === missionId)),
        sessions: clone(state.sessions.filter((session) => session.missionId === missionId)),
        activity: clone(state.missionActivity.filter((entry) => entry.missionId === missionId))
      };
    },
    createMissionDraft({ prompt }) {
      const record = {
        id: nextId("mission"),
        title: "Draft Study Mission",
        prompt,
        status: "draft",
        focusAreas: [],
        readinessScore: 0,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        subject: "General Study",
        eventCount: 0
      };
      state.missions.unshift(record);
      recordMissionActivity(record.id, "draft_created", "Created a draft mission from the planner workspace.");
      persistState();
      return clone(record);
    },
    createMissionPlan({ missionText, plannerResult }) {
      const mission = {
        id: nextId("mission"),
        title: plannerResult.missionTitle,
        prompt: missionText,
        status: "live",
        focusAreas: plannerResult.focusAreas,
        readinessScore: plannerResult.readinessBaseline ?? 60,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        subject: plannerResult.subject,
        eventCount: 0
      };
      state.missions.unshift(mission);

      const tasks = plannerResult.tasks.map((task) => ({
        id: nextId("task"),
        title: task.title,
        subject: plannerResult.subject,
        type: task.type,
        durationMin: task.durationMin,
        dueLabel: task.dueLabel ?? (plannerResult.rescueMode ? "Before exam" : "This week"),
        status: "planned",
        confidence: task.confidenceWeight,
        missionId: mission.id,
        priorityScore: task.priorityScore ?? 70,
        difficultyScore: task.difficultyScore ?? 50
      }));

      const sessions = plannerResult.sessions.map((session) => ({
        id: nextId("session"),
        title: session.title,
        subject: plannerResult.subject,
        startLabel: session.label,
        durationMin: session.durationMin,
        mode: session.mode,
        energyFit: session.energyFit,
        status: "planned",
        missionId: mission.id,
        startAt: session.startAt ?? nowIso(),
        confidenceAfter: null,
        reflection: null
      }));

      state.tasks.unshift(...tasks);
      state.sessions.unshift(...sessions);
      state.reminders.unshift({
        id: nextId("reminder"),
        kind: "session-start",
        channel: "push",
        text: `Upcoming session: ${sessions[0]?.title ?? mission.title}`,
        scheduledFor: sessions[0]?.startAt ?? nowIso(),
        status: "scheduled"
      });
      recordMissionActivity(mission.id, "plan_generated", `Generated ${tasks.length} tasks and ${sessions.length} sessions.`);
      persistState();

      return {
        mission: clone(mission),
        tasks: clone(tasks),
        sessions: clone(sessions)
      };
    },
    recordMissionEvent(missionId, type, summary) {
      recordMissionActivity(missionId, type, summary);
      persistState();
    },
    completeMission({ missionId, coachResult, revisionResult, solverResult }) {
      state.missions = state.missions.map((mission) =>
        mission.id === missionId
          ? {
              ...mission,
              status: "completed",
              readinessScore: coachResult.readinessScore,
              updatedAt: nowIso()
            }
          : mission
      );

      state.masteryNodes = state.masteryNodes.map((node) => {
        const update = revisionResult.masteryUpdates.find((item) => item.topic === node.label);
        return update
          ? {
              ...node,
              mastery: update.mastery,
              confidence: update.confidence,
              trend: update.trend,
              status: update.mastery >= 75 ? "solid" : update.mastery >= 60 ? "developing" : "fragile"
            }
          : node;
      });

      state.knowledgeTwin = revisionResult.knowledgeTwin.map((node) => ({ ...node }));
      state.riskSignals = [
        {
          id: nextId("risk"),
          level: coachResult.riskLevel,
          title: coachResult.riskSignal.title,
          message: coachResult.riskSignal.message,
          nextAction: coachResult.riskSignal.nextAction,
          category: "confidence"
        },
        ...state.riskSignals
      ].slice(0, 6);

      state.notes.unshift(markNoteLabelFresh({
        id: nextId("note"),
        title: `${state.missions.find((mission) => mission.id === missionId)?.title ?? "Study Mission"} retrospective`,
        subject: "Study Skills",
        preview: `First error found: ${solverResult.firstError}`,
        updatedLabel: "Just now",
        body: `First error: ${solverResult.firstError}\nSafer method: ${solverResult.alternativeMethod}`,
        flashcardCount: 0,
        summary: "Mission completed with a stored retrospective."
      }));

      recordMissionActivity(missionId, "mission_completed", `Mission completed at readiness ${coachResult.readinessScore}%.`);
      persistState();
    },
    replanMission(command) {
      const activeMissionId = state.missions[0]?.id ?? null;
      const task = {
        id: nextId("task"),
        title: `Replan follow-up: ${command}`,
        subject: "Study Skills",
        type: "replan",
        durationMin: 15,
        dueLabel: "Today",
        status: "planned",
        confidence: "medium",
        missionId: activeMissionId,
        priorityScore: 86,
        difficultyScore: 24
      };
      const session = {
        id: nextId("session"),
        title: `Recovery block • ${command}`,
        subject: "Study Skills",
        startLabel: "Tonight • 8:40 PM",
        durationMin: 20,
        mode: "recovery",
        energyFit: "low",
        status: "planned",
        missionId: activeMissionId,
        startAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        confidenceAfter: null,
        reflection: null
      };
      state.tasks.unshift(task);
      state.sessions.unshift(session);
      if (activeMissionId) {
        recordMissionActivity(activeMissionId, "mission_replanned", `Accepted override: ${command}`);
      }
      persistState();
      return clone(task);
    },
    listTasks() {
      return clone(state.tasks);
    },
    updateTask(id, updates) {
      let updatedTask = null;
      state.tasks = state.tasks.map((task) => {
        if (task.id !== id) {
          return task;
        }

        updatedTask = { ...task, ...updates };
        return updatedTask;
      });
      persistState();
      return updatedTask ? clone(updatedTask) : null;
    },
    listSessions() {
      return clone(state.sessions);
    },
    updateSession(id, updates) {
      let updatedSession = null;
      state.sessions = state.sessions.map((session) => {
        if (session.id !== id) {
          return session;
        }

        updatedSession = { ...session, ...updates };
        return updatedSession;
      });
      persistState();
      return updatedSession ? clone(updatedSession) : null;
    },
    completeSession(id, { confidenceAfter, reflection }) {
      const session = this.updateSession(id, {
        status: "completed",
        confidenceAfter,
        reflection
      });
      if (!session) {
        return null;
      }

      let riskSignal = null;
      if (confidenceAfter < 55) {
        riskSignal = {
          id: nextId("risk"),
          level: "moderate",
          title: "Low confidence after session",
          message: "The student completed the block, but confidence stayed fragile.",
          nextAction: "Add a short recap loop before the next hard sprint.",
          category: "confidence"
        };
        state.riskSignals.unshift(riskSignal);
      }

      if (session.missionId) {
        recordMissionActivity(session.missionId, "session_completed", `${session.title} completed with confidence ${confidenceAfter}%.`);
      }
      persistState();
      return {
        session: clone(session),
        riskSignal: riskSignal ? clone(riskSignal) : undefined
      };
    },
    listResources() {
      return clone(state.resources);
    },
    createResource(resource) {
      const record = {
        id: nextId("resource"),
        ...resource
      };
      state.resources.unshift(record);
      persistState();
      return clone(record);
    },
    listNotes() {
      return clone(state.notes);
    },
    createNote(note) {
      const record = markNoteLabelFresh({
        id: nextId("note"),
        preview: note.preview ?? (String(note.body ?? "").slice(0, 120) || "New note"),
        updatedLabel: "Just now",
        flashcardCount: 0,
        summary: note.summary ?? "",
        ...note
      });
      state.notes.unshift(record);
      persistState();
      return clone(record);
    },
    updateNote(id, updates) {
      let updatedNote = null;
      state.notes = state.notes.map((note) => {
        if (note.id !== id) {
          return note;
        }

        updatedNote = markNoteLabelFresh({
          ...note,
          ...updates
        });
        return updatedNote;
      });
      persistState();
      return updatedNote ? clone(updatedNote) : null;
    },
    summarizeNote(id) {
      const note = state.notes.find((item) => item.id === id);
      if (!note) {
        return null;
      }

      const summary = String(note.body ?? note.preview)
        .split(/\n|[.!?]\s/)
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 2)
        .join(". ");

      return this.updateNote(id, {
        summary
      });
    },
    convertNoteToFlashcards(id) {
      const note = state.notes.find((item) => item.id === id);
      if (!note) {
        return { note: null, createdCards: 0 };
      }

      const snippets = String(note.body ?? note.preview)
        .split(/\n|[.!?]\s/)
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 3);
      const cards = snippets.map((snippet, index) => ({
        id: nextId("flashcard"),
        subject: note.subject,
        deck: note.title,
        front: `Recall ${index + 1} from ${note.title}`,
        back: snippet,
        dueLabel: index === 0 ? "Tonight" : "Tomorrow",
        mastery: 35
      }));
      state.flashcards.unshift(...cards);
      const updatedNote = this.updateNote(id, {
        flashcardCount: (note.flashcardCount ?? 0) + cards.length
      });
      persistState();
      return {
        note: updatedNote,
        createdCards: cards.length
      };
    },
    listUploads() {
      return clone(state.uploads);
    },
    createUpload({ title, subject, kind }) {
      const upload = {
        id: nextId("upload"),
        kind,
        title,
        subject,
        status: "processed",
        extractedSummary: `Extracted a ${kind} study asset for ${subject} and attached it to the resource library.`,
        createdAt: nowIso()
      };
      const resource = {
        id: nextId("resource"),
        title,
        type: `${kind} upload`,
        subject,
        durationMin: 15,
        description: upload.extractedSummary,
        uploadId: upload.id
      };
      state.uploads.unshift(upload);
      state.resources.unshift(resource);
      persistState();
      return {
        upload: clone(upload),
        resource: clone(resource)
      };
    },
    getPractice() {
      return {
        sets: clone(state.practiceSets),
        recentAttempts: clone(state.attempts.slice(0, 5)),
        mistakePatterns: clone(state.mistakePatterns)
      };
    },
    createSimilarPracticeSet(setId) {
      const base = state.practiceSets.find((set) => set.id === setId);
      if (!base) {
        return null;
      }

      const nextSet = {
        ...base,
        id: nextId("practice"),
        title: `${base.title} Remix`,
        prompt: `${base.prompt} This time, justify the method before solving the final step.`
      };
      state.practiceSets.unshift(nextSet);
      persistState();
      return clone(nextSet);
    },
    createPracticeAttempt({ setId, answer, confidenceBefore }) {
      const set = state.practiceSets.find((item) => item.id === setId);
      if (!set) {
        throw new Error("Practice set not found");
      }

      const scored = scorePracticeAttempt(set, answer, confidenceBefore);
      const attempt = {
        id: nextId("attempt"),
        setId: set.id,
        setTitle: set.title,
        subject: set.subject,
        answer,
        score: scored.score,
        confidenceBefore,
        confidenceAfter: scored.confidenceAfter,
        firstError: scored.firstError,
        createdAt: nowIso(),
        status: "scored"
      };
      state.attempts.unshift(attempt);
      state.mistakePatterns = state.mistakePatterns.map((pattern, index) =>
        index === 0
          ? {
              ...pattern,
              frequency: pattern.frequency + 1
            }
          : pattern
      );
      state.masteryNodes = state.masteryNodes.map((node, index) =>
        index === 0
          ? {
              ...node,
              mastery: Math.min(96, node.mastery + Math.max(1, Math.round(scored.score / 18))),
              confidence: Math.min(95, node.confidence + Math.max(1, Math.round((scored.confidenceAfter - confidenceBefore) / 2))),
              trend: "up"
            }
          : node
      );
      persistState();
      return clone(attempt);
    },
    getRevision() {
      return {
        streakDays: state.revision.streakDays,
        queue: clone(buildRevisionQueue()),
        flashcards: clone(state.flashcards)
      };
    },
    reviewFlashcard({ flashcardId, rating }) {
      state.flashcards = state.flashcards.map((card) =>
        card.id === flashcardId
          ? {
              ...card,
              dueLabel: rating === "again" ? "Tonight" : rating === "easy" ? "In 3 days" : "Tomorrow",
              mastery: Math.max(10, Math.min(95, card.mastery + (rating === "again" ? -5 : rating === "easy" ? 12 : 7)))
            }
          : card
      );
      state.revision.streakDays += 1;
      persistState();
      return this.getRevision();
    },
    getMastery() {
      return {
        masteryNodes: clone(state.masteryNodes),
        knowledgeTwin: clone(state.knowledgeTwin),
        mistakePatterns: clone(state.mistakePatterns)
      };
    },
    getGuardianDashboard() {
      return {
        studentName: state.profile.displayName,
        consistency: `${state.revision.streakDays} day streak`,
        latestRisk: clone(state.riskSignals[0]),
        nextSession: clone(state.sessions[0]),
        encouragementPrompts: [
          "Celebrate starting on time, not just finishing perfectly.",
          "Ask what felt easier this week, not only what is still weak."
        ],
        visibility: state.consentPolicy.guardianVisibility,
        approvals: [
          "Weekly readiness snapshot shared",
          "Guardian digest enabled"
        ]
      };
    },
    getTeacherDashboard() {
      return {
        classHeatmap: [
          { label: "Factoring quadratics", mastery: 58, risk: 3 },
          { label: "Completing the square", mastery: 43, risk: 5 },
          { label: "Graph interpretation", mastery: 61, risk: 2 }
        ],
        interventions: [
          "Assign a worked-example pair before the next timed set.",
          "Push one oral-recall checkpoint after the first independent question."
        ],
        assignments: clone(state.teacherAssignments)
      };
    },
    getRisk() {
      return {
        signals: clone(state.riskSignals),
        interventions: clone(state.interventions),
        wellbeingNote: "Supportive nudges are enabled. No punitive alerts will be sent."
      };
    },
    createIntervention(intervention) {
      const record = {
        id: nextId("intervention"),
        status: "active",
        ...intervention
      };
      state.interventions.unshift(record);
      persistState();
      return clone(record);
    },
    getCareerPlan() {
      return clone(state.careerPlan);
    },
    updateCareerMilestone(id, status) {
      state.careerPlan = {
        ...state.careerPlan,
        milestones: state.careerPlan.milestones.map((milestone) =>
          milestone.id === id
            ? {
                ...milestone,
                status
              }
            : milestone
        )
      };
      persistState();
      return this.getCareerPlan();
    },
    getAdminDashboard() {
      return {
        activeMissions: state.missions.length,
        roleTypes: state.authSession.availableRoles.length,
        supportDashboards: 4,
        pwaReady: true,
        plannedModules: [
          "Curriculum templates and exam-board mappings",
          "Class imports and roster sync",
          "Institution analytics and intervention reporting",
          "Billing tiers and school license packaging"
        ]
      };
    }
  };
}
