import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useSearchParams } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DoctorProvider } from "@/contexts/DoctorContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import "@/i18n";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import About from "./pages/About";
import Services from "./pages/Services";
import Clinics from "./pages/Clinics";
import Contact from "./pages/Contact";
import Book from "./pages/Book";
import MyAppointments from "./pages/MyAppointments";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminClinics from "./pages/admin/Clinics";
import AdminSchedules from "./pages/admin/Schedules";
import AdminAppointments from "./pages/admin/Appointments";
import AdminConsultations from "./pages/admin/Consultations";
import AdminSettings from "./pages/admin/Settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: 0,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: "always",
    },
  },
});

// Handle 404.html redirect for SPA on static hosting
function RedirectHandler() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const redirect = searchParams.get("redirect");
    if (redirect) {
      navigate(decodeURIComponent(redirect), { replace: true });
    }
  }, [searchParams, navigate]);
  
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <BrowserRouter>
        <DoctorProvider>
          <ThemeProvider>
            <AuthProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <RedirectHandler />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/clinics" element={<Clinics />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/book" element={<Book />} />
                  <Route path="/my-appointments" element={<MyAppointments />} />
                  
                  {/* Admin Routes */}
                  <Route path="/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/clinics" element={<AdminClinics />} />
                  <Route path="/admin/schedules" element={<AdminSchedules />} />
                  <Route path="/admin/appointments" element={<AdminAppointments />} />
                  <Route path="/admin/consultations" element={<AdminConsultations />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                  
                <Route path="*" element={<NotFound />} />
                </Routes>
              </TooltipProvider>
            </AuthProvider>
          </ThemeProvider>
        </DoctorProvider>
      </BrowserRouter>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
