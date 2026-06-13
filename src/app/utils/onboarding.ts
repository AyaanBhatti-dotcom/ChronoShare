const ONBOARDING_DONE_KEY = "chronoshare-onboarding-done";
const NEW_SIGNUP_TOUR_KEY = "chronoshare-new-signup-tour";

export function markOnboardingDoneLocal(userId: string): void {
  localStorage.setItem(ONBOARDING_DONE_KEY, userId);
}

export function isOnboardingDoneLocal(userId: string): boolean {
  return localStorage.getItem(ONBOARDING_DONE_KEY) === userId;
}

export function clearOnboardingDoneLocal(): void {
  localStorage.removeItem(ONBOARDING_DONE_KEY);
}

/** Set when a user just signed up — tour auto-starts once, then this is consumed. */
export function setNewSignupTourPending(): void {
  sessionStorage.setItem(NEW_SIGNUP_TOUR_KEY, "1");
}

/** @deprecated Use setNewSignupTourPending — kept for OnboardingFlow compatibility */
export function setTourPending(): void {
  setNewSignupTourPending();
}

/** Returns true only once per signup (cleared immediately so refresh won't re-trigger). */
export function consumeNewSignupTour(): boolean {
  if (sessionStorage.getItem(NEW_SIGNUP_TOUR_KEY) !== "1") return false;
  sessionStorage.removeItem(NEW_SIGNUP_TOUR_KEY);
  return true;
}
