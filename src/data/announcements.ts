export type AnnouncementTone = "info" | "success" | "warning";

export interface AppAnnouncement {
  id: string;
  title: string;
  body: string;
  tone: AnnouncementTone;
  active: boolean;
  dismissible?: boolean;
  titleClassName?: string;
  href?: string;
  actionLabel?: string;
}

export const APP_ANNOUNCEMENTS: AppAnnouncement[] = [
  {
    id: "major-game-update-2026-08-04",
    title: "EFT Patch 1.1.0.0 [Kord Breach] update on August 3rd",
    body: "Some quests and game data may be temporarily out of date while Tarkov.dev and the community wiki catch up.",
    tone: "warning",
    titleClassName: "text-amber-400",
    active: true,
  },
  {
    id: "tarkov-dev-api-outage-2026-06-28",
    title: "Tarkov.dev API outage",
    body: "tarkov.dev's API is currently returning Cloudflare 1102/503 errors. Some quest, achievement, and hideout data may be empty until their API recovers. If we have a cached copy, the app will keep using it.",
    tone: "warning",
    titleClassName: "text-red-200 dark:text-red-100",
    active: false,
  },
];

export function getVisibleAnnouncements(
  announcements: AppAnnouncement[],
  dismissedAnnouncementIds: string[],
): AppAnnouncement[] {
  const dismissed = new Set(dismissedAnnouncementIds);
  return announcements.filter(
    (announcement) => announcement.active && !dismissed.has(announcement.id),
  );
}
