import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StudyShell } from "@/components/study/StudyShell";
import { studyApi } from "@/lib/study-api";
import MissionControl from "./pages/MissionControl.tsx";
import NotFound from "./pages/NotFound.tsx";
import {
  AdminPage,
  CalendarPage,
  CounselorPage,
  GuardianPage,
  KnowledgeTwinPage,
  LearnPage,
  MathLabPage,
  NotesPage,
  OnboardingPage,
  PlannerPage,
  PracticePage,
  ResourcesPage,
  RevisionPage,
  SettingsPage,
  TeacherPage,
  TodayPage,
  WarRoomPage,
} from "./pages/study/StudyScreens.tsx";

const queryClient = new QueryClient();

function EntryRedirect() {
  const { data, isLoading } = useQuery({
    queryKey: ["auth-session"],
    queryFn: () => studyApi.getAuthSession()
  });

  if (isLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  return <Navigate to={data?.onboardingCompleted ? "/today" : "/onboarding"} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<EntryRedirect />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route element={<StudyShell />}>
            <Route path="/today" element={<TodayPage />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/practice" element={<PracticePage />} />
            <Route path="/revision" element={<RevisionPage />} />
            <Route path="/math-lab" element={<MathLabPage />} />
            <Route path="/war-room" element={<WarRoomPage />} />
            <Route path="/knowledge-twin" element={<KnowledgeTwinPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/guardian" element={<GuardianPage />} />
            <Route path="/teacher" element={<TeacherPage />} />
            <Route path="/counselor" element={<CounselorPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
          <Route path="/mission-control" element={<MissionControl />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
