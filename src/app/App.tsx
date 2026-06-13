import { Routes, Route, Navigate } from "react-router";
import { LandingPage } from "./components/LandingPage";
import { Login } from "./components/auth/Login";
import { Signup } from "./components/auth/Signup";
import { ForgotPassword } from "./components/auth/ForgotPassword";
import { ResetPassword } from "./components/auth/ResetPassword";
import { DashboardLayout } from "./components/DashboardLayout";
import { OnboardingFlow } from "./components/onboarding/OnboardingFlow";
import { OnboardingRoute, DashboardRoute } from "./components/OnboardingRoute";
import { PublicRoute } from "./components/PublicRoute";
import { AdminPage } from "./components/admin/AdminPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <Signup />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/onboarding"
        element={
          <OnboardingRoute>
            <OnboardingFlow />
          </OnboardingRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <DashboardRoute>
            <DashboardLayout />
          </DashboardRoute>
        }
      />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
