export type StudyRole = "student" | "guardian" | "teacher" | "counselor" | "admin";

export type DifficultyLevel = "easy" | "medium" | "hard" | "adaptive";
export type RiskLevel = "low" | "moderate" | "high";
export type CalendarSourceStatus = "connected" | "needs-auth" | "error";
export type CalendarSourceProvider = "google" | "outlook" | "school" | "manual";
export type UploadKind = "pdf" | "image" | "audio" | "link";
export type UploadStatus = "queued" | "processed" | "error";
export type SessionStatus = "planned" | "active" | "completed" | "missed";
export type TaskStatus = "planned" | "active" | "completed" | "missed";
export type AttemptStatus = "scored" | "draft";
export type AssignmentMode = "guided" | "restricted" | "free-practice";

export interface AuthSession {
  status: "authenticated";
  userId: string;
  role: StudyRole;
  availableRoles: StudyRole[];
  onboardingCompleted: boolean;
}

export interface RoleClaim {
  id: string;
  role: StudyRole;
  scope: "student" | "classroom" | "institution" | "global";
  scopeId: string | null;
  status: "active" | "pending";
}

export interface ConsentPolicy {
  guardianVisibility: "summary" | "full";
  teacherAccess: "classroom";
  counselorEscalationEnabled: boolean;
  shareWellbeingSignals: boolean;
  shareAcademicRiskSignals: boolean;
  lastUpdated: string;
}

export interface StudentProfile {
  id: string;
  displayName: string;
  role: StudyRole;
  onboardingCompleted: boolean;
  gradeLevel: string;
  curriculumTrack: string;
  examBoard: string;
  timezone: string;
  weeklyStudyHours: number;
  workSchedule: string[];
  subjects: string[];
  energyPattern: string;
  learningPreferences: string[];
  targetScore: string;
  institutionId?: string | null;
  classroomIds?: string[];
  primaryLanguage?: string;
  accessibility: {
    dyslexiaMode: boolean;
    adhdMode: boolean;
    reducedMotion: boolean;
    textToSpeech: boolean;
    screenReaderOptimized?: boolean;
  };
  notificationPreferences: {
    push: boolean;
    email: boolean;
    whatsapp: boolean;
  };
  aiReadinessMode: string;
}

export interface DashboardHeroMission {
  id: string;
  title: string;
  prompt: string;
  status: string;
  focusAreas: string[];
  readinessScore: number;
}

export interface CalendarSource {
  id: string;
  label: string;
  provider: CalendarSourceProvider;
  type: "personal" | "school" | "work";
  status: CalendarSourceStatus;
  lastSyncedAt: string;
}

export interface CalendarConflict {
  id: string;
  title: string;
  description: string;
  severity: RiskLevel;
  sessionId: string | null;
}

export interface Reminder {
  id: string;
  kind: "session-start" | "streak-recovery" | "guardian-digest" | "teacher-intervention";
  channel: "push" | "email" | "whatsapp";
  text: string;
  scheduledFor: string;
  status: "scheduled" | "sent";
}

export interface StudySession {
  id: string;
  title: string;
  subject: string;
  startLabel: string;
  durationMin: number;
  mode: string;
  energyFit: string;
  status: SessionStatus;
  missionId?: string | null;
  startAt?: string;
  confidenceAfter?: number | null;
  reflection?: string | null;
}

export interface DashboardData {
  hero: {
    studentName: string;
    readinessScore: number;
    streakDays: number;
    focusMission: DashboardHeroMission | null;
    nextSession: StudySession | null;
  };
  stats: { label: string; value: string }[];
  focusAreas: string[];
  upcomingSessions: StudySession[];
  risks: StudyRiskSignal[];
  pendingReminders?: Reminder[];
  calendarConflicts?: CalendarConflict[];
}

export interface StudyGoal {
  id: string;
  title: string;
  subject: string;
  deadlineLabel: string;
  targetScore: string;
  progress: number;
  type?: "semester" | "exam" | "weekly" | "habit" | "career";
}

export interface StudyMission {
  id: string;
  title: string;
  prompt: string;
  status: string;
  focusAreas: string[];
  readinessScore: number;
  createdAt: string;
  updatedAt?: string;
  subject?: string;
  eventCount?: number;
}

export interface StudyTask {
  id: string;
  title: string;
  subject: string;
  type: string;
  durationMin: number;
  dueLabel: string;
  status: TaskStatus;
  confidence: string;
  missionId?: string | null;
  priorityScore?: number;
  difficultyScore?: number;
}

