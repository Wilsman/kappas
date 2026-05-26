export type AnnouncementTone = "info" | "success" | "warning";

export interface AppAnnouncement {
  id: string;
  title: string;
  body: string;
  tone: AnnouncementTone;
  active: boolean;
  titleClassName?: string;
  href?: string;
  actionLabel?: string;
}

export const APP_ANNOUNCEMENTS: AppAnnouncement[] = [
  {
    id: "collector-items-live-game-removals-2026-05-26",
    title: "Collector items updated",
    body: "The live game removed Golden rooster, DevilDog mayo, Kotton beanie, Old firesteel, and Can of sprats from Collector. The tracker has been updated ahead of the tarkov.dev API.",
    tone: "warning",
    titleClassName: "text-sky-700 dark:text-sky-300",
    active: true,
    href: "/Items/CollectorItems",
    actionLabel: "View Collector items",
  },
  {
    id: "prestige-requirements-easier-v2",
    title: "Prestige requirements updated",
    body: "Prestige requirements have been refreshed and are now much easier across the board. Previously completed prestige progress has been preserved where possible.",
    tone: "success",
    active: true,
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
