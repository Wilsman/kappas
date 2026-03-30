import { STORYLINE_QUESTS } from "@/data/storylineQuests";

const getQuestByName = (name: string) => {
  const quest = STORYLINE_QUESTS.find((entry) => entry.name === name);

  if (!quest) {
    throw new Error(`Quest not found: ${name}`);
  }

  return quest;
};

describe("storyline quest patch sync", () => {
  it("keeps Tour unlock objectives on the new visit-or-survive wording", () => {
    const tour = getQuestByName("Tour");
    const descriptions = tour.objectives?.map((objective) => objective.description);

    expect(descriptions).toEqual(
      expect.arrayContaining([
        "Survive and extract from Interchange or visit Interchange 3 times",
        "Survive and extract from Customs or visit Customs 3 times",
        "Survive and extract from Factory or visit Factory 3 times",
        "Survive and extract from Woods or visit Woods 3 times",
        "Survive and extract from Shoreline or visit Shoreline 3 times",
      ])
    );
  });

  it("uses the singular Cultist priest objective in They Are Already Here", () => {
    const chapter = getQuestByName("They Are Already Here");
    const descriptions = chapter.objectives?.map(
      (objective) => objective.description
    );

    expect(descriptions).toContain("Locate and neutralize a Cultist priest");
    expect(
      descriptions?.some((description) => description.includes("Cultist Priests"))
    ).toBe(false);
  });

  it("keeps The Ticket as a decision-map summary card", () => {
    const chapter = getQuestByName("The Ticket");

    expect(chapter.objectives).toBeUndefined();
    expect(chapter.notes).toContain("Route-specific steps live in the Decision Map.");
    expect(chapter.notes).toContain("/Storyline/Choose-Ending");
  });
});
