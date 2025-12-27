import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Hospitals from "./pages/Hospitals";
import MedicalHistory from "./pages/MedicalHistory";
import SymptomTracker from "./pages/SymptomTracker";
import Medications from "./pages/Medications";
import Appointments from "./pages/Appointments";
import Doctors from "./pages/Doctors";
import HealthResources from "./pages/HealthResources";
import Emergency from "./pages/Emergency";
import CriticalSymptoms from "./pages/CriticalSymptoms";
import AISettings from "./pages/AISettings";
import PrivateAIChat from "./pages/PrivateAIChat";
import NotFound from "./pages/NotFound";

const ProtectedLayout = () => (
  <ProtectedRoute>
    <Layout>
      <Outlet />
    </Layout>
  </ProtectedRoute>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" enableSystem storageKey="ai-medical-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              {/* Public routes */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Protected routes with Layout */}
              <Route element={<ProtectedLayout />}>
                <Route path="/" element={<Index />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/hospitals" element={<Hospitals />} />
                <Route path="/medical-history" element={<MedicalHistory />} />
                <Route path="/symptom-tracker" element={<SymptomTracker />} />
                <Route path="/medications" element={<Medications />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/doctors" element={<Doctors />} />
                <Route path="/resources" element={<HealthResources />} />
                <Route path="/emergency" element={<Emergency />} />
                <Route path="/critical-symptoms" element={<CriticalSymptoms />} />
                <Route path="/ai-settings" element={<AISettings />} />
                <Route path="/ai-chat" element={<PrivateAIChat />} />
              </Route>
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
