import { MapPin, Monitor, Shuffle } from "lucide-react";

export type ExchangeFormatPreference = "in_person" | "remote" | "flexible";
export type ExchangeFormatResolved = "in_person" | "remote";

export const EXCHANGE_FORMAT_OPTIONS = [
  {
    id: "in_person" as const,
    label: "In person",
    description: "Meet locally — at a home, café, or agreed spot",
    icon: MapPin,
  },
  {
    id: "remote" as const,
    label: "Remote",
    description: "Video call, phone, or online collaboration",
    icon: Monitor,
  },
  {
    id: "flexible" as const,
    label: "Either works",
    description: "Whoever joins can choose in person or remote",
    icon: Shuffle,
  },
];

export const JOIN_FORMAT_OPTIONS = EXCHANGE_FORMAT_OPTIONS.filter(
  (o) => o.id !== "flexible",
);

export function formatExchangeFormat(
  format: ExchangeFormatPreference | ExchangeFormatResolved | null | undefined,
): string {
  if (format === "in_person") return "In person";
  if (format === "remote") return "Remote";
  if (format === "flexible") return "Either works";
  return "Not specified";
}

export function isFlexibleFormat(
  format: ExchangeFormatPreference | ExchangeFormatResolved | null | undefined,
): format is "flexible" {
  return format === "flexible";
}
