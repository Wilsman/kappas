export type AnnouncementTone = "info" | "success" | "warning";

export interface AppAnnouncement {
  id: string;
  title: string;
  body: string;
  tone: AnnouncementTone;
  active: boolean;
  href?: string;
  actionLabel?: string;
}

export const APP_ANNOUNCEMENTS: AppAnnouncement[] = [
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
