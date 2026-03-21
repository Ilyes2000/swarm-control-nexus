function inferUrgencyDays(missionText) {
  const match = missionText.match(/(\d+)\s*(day|days|week|weeks)/i);
  if (!match) {
    return 5;
  }

  const value = Number(match[1]);
  if (Number.isNaN(value)) {
    return 5;
  }

  return /week/i.test(match[2]) ? value * 7 : value;
}

function average(values, fallback = 0) {
  if (!Array.isArray(values) || values.length === 0) {
    return fallback;
  }
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function createTopicPreset(normalized) {
  return (
    [
      {
        matcher: /(algebra|quadratic|equation|polynomial)/,
        subject: "Mathematics",
        missionTitle: "Algebra Recovery Sprint",
        topic: "Quadratic Algebra",
        focusAreas: ["Factoring quadratics", "Completing the square", "Graph interpretation"],
        knowledgeTwin: [
          { id: "node-linear", label: "Linear forms", cluster: "foundations", mastery: 86, confidence: 82, status: "solid" },
          { id: "node-factor", label: "Factoring", cluster: "algebra", mastery: 58, confidence: 49, status: "fragile" },
          { id: "node-square", label: "Completing the square", cluster: "algebra", mastery: 43, confidence: 38, status: "at-risk" },
          { id: "node-graph", label: "Parabola features", cluster: "visualization", mastery: 61, confidence: 57, status: "developing" }
        ],
        proofTrack: "Show why each transformation preserves equality before solving.",
        sampleProblem: "Solve x^2 - 5x + 6 = 0 and explain why factoring is the fastest method."
      },
      {
        matcher: /(calculus|derivative|integral|limit)/,
        subject: "Mathematics",
        missionTitle: "Calculus Exam Rescue",
        topic: "Single Variable Calculus",
        focusAreas: ["Derivative rules", "Curve sketching", "Area under curves"],
        knowledgeTwin: [
          { id: "node-rules", label: "Derivative rules", cluster: "calculus", mastery: 63, confidence: 54, status: "developing" },
          { id: "node-chain", label: "Chain rule", cluster: "calculus", mastery: 47, confidence: 42, status: "at-risk" },
          { id: "node-area", label: "Definite integrals", cluster: "calculus", mastery: 55, confidence: 48, status: "fragile" },
          { id: "node-sketch", label: "Function behavior", cluster: "visualization", mastery: 69, confidence: 65, status: "solid" }
        ],
        proofTrack: "Connect each derivative sign change to the monotonic behavior of the graph.",
        sampleProblem: "Find the derivative of y = (3x^2 + 1)^4 and identify the chain rule step."
      },
      {
        matcher: /(geometry|proof|triangle|circle)/,
        subject: "Mathematics",
        missionTitle: "Geometry Proof Builder",
        topic: "Euclidean Geometry",
        focusAreas: ["Congruence criteria", "Angle chasing", "Proof writing discipline"],
        knowledgeTwin: [
          { id: "node-angle", label: "Angle relationships", cluster: "geometry", mastery: 72, confidence: 64, status: "solid" },
          { id: "node-congruence", label: "Congruence criteria", cluster: "geometry", mastery: 51, confidence: 47, status: "fragile" },
          { id: "node-proof", label: "Formal proof structure", cluster: "proof", mastery: 39, confidence: 31, status: "at-risk" },
          { id: "node-diagram", label: "Diagram annotation", cluster: "visualization", mastery: 67, confidence: 58, status: "developing" }
        ],
        proofTrack: "State givens, infer intermediate facts, then justify every triangle claim explicitly.",
        sampleProblem: "Prove that two triangles are congruent given one shared side and two equal angles."
      },
      {
        matcher: /(stats|statistics|probability|distribution)/,
        subject: "Mathematics",
        missionTitle: "Statistics Confidence Rebuild",
        topic: "Statistics and Probability",
        focusAreas: ["Distributions", "Conditional probability", "Interpreting variance"],
        knowledgeTwin: [
          { id: "node-mean", label: "Mean/median interpretation", cluster: "statistics", mastery: 74, confidence: 71, status: "solid" },
          { id: "node-prob", label: "Conditional probability", cluster: "probability", mastery: 48, confidence: 41, status: "fragile" },
          { id: "node-dist", label: "Normal distribution", cluster: "statistics", mastery: 53, confidence: 45, status: "developing" },
          { id: "node-variance", label: "Variance and spread", cluster: "statistics", mastery: 44, confidence: 35, status: "at-risk" }
        ],
        proofTrack: "Anchor every probability claim in sample-space language before computing.",
        sampleProblem: "A bag has 3 red and 2 blue balls. What is the probability of drawing 2 red balls without replacement?"
      }
    ].find((preset) => preset.matcher.test(normalized)) ?? {
      subject: "General Study",
      missionTitle: "Focused Study Mission",
      topic: "Mixed Review",
      focusAreas: ["Diagnostics", "Weak-topic recovery", "Revision momentum"],
      knowledgeTwin: [
        { id: "node-plan", label: "Planning reliability", cluster: "execution", mastery: 68, confidence: 62, status: "solid" },
        { id: "node-recall", label: "Active recall", cluster: "revision", mastery: 55, confidence: 48, status: "developing" },
        { id: "node-gap", label: "Weak-topic detection", cluster: "insight", mastery: 46, confidence: 39, status: "fragile" }
      ],
      proofTrack: "Explain every choice in plain language before turning it into a formal answer.",
      sampleProblem: "Review yesterday's hardest question and explain the first step without solving it yet."
    }
  );
}

function deriveContextInsights(context = {}, preset) {
  const profile = context.profile ?? {};
  const masteryNodes = Array.isArray(context.masteryNodes) ? context.masteryNodes : [];
  const attempts = Array.isArray(context.attempts) ? context.attempts : [];
  const calendarConflicts = Array.isArray(context.calendarConflicts) ? context.calendarConflicts : [];
  const goals = Array.isArray(context.goals) ? context.goals : [];
  const riskSignals = Array.isArray(context.riskSignals) ? context.riskSignals : [];

  const subjectMasteryNodes = masteryNodes.filter((node) => node.subject === preset.subject);
  const weakestNodes = (subjectMasteryNodes.length ? subjectMasteryNodes : masteryNodes)
    .slice()
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 3);

  const focusAreas = weakestNodes.length
    ? Array.from(new Set([...weakestNodes.map((node) => node.label), ...preset.focusAreas])).slice(0, 3)
    : preset.focusAreas;

  const knowledgeTwin = weakestNodes.length
    ? weakestNodes.map((node) => ({
        id: node.id,
        label: node.label,
        cluster: node.subject?.toLowerCase() === "mathematics" ? "math-core" : "study-core",
        mastery: node.mastery,
        confidence: node.confidence,
        status: node.status
      }))
    : preset.knowledgeTwin;

  const recentAttempts = attempts.slice(0, 3);
  const confidenceValues = recentAttempts.map((attempt) => attempt.confidenceAfter ?? attempt.confidenceBefore ?? 55);
  const readinessBaseline = Math.max(
    40,
    Math.min(
      92,
      average(
        weakestNodes.length
          ? weakestNodes.map((node) => Math.round((node.mastery + node.confidence) / 2))
          : [preset.knowledgeTwin[0]?.mastery ?? 60],
        60
      )
    )
  );

  const relatedGoals = goals.filter((goal) => goal.subject === preset.subject || goal.subject === "Study Skills").slice(0, 3);
  const activeRisk = riskSignals[0] ?? null;

  return {
    profile,
    weakestNodes,
    focusAreas,
    knowledgeTwin,
    recentAttempts,
    confidenceAverage: average(confidenceValues, 58),
    readinessBaseline,
    calendarConflicts,
    relatedGoals,
    activeRisk,
    workloadHours: profile.weeklyStudyHours ?? 10,
    energyPattern: profile.energyPattern ?? "Peak focus after 7 PM"
  };
}

