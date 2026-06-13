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

/** Signup onboarding — accessible until profile setup is complete. */
export function SignupRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <AuthLoading />;
  if (user?.profileSetupCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
