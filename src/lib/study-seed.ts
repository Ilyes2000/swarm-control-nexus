import type {
  AdminDashboard,
  AuthSession,
  CalendarConflict,
  CalendarData,
  CalendarSource,
  CareerPlan,
  ConsentPolicy,
  DashboardData,
  Flashcard,
  GuardianDashboard,
  InterventionPlan,
  KnowledgeTwinNode,
  MasteryNode,
  MasteryWorkspace,
  MistakePattern,
  PracticeSet,
  PracticeWorkspace,
  Reminder,
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

export const profileSeed: StudentProfile = {
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
  institutionId: "institution-1",
  classroomIds: ["classroom-1"],
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
};

export const authSessionSeed: AuthSession = {
  status: "authenticated",
  userId: profileSeed.id,
  role: profileSeed.role,
  availableRoles: ["student", "guardian", "teacher", "counselor", "admin"],
  onboardingCompleted: profileSeed.onboardingCompleted
};

export const roleClaimsSeed: RoleClaim[] = [
  { id: "claim-1", role: "student", scope: "student", scopeId: profileSeed.id, status: "active" },
  { id: "claim-2", role: "guardian", scope: "student", scopeId: profileSeed.id, status: "active" },
  { id: "claim-3", role: "teacher", scope: "classroom", scopeId: "classroom-1", status: "active" },
  { id: "claim-4", role: "counselor", scope: "institution", scopeId: "institution-1", status: "active" },
  { id: "claim-5", role: "admin", scope: "institution", scopeId: "institution-1", status: "active" }
];

export const consentPolicySeed: ConsentPolicy = {
  guardianVisibility: "summary",
  teacherAccess: "classroom",
  counselorEscalationEnabled: true,
  shareWellbeingSignals: false,
  shareAcademicRiskSignals: true,
  lastUpdated: new Date().toISOString()
};

export const sessionsSeed: StudySession[] = [
  {
    id: "session-1",
    title: "Warm start • Factoring quadratics",
    subject: "Mathematics",
    startLabel: "Tonight • 7:00 PM",
    durationMin: 50,
    mode: "deep-work",
    energyFit: "peak",
    status: "planned",
    missionId: "mission-1",
    startAt: new Date().toISOString()
  },
  {
    id: "session-2",
    title: "Core sprint • Completing the square",
    subject: "Mathematics",
    startLabel: "Tomorrow • 6:30 PM",
    durationMin: 90,
    mode: "exam-sprint",
    energyFit: "peak",
    status: "planned",
    missionId: "mission-1",
    startAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "session-3",
    title: "Retention loop • Graph interpretation",
    subject: "Mathematics",
    startLabel: "Tomorrow • 8:15 PM",
    durationMin: 25,
    mode: "recall",
    energyFit: "low",
    status: "planned",
    missionId: "mission-1",
    startAt: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString()
  }
];

export const missionsSeed: StudyMission[] = [
  {
    id: "mission-1",
    title: "Quadratic Confidence Reset",
    prompt: "Recover algebra before the Friday test",
    status: "completed",
    focusAreas: ["Factoring quadratics", "Completing the square", "Graph interpretation"],
    readinessScore: 74,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subject: "Mathematics",
    eventCount: 6
  }
];

export const tasksSeed: StudyTask[] = [
  { id: "task-1", title: "Run quadratic diagnostic", subject: "Mathematics", type: "diagnostic", durationMin: 25, dueLabel: "Today", status: "completed", confidence: "medium", missionId: "mission-1", priorityScore: 92, difficultyScore: 40 },
  { id: "task-2", title: "Solve 6 factoring questions", subject: "Mathematics", type: "practice", durationMin: 45, dueLabel: "Tonight", status: "active", confidence: "high", missionId: "mission-1", priorityScore: 88, difficultyScore: 66 },
  { id: "task-3", title: "Flashcards: completing the square", subject: "Mathematics", type: "revision", durationMin: 20, dueLabel: "Tomorrow", status: "planned", confidence: "medium", missionId: "mission-1", priorityScore: 76, difficultyScore: 48 },
  { id: "task-4", title: "Confidence check-in", subject: "Study Skills", type: "reflection", durationMin: 10, dueLabel: "Tomorrow", status: "planned", confidence: "low", missionId: "mission-1", priorityScore: 64, difficultyScore: 18 }
];

export const goalsSeed: StudyGoal[] = [
  { id: "goal-1", title: "Raise algebra test score to 90%", subject: "Mathematics", deadlineLabel: "In 3 days", targetScore: "90%", progress: 64, type: "exam" },
  { id: "goal-2", title: "Keep revision streak alive for 10 days", subject: "Study Skills", deadlineLabel: "This week", targetScore: "10 day streak", progress: 70, type: "habit" },
  { id: "goal-3", title: "Finish scholarship essay outline", subject: "Career", deadlineLabel: "In 8 days", targetScore: "Draft ready", progress: 35, type: "career" }
];

export const resourcesSeed: StudyResource[] = [
  { id: "resource-1", title: "Quadratic Methods Map", type: "concept guide", subject: "Mathematics", durationMin: 12, description: "One-page chooser between factoring, formula, and completing the square.", uploadId: "upload-1" },
  { id: "resource-2", title: "Mistake-proof Equation Solving", type: "worked examples", subject: "Mathematics", durationMin: 18, description: "Annotated solutions showing the first error checkpoint.", uploadId: "upload-2" },
  { id: "resource-3", title: "Scholarship Planning Checklist", type: "career", subject: "Career", durationMin: 10, description: "Application milestones, deadlines, and prompt tracking." }
];

export const notesSeed: StudyNote[] = [
  { id: "note-1", title: "Cornell: Quadratics", subject: "Mathematics", preview: "Structure first, then choose method. Verify with roots and graph.", updatedLabel: "Today", body: "Cues:\n- look for structure\n- choose method before expanding\nSummary:\nUse graph checks after solving.", flashcardCount: 2, summary: "Choose the shortest valid method, then verify visually." },
  { id: "note-2", title: "Revision Journal", subject: "Study Skills", preview: "Confidence drops when I switch methods mid-solution.", updatedLabel: "Yesterday", body: "I lose confidence when I abandon a method halfway through.", flashcardCount: 0, summary: "Method switching is a trigger for avoidable errors." }
];

export const uploadsSeed: UploadAsset[] = [
  { id: "upload-1", kind: "pdf", title: "Quadratic pack.pdf", subject: "Mathematics", status: "processed", extractedSummary: "Quadratic methods, worked examples, and verification steps.", createdAt: new Date().toISOString() },
  { id: "upload-2", kind: "image", title: "Teacher board snapshot", subject: "Mathematics", status: "processed", extractedSummary: "Annotated worked solution highlighting the first sign-change pitfall.", createdAt: new Date().toISOString() }
];

export const practiceSeed: PracticeSet[] = [
  { id: "practice-1", title: "Quadratic Rescue Set", subject: "Mathematics", difficulty: "adaptive", mode: "exam-style", prompt: "Solve, justify, and verify the method you used.", hints: ["Name the structure.", "Choose a method.", "Check the result."], expectedKeywords: ["factor", "verify", "root"] },
  { id: "practice-2", title: "Proof Warm-up", subject: "Mathematics", difficulty: "medium", mode: "reasoning", prompt: "State givens, theorem, and claim before writing the proof.", hints: ["Write the goal.", "Mark the diagram.", "Justify each inference."], expectedKeywords: ["given", "therefore", "congruent"] }
];

export const mistakePatternsSeed: MistakePattern[] = [
  { id: "mistake-1", label: "Sign error after rearranging terms", description: "A valid setup becomes unstable after a mid-solution sign slip.", frequency: 4, severity: "moderate", subject: "Mathematics" },
  { id: "mistake-2", label: "Method switching under pressure", description: "The student abandons a working approach too early.", frequency: 3, severity: "moderate", subject: "Mathematics" }
];

export const attemptsSeed = [
  {
    id: "attempt-1",
    setId: "practice-1",
    setTitle: "Quadratic Rescue Set",
    subject: "Mathematics",
    answer: "I would factor first, then check the roots on the graph.",
    score: 68,
    confidenceBefore: 52,
    confidenceAfter: 60,
    firstError: "The setup was right, but the student switched methods mid-solution and dropped a sign.",
    createdAt: new Date().toISOString(),
    status: "scored"
  }
] as const;

export const flashcardsSeed: Flashcard[] = [
  { id: "flashcard-1", subject: "Mathematics", deck: "Quadratic Rescue", front: "What clue tells you factoring is the fastest tool?", back: "Look for factorable integer roots and a clean trinomial structure.", dueLabel: "Tonight", mastery: 42 },
  { id: "flashcard-2", subject: "Mathematics", deck: "Quadratic Rescue", front: "What is the quickest verification after solving?", back: "Substitute or verify roots against the graph/context.", dueLabel: "Tomorrow", mastery: 56 }
];

export const masterySeed: MasteryNode[] = [
  { id: "mastery-1", label: "Factoring quadratics", subject: "Mathematics", mastery: 58, confidence: 49, trend: "up", status: "fragile", prerequisiteIds: ["mastery-4"] },
  { id: "mastery-2", label: "Completing the square", subject: "Mathematics", mastery: 43, confidence: 38, trend: "up", status: "at-risk", prerequisiteIds: ["mastery-4"] },
  { id: "mastery-3", label: "Parabola features", subject: "Mathematics", mastery: 61, confidence: 57, trend: "steady", status: "developing", prerequisiteIds: ["mastery-1"] },
  { id: "mastery-4", label: "Active recall discipline", subject: "Study Skills", mastery: 69, confidence: 66, trend: "up", status: "solid" }
];

export const knowledgeTwinSeed: KnowledgeTwinNode[] = [
  { id: "twin-1", label: "Factoring quadratics", cluster: "algebra", mastery: 58, confidence: 49, status: "fragile" },
  { id: "twin-2", label: "Completing the square", cluster: "algebra", mastery: 43, confidence: 38, status: "at-risk" },
  { id: "twin-3", label: "Parabola features", cluster: "visualization", mastery: 61, confidence: 57, status: "developing" },
  { id: "twin-4", label: "Confidence calibration", cluster: "metacognition", mastery: 54, confidence: 45, status: "fragile" }
];

export const remindersSeed: Reminder[] = [
  { id: "reminder-1", kind: "session-start", channel: "push", text: "Warm start begins in 30 minutes.", scheduledFor: new Date().toISOString(), status: "scheduled" },
  { id: "reminder-2", kind: "streak-recovery", channel: "email", text: "Protect your revision streak with one 10-minute recall loop.", scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), status: "scheduled" }
];

