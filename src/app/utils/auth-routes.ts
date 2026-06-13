import type { Session } from "../context/AuthContext";

/** Where authenticated users should land (dashboard or finish signup). */
export function getAuthenticatedHomePath(user: Session): string {
  return user.profileSetupCompleted ? "/dashboard" : "/signup";
}
