import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { TaskDetailsContent } from "@/components/TaskDetailsContent";
import type { Task } from "@/types";

const detailedTask: Task = {
  id: "network-provider-test",
  name: "Network Provider - Part 1",
  minPlayerLevel: 1,
  factionName: null,
  taskRequirements: [],
  wikiLink: "",
  trader: { name: "Mechanic" },
  map: { name: "Lighthouse" },
  maps: [{ name: "Lighthouse" }],
  experience: 18_600,
  objectives: [
    {
      id: "components",
      description: "Hand over the found in raid Electronic components",
      count: 4,
      foundInRaid: true,
      items: [
        {
          id: "electronic-components",
          name: "Electronic components",
          iconLink: "https://assets.tarkov.dev/test.webp",
        },
      ],
    },
    {
      id: "raiders",
      description: "Eliminate Raiders in The Lab",
      count: 7,
    },
  ],
  finishRewards: {
    traderStanding: [
      { trader: { name: "Mechanic" }, standing: 0.01 },
    ],
  },
};

describe("TaskDetailsContent", () => {
  it("renders the normal task-list detail density", () => {
    const html = renderToStaticMarkup(
      <TaskDetailsContent
        task={detailedTask}
        completedTaskObjectives={new Set()}
        taskObjectiveItemProgress={{}}
        onToggleTaskObjective={vi.fn()}
        onUpdateTaskObjectiveItemProgress={vi.fn()}
      />,
    );

    expect(html).toContain("Map:");
    expect(html).toContain("Lighthouse");
    expect(html).toContain("Electronic components");
    expect(html).toContain("FIR");
    expect(html).toContain("0/4");
    expect(html).toContain("Eliminate Raiders in The Lab x7");
    expect(html).toContain("0/7");
    expect(html).toContain("18,600 XP");
    expect(html).toContain("+0.01 Mechanic");
  });

  it("renders imported objective and item progress", () => {
    const html = renderToStaticMarkup(
      <TaskDetailsContent
        task={detailedTask}
        completedTaskObjectives={
          new Set(["network-provider-test::objective-id::components"])
        }
        taskObjectiveItemProgress={{
          "network-provider-test::objective-id::components::item::electronic-components":
            3,
          "network-provider-test::objective-id::raiders::progress": 5,
        }}
        onToggleTaskObjective={vi.fn()}
        onUpdateTaskObjectiveItemProgress={vi.fn()}
      />,
    );

    expect(html).toContain("3/4");
    expect(html).toContain("1 remaining");
    expect(html).toContain("5/7");
    expect(html).toContain('data-state="checked"');
  });
});
