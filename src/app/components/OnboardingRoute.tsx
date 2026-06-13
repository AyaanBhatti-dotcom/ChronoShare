import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { getAppHomePath, isTourPending } from "../utils/onboarding";

function AuthLoading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#0B0F19" }}
    >
      <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
    </div>
  );
}

export function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <AuthLoading />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.onboardingCompleted) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

export function DashboardRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <AuthLoading />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.onboardingCompleted && !isTourPending()) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

export function AuthenticatedRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <AuthLoading />;
  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={getAppHomePath(user.onboardingCompleted)} replace />;
}