export const revisionSeed: RevisionData = {
  streakDays: 6,
  queue: [
    { id: "review-1", title: "Quadratic method chooser", dueLabel: "Tonight", cards: 12 },
    { id: "review-2", title: "Graph feature recall", dueLabel: "Tomorrow", cards: 8 }
  ],
  flashcards: flashcardsSeed
};

export const riskSeed: RiskDashboard = {
  signals: [
    {
      id: "risk-1",
      level: "moderate",
      title: "Confidence dip before practice",
      message: "The student delays practice when the first example feels messy.",
      nextAction: "Use a 5-minute starter question before the deep-work block.",
      category: "confidence"
    }
  ],
  interventions: [
    {
      id: "intervention-1",
      title: "Confidence-safe restart plan",
      ownerRole: "counselor",
      summary: "Start with a five-minute warm-up, then resume the main sprint only after one correct setup.",
      status: "active",
      nextCheckInLabel: "Tomorrow"
    }
  ],
  wellbeingNote: "Supportive nudges are enabled. No punitive alerts will be sent."
};

export const calendarSourcesSeed: CalendarSource[] = [
  { id: "calendar-1", label: "Google Calendar", provider: "google", type: "personal", status: "connected", lastSyncedAt: new Date().toISOString() },
  { id: "calendar-2", label: "School Timetable", provider: "school", type: "school", status: "connected", lastSyncedAt: new Date().toISOString() }
];

