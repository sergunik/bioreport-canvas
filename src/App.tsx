import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// i18n
import "@/i18n";

// Context
import { AuthProvider } from "@/contexts/AuthContext";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AccountSetup from "./pages/AccountSetup";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import { ProfileSettings, SecuritySettings, DangerZone } from "./pages/settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            
            {/* Post-registration */}
            <Route path="/account-setup" element={<AccountSetup />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Settings routes */}
            <Route path="/settings" element={<Settings />}>
              <Route index element={<Navigate to="/settings/profile" replace />} />
              <Route path="profile" element={<ProfileSettings />} />
              <Route path="security" element={<SecuritySettings />} />
              <Route path="danger" element={<DangerZone />} />
            </Route>
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
