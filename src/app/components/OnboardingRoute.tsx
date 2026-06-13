import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";

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

/** Logged-in users always land on the dashboard. Onboarding runs as an in-app tour. */
export function AuthenticatedRedirect() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <AuthLoading />;
  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to="/dashboard" replace />;
}