export const calendarConflictsSeed: CalendarConflict[] = [
  { id: "conflict-1", title: "Work shift overlaps core sprint", description: "Thursday work hours overlap the planned 90-minute exam block.", severity: "moderate", sessionId: "session-2" }
];

export const calendarSeed: CalendarData = {
  sources: calendarSourcesSeed,
  conflicts: calendarConflictsSeed,
  sessions: sessionsSeed,
  tasks: tasksSeed,
  reminders: remindersSeed,
  syncStatus: "2 sources connected"
};

export const dashboardSeed: DashboardData = {
  hero: {
    studentName: profileSeed.displayName,
    readinessScore: 68,
    streakDays: revisionSeed.streakDays,
    focusMission: missionsSeed[0],
    nextSession: sessionsSeed[0]
  },
  stats: [
    { label: "Completed Tasks", value: "1" },
    { label: "Active Tasks", value: "3" },
    { label: "Weekly Capacity", value: "12h" },
    { label: "Risk Signals", value: "1" }
  ],
  focusAreas: missionsSeed[0].focusAreas,
  upcomingSessions: sessionsSeed,
  risks: riskSeed.signals,
  pendingReminders: remindersSeed,
  calendarConflicts: calendarConflictsSeed
};

export const guardianSeed: GuardianDashboard = {
  studentName: profileSeed.displayName,
  consistency: "6 day streak",
  latestRisk: riskSeed.signals[0],
  nextSession: sessionsSeed[0],
  encouragementPrompts: [
    "Celebrate starting on time, not just finishing perfectly.",
    "Ask what felt easier this week, not only what is still weak."
  ],
  visibility: "summary",
  approvals: ["Weekly readiness snapshot shared", "Guardian digest enabled"]
};

