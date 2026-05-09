import { describe, expect, it } from "vitest";
import { getVisibleAnnouncements, type AppAnnouncement } from "@/data/announcements";

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
  it("returns only active announcements that have not been dismissed", () => {
    expect(getVisibleAnnouncements(announcements, ["active-a"])).toEqual([
      announcements[2],
    ]);
  });
});
