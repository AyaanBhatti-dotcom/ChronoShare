import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#0B0F19" }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.profileSetupCompleted) {
    return <Navigate to="/signup" replace />;
  }

  return <>{children}</>;
}