export const teacherSeed: TeacherDashboard = {
  classHeatmap: [
    { label: "Factoring quadratics", mastery: 58, risk: 3 },
    { label: "Completing the square", mastery: 43, risk: 5 },
    { label: "Graph interpretation", mastery: 61, risk: 2 }
  ],
  interventions: [
    "Assign a worked-example pair before the next timed set.",
    "Push one oral-recall checkpoint after the first independent question."
  ],
  assignments: [
    { id: "assignment-1", title: "Worked-example pair", target: "Algebra small group", dueLabel: "Thursday", status: "active" }
  ]
};

export const careerSeed: CareerPlan = {
  headline: "Applied Math + Data Pathway",
  milestones: [
    { id: "career-1", title: "Scholarship shortlist", dueLabel: "In 2 weeks", status: "active" },
    { id: "career-2", title: "Portfolio math project", dueLabel: "This month", status: "planned" }
  ],
  aiReadiness: [
    "Use citation mode when summarizing sources.",
    "Keep answer-only mode off for teacher-restricted assignments.",
    "Document how AI support changed your revision plan."
  ],
  portfolio: ["Quadratic visualizer mini-project", "STEM tutoring volunteer hours"]
};

export const practiceWorkspaceSeed: PracticeWorkspace = {
  sets: practiceSeed,
  recentAttempts: [...attemptsSeed],
  mistakePatterns: mistakePatternsSeed
};

export const masteryWorkspaceSeed: MasteryWorkspace = {
  masteryNodes: masterySeed,
  knowledgeTwin: knowledgeTwinSeed,
  mistakePatterns: mistakePatternsSeed
};

export const interventionsSeed: InterventionPlan[] = riskSeed.interventions;

export const adminDashboardSeed: AdminDashboard = {
  activeMissions: 1,
  roleTypes: 5,
  supportDashboards: 4,
  pwaReady: true,
  plannedModules: [
    "Curriculum templates and exam-board mappings",
    "Class imports and roster sync",
    "Institution analytics and intervention reporting",
    "Billing tiers and school license packaging"
  ]
};
