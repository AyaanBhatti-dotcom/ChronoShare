export type ListingScope = "nearby" | "worldwide";

const STORAGE_KEY = "chronoshare-listing-scope";

export function getStoredListingScope(): ListingScope {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY);
    if (value === "worldwide" || value === "nearby") return value;
  } catch {
    // sessionStorage unavailable
  }
  return "nearby";
}

export function storeListingScope(scope: ListingScope): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, scope);
  } catch {
    // sessionStorage unavailable
  }
}
