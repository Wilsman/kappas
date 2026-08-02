import { describe, expect, it } from "vitest";
import {
  APP_ANNOUNCEMENTS,
  getVisibleAnnouncements,
  type AppAnnouncement,
} from "@/data/announcements";

const announcements: AppAnnouncement[] = [
  {
    id: "active-a",
    title: "Active A",
    body: "Visible announcement",
    tone: "info",
    active: true,
  },
  {
    id: "inactive-a",
    title: "Inactive A",
    body: "Hidden announcement",
    tone: "warning",
    active: false,
  },
  {
    id: "active-b",
    title: "Active B",
    body: "Second visible announcement",
    tone: "success",
    active: true,
  },
];

describe("announcement filtering", () => {
  it("warns players that the August 4 update may temporarily stale game data", () => {
    expect(APP_ANNOUNCEMENTS).toContainEqual(
      expect.objectContaining({
        id: "major-game-update-2026-08-04",
        title: "Major update on August 4",
        tone: "warning",
        active: true,
      }),
    );
  });

  it("returns only active announcements that have not been dismissed", () => {
    expect(getVisibleAnnouncements(announcements, ["active-a"])).toEqual([
      announcements[2],
    ]);
  });
});
