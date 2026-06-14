import type { ListingScope } from "../../lib/listing-scope";
import type { BoardTab } from "./JobBoard";

export type DashboardNavigateOptions = {
  postType?: "needs" | "offers";
  boardMode?: "all" | "needs" | "offers";
  boardTab?: BoardTab;
  postId?: string;
  listingScope?: ListingScope;
};