function chooseSubjectFromPrompt(missionText, contextProfile, preset) {
  const normalized = missionText.toLowerCase();
  const profileSubjects = Array.isArray(contextProfile?.subjects) ? contextProfile.subjects : [];
  const matchingSubject = profileSubjects.find((subject) => normalized.includes(subject.toLowerCase()));
  return matchingSubject ?? preset.subject;
}

function normalizeStatus(mastery, confidence) {
  const combined = Math.round((mastery + confidence) / 2);
  if (combined >= 75) {
    return "solid";
  }
  if (combined >= 60) {
    return "developing";
  }
  if (combined >= 45) {
    return "fragile";
  }
  return "at-risk";
}

export function buildStudyProfile(missionText, context = {}) {
  const normalized = missionText.toLowerCase();
  const preset = createTopicPreset(normalized);
  const urgencyDays = inferUrgencyDays(missionText);
  const rescueMode = /(tomorrow|tonight|urgent|panic|rescue|final|exam)/i.test(normalized) || urgencyDays <= 3;
  const insights = deriveContextInsights(context, preset);
  const subject = chooseSubjectFromPrompt(missionText, insights.profile, preset);

  const knowledgeTwin = insights.knowledgeTwin.map((node) => ({
    ...node,
    status: normalizeStatus(node.mastery, node.confidence)
  }));

  return {
    ...preset,
    subject,
    topic: insights.focusAreas[0] ?? preset.topic,
    focusAreas: insights.focusAreas,
    knowledgeTwin,
    urgencyDays,
    rescueMode,
    missionText,
    sessionMode: rescueMode ? "exam-sprint" : "steady-build",
    readinessBaseline: rescueMode ? Math.max(42, insights.readinessBaseline - 6) : insights.readinessBaseline,
    confidenceAverage: insights.confidenceAverage,
    weakestNodes: insights.weakestNodes,
    relatedGoals: insights.relatedGoals,
    activeRisk: insights.activeRisk,
    workloadHours: insights.workloadHours,
    calendarConflicts: insights.calendarConflicts,
    energyPattern: insights.energyPattern,
    profile: insights.profile,
    recentAttempts: insights.recentAttempts
  };
}

export function createSessionSlots({ urgencyDays, rescueMode, energyPattern, calendarConflicts }) {
  const heavyLabel = /after 7/i.test(String(energyPattern)) ? "Tonight • 7:15 PM" : "Tomorrow • 6:30 PM";
  const recoveryLabel = urgencyDays <= 2 ? "Tomorrow • 8:45 PM" : `Day ${Math.min(urgencyDays, 4)} • 8:10 PM`;
  const hasConflict = Array.isArray(calendarConflicts) && calendarConflicts.length > 0;

  const templates = rescueMode
    ? [
        { label: "Tonight • 6:45 PM", durationMin: 25, energyFit: "warm-up", mode: "starter" },
        { label: heavyLabel, durationMin: hasConflict ? 70 : 90, energyFit: "peak", mode: "exam-sprint" },
        { label: recoveryLabel, durationMin: 20, energyFit: "low", mode: "recall" }
      ]
    : [
        { label: heavyLabel, durationMin: 50, energyFit: "peak", mode: "deep-work" },
        { label: "Tomorrow • 7:30 PM", durationMin: 45, energyFit: "peak", mode: "practice" },
        { label: recoveryLabel, durationMin: 30, energyFit: "low", mode: "revision" }
      ];

  return templates;
}
