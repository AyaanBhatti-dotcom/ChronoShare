export type ListingScope = "nearby" | "worldwide";
export type ListingScopeContext = "home" | "board";

const STORAGE_KEYS: Record<ListingScopeContext, string> = {
  home: "chronoshare-listing-scope-home",
  board: "chronoshare-listing-scope-board",
};

const DEFAULT_SCOPE: Record<ListingScopeContext, ListingScope> = {
  home: "nearby",
  board: "worldwide",
};

export function getStoredListingScope(context: ListingScopeContext = "home"): ListingScope {
  try {
    const value = sessionStorage.getItem(STORAGE_KEYS[context]);
    if (value === "worldwide" || value === "nearby") return value;
    // Migrate legacy shared key
    const legacy = sessionStorage.getItem("chronoshare-listing-scope");
    if (legacy === "worldwide" || legacy === "nearby") return legacy;
  } catch {
    // sessionStorage unavailable
  }
  return DEFAULT_SCOPE[context];
}

export function storeListingScope(scope: ListingScope, context: ListingScopeContext = "home"): void {
  try {
    sessionStorage.setItem(STORAGE_KEYS[context], scope);
  } catch {
    // sessionStorage unavailable
  }
}