export interface StudyResource {
  id: string;
  title: string;
  type: string;
  subject: string;
  durationMin: number;
  description: string;
  uploadId?: string | null;
}

export interface StudyNote {
  id: string;
  title: string;
  subject: string;
  preview: string;
  updatedLabel: string;
  body?: string;
  flashcardCount?: number;
  summary?: string;
}

export interface UploadAsset {
  id: string;
  kind: UploadKind;
  title: string;
  subject: string;
  status: UploadStatus;
  extractedSummary: string;
  createdAt: string;
}

export interface PracticeSet {
  id: string;
  title: string;
  subject: string;
  difficulty: DifficultyLevel;
  mode: string;
  prompt: string;
  hints: string[];
  expectedKeywords?: string[];
}

export interface PracticeAttempt {
  id: string;
  setId: string;
  setTitle: string;
  subject: string;
  answer: string;
  score: number;
  confidenceBefore: number;
  confidenceAfter: number;
  firstError: string;
  createdAt: string;
  status: AttemptStatus;
}

export interface PracticeWorkspace {
  sets: PracticeSet[];
  recentAttempts: PracticeAttempt[];
  mistakePatterns: MistakePattern[];
}

export interface MasteryNode {
  id: string;
  label: string;
  subject: string;
  mastery: number;
  confidence: number;
  trend: "up" | "steady" | "down";
  status: "solid" | "developing" | "fragile" | "at-risk";
  prerequisiteIds?: string[];
}

export interface KnowledgeTwinNode {
  id: string;
  label: string;
  cluster: string;
  mastery: number;
  confidence: number;
  status: "solid" | "developing" | "fragile" | "at-risk";
}

export interface MistakePattern {
  id: string;
  label: string;
  description: string;
  frequency: number;
  severity: RiskLevel;
  subject: string;
}

export interface Flashcard {
  id: string;
  subject: string;
  deck: string;
  front: string;
  back: string;
  dueLabel: string;
  mastery: number;
}

export interface RevisionQueueItem {
  id: string;
  title: string;
  dueLabel: string;
  cards: number;
}

export interface RevisionData {
  streakDays: number;
  queue: RevisionQueueItem[];
  flashcards: Flashcard[];
}

export interface StudyRiskSignal {
  id: string;
  level: RiskLevel;
  title: string;
  message: string;
  nextAction: string;
  category?: "confidence" | "attendance" | "wellbeing" | "revision";
}

export interface InterventionPlan {
  id: string;
  title: string;
  ownerRole: Extract<StudyRole, "teacher" | "guardian" | "counselor" | "admin">;
  summary: string;
  status: "active" | "completed";
  nextCheckInLabel: string;
}

export interface GuardianDashboard {
  studentName: string;
  consistency: string;
  latestRisk: StudyRiskSignal;
  nextSession: StudySession;
  encouragementPrompts: string[];
  visibility: string;
  approvals: string[];
}

export interface TeacherAssignment {
  id: string;
  title: string;
  target: string;
  dueLabel: string;
  status: "active" | "completed";
}

export interface TeacherDashboard {
  classHeatmap: { label: string; mastery: number; risk: number }[];
  interventions: string[];
  assignments: TeacherAssignment[];
}

export interface RiskDashboard {
  signals: StudyRiskSignal[];
  interventions: InterventionPlan[];
  wellbeingNote: string;
}

export interface CareerMilestone {
  id: string;
  title: string;
  dueLabel: string;
  status: "active" | "planned" | "completed";
}

export interface CareerPlan {
  headline: string;
  milestones: CareerMilestone[];
  aiReadiness: string[];
  portfolio: string[];
}

export interface PolicyRule {
  id: string;
  title: string;
  scope: "student" | "classroom" | "institution";
  mode: "guardrail" | "citation";
  status: "active" | "inactive";
}

export interface AdminDashboard {
  activeMissions: number;
  roleTypes: number;
  supportDashboards: number;
  pwaReady: boolean;
  plannedModules: string[];
}

export interface CalendarData {
  sources: CalendarSource[];
  conflicts: CalendarConflict[];
  sessions: StudySession[];
  tasks: StudyTask[];
  reminders: Reminder[];
  syncStatus: string;
}

export interface MasteryWorkspace {
  masteryNodes: MasteryNode[];
  knowledgeTwin: KnowledgeTwinNode[];
  mistakePatterns: MistakePattern[];
}

export interface MissionDetail {
  mission: StudyMission;
  tasks: StudyTask[];
  sessions: StudySession[];
  activity: { id: string; type: string; summary: string; timestamp: string }[];
}
