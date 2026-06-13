const ROCKYOU_URL = "/data/rockyou.txt";

export const INSECURE_PASSWORD_MESSAGE =
  "This password is insecure and should not be used.";

let rockyouSet: Set<string> | null = null;
let loadPromise: Promise<Set<string>> | null = null;
let loadError: string | null = null;

export async function loadRockyouSet(): Promise<Set<string>> {
  if (rockyouSet) return rockyouSet;
  if (loadError) throw new Error(loadError);

  if (!loadPromise) {
    loadPromise = fetch(ROCKYOU_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not load password blocklist.");
        }
        return response.text();
      })
      .then((text) => {
        const set = new Set<string>();
        for (const line of text.split(/\r?\n/)) {
          const password = line.trim().toLowerCase();
          if (password) set.add(password);
        }
        rockyouSet = set;
        return set;
      })
      .catch((err) => {
        loadError = err instanceof Error ? err.message : "Could not load password blocklist.";
        loadPromise = null;
        throw err;
      });
  }

  return loadPromise;
}

export async function isPasswordInRockyou(password: string): Promise<boolean> {
  const normalized = password.trim().toLowerCase();
  if (!normalized) return false;

  const set = await loadRockyouSet();
  return set.has(normalized);
}

export async function validatePasswordNotLeaked(password: string): Promise<string | null> {
  if (!(await isPasswordInRockyou(password))) return null;
  return INSECURE_PASSWORD_MESSAGE;
}

/** Call on signup/password screens so the first check is instant. */
export function preloadRockyouSet(): void {
  void loadRockyouSet().catch(() => {
    // UI surfaces errors on validate if preload fails.
  });
}
