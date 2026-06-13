export const TOUR_PENDING_KEY = "chronoshare-tour-pending";

export function isTourPending(): boolean {
  return sessionStorage.getItem(TOUR_PENDING_KEY) === "1";
}

export function setTourPending(): void {
  sessionStorage.setItem(TOUR_PENDING_KEY, "1");
}

export function clearTourPending(): void {
  sessionStorage.removeItem(TOUR_PENDING_KEY);
}

export function getAppHomePath(onboardingCompleted: boolean): string {
  return onboardingCompleted ? "/dashboard" : "/onboarding";
}
