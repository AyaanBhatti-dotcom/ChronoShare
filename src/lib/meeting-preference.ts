import { Building2, Monitor, Shuffle } from "lucide-react";
import i18n from "../i18n";

export type MeetingPreference = "public_venue" | "remote_only" | "flexible";

export const MEETING_PREFERENCE_OPTIONS = [
  {
    id: "public_venue" as const,
    label: "Public meetup",
    description: "Library, café, park, or community space — not a private home",
    icon: Building2,
    badge: "Safest",
  },
  {
    id: "remote_only" as const,
    label: "Remote only",
    description: "Video call, phone, or online — no in-person meeting",
    icon: Monitor,
    badge: "Safest",
  },
  {
    id: "flexible" as const,
    label: "Either works",
    description: "Public meetup preferred; remote is fine too",
    icon: Shuffle,
  },
];

export function formatMeetingPreference(
  preference: MeetingPreference | null | undefined,
): string {
  if (preference === "public_venue") return i18n.t("meetingPreference.publicVenue");
  if (preference === "remote_only") return i18n.t("meetingPreference.remoteOnly");
  if (preference === "flexible") return i18n.t("meetingPreference.flexible");
  return i18n.t("meetingPreference.notSpecified");
}

export function defaultMeetingPreferenceForFormat(
  exchangeFormat: "in_person" | "remote" | "flexible",
): MeetingPreference {
  if (exchangeFormat === "remote") return "remote_only";
  if (exchangeFormat === "flexible") return "flexible";
  return "public_venue";
}

/** Only "Either works" needs a follow-up — in-person is always public; remote skips this entirely. */
export function shouldShowMeetingPreferenceSelector(
  exchangeFormat: "in_person" | "remote" | "flexible",
): boolean {
  return exchangeFormat === "flexible";
}

export function isPublicVenuePreferred(preference: MeetingPreference | null | undefined): boolean {
  return preference === "public_venue" || preference === "flexible";
}
