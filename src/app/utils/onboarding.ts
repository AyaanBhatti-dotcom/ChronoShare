const ONBOARDING_DONE_KEY = "chronoshare-onboarding-done";

export function markOnboardingDoneLocal(userId: string): void {
  localStorage.setItem(ONBOARDING_DONE_KEY, userId);
}

export function isOnboardingDoneLocal(userId: string): boolean {
  return localStorage.getItem(ONBOARDING_DONE_KEY) === userId;
}

export function clearOnboardingDoneLocal(): void {
  localStorage.removeItem(ONBOARDING_DONE_KEY);
}
