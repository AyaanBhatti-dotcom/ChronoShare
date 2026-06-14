import type { Post } from "../types/database";

export type PostExchangeStatus = "pending" | "completed" | "cancelled";

export interface PostExchangeInfo {
  postId: string;
  status: PostExchangeStatus;
}

export type ListingStatusKind = "open" | "pending" | "done" | "closed" | "archived";

export interface ListingDisplayStatus {
  kind: ListingStatusKind;
  label: string;
  hint: string;
}

export function getListingDisplayStatus(
  post: Pick<Post, "status">,
  exchange: PostExchangeInfo | undefined,
): ListingDisplayStatus {
  if (exchange?.status === "pending") {
    return {
      kind: "pending",
      label: "Pending",
      hint: "Someone joined — confirm the exchange in your profile",
    };
  }

  if (exchange?.status === "completed") {
    return {
      kind: "done",
      label: "Done",
      hint: "This exchange was completed",
    };
  }

  if (post.status === "archived") {
    return {
      kind: "archived",
      label: "Archived",
      hint: "This listing is archived",
    };
  }

  if (post.status === "closed") {
    return {
      kind: "closed",
      label: "Closed",
      hint: "You closed this listing — reopen it to accept joins again",
    };
  }

  return {
    kind: "open",
    label: "Open",
    hint: "Live on the job board — waiting for someone to join",
  };
}

export function getListingStatusBadgeClass(kind: ListingStatusKind): string {
  switch (kind) {
    case "open":
      return "dash-badge-earn";
    case "pending":
      return "dash-badge-pending";
    case "done":
      return "dash-badge-done";
    case "closed":
    case "archived":
      return "dash-badge-neutral";
  }
}

export function canEditListing(
  post: Pick<Post, "status">,
  exchange: PostExchangeInfo | undefined,
): boolean {
  if (exchange?.status === "pending" || exchange?.status === "completed") {
    return false;
  }
  return post.status === "active" || post.status === "closed";
}
