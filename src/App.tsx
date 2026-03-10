import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import PlanPage from "./pages/PlanPage";
import AIAgentPage from "./pages/AIAgentPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import FollowUpPage from "./pages/FollowUpPage";
import ActivationPage from "./pages/ActivationPage";
import RemindersPage from "./pages/RemindersPage";
import AgendaPage from "./pages/AgendaPage";
import WhatsAppPage from "./pages/WhatsAppPage";
import KanbanPage from "./pages/KanbanPage";
import InsightsPage from "./pages/InsightsPage";
import SettingsPage from "./pages/SettingsPage";
import SupportPage from "./pages/SupportPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isOnboarded } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!isOnboarded) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/app" replace /> : <LoginPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/app" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="perfil" element={<ProfilePage />} />
        <Route path="plano" element={<PlanPage />} />
        <Route path="atendente-ia" element={<AIAgentPage />} />
        <Route path="agendamentos" element={<AppointmentsPage />} />
        <Route path="followup" element={<FollowUpPage />} />
        <Route path="ativacao" element={<ActivationPage />} />
        <Route path="lembretes" element={<RemindersPage />} />
        <Route path="agenda" element={<AgendaPage />} />
        <Route path="whatsapp" element={<WhatsAppPage />} />
        <Route path="kanban" element={<KanbanPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="configuracoes" element={<SettingsPage />} />
        <Route path="suporte" element={<SupportPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
