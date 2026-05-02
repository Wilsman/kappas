import { describe, expect, it } from "vitest";
import type { HideoutStation, Task } from "@/types";
import { buildTaskObjectiveItemProgressKey, buildTaskObjectiveKeys } from "@/utils/taskObjectives";
import { buildTrackedItems } from "@/utils/trackedItems";

const makeTask = (overrides: Partial<Task>): Task =>
  ({
    id: "task-1",
    experience: 0,
    minPlayerLevel: 1,
    factionName: "Any",
    taskRequirements: [],
    wikiLink: "https://example.com/task",
    name: "Task",
    map: null,
    maps: [],
    trader: {
      name: "Therapist",
      imageLink: "",
    },
    objectives: [],
    ...overrides,
  }) as Task;

describe("buildTrackedItems", () => {
  it("aggregates task and hideout requirements under one item with source breakdown", () => {
    const tasks: Task[] = [
      makeTask({
        id: "private-clinic",
        name: "Private Clinic",
        objectives: [
          {
            description: "Hand over LEDX",
            count: 1,
            foundInRaid: true,
            items: [{ id: "ledx", name: "LEDX", iconLink: "task-ledx.png" }],
          },
        ],
      }),
      makeTask({
        id: "crisis",
        name: "Crisis",
        objectives: [
          {
            description: "Find LEDX",
            count: 2,
            items: [{ id: "ledx", name: "LEDX", iconLink: "task-ledx.png" }],
          },
        ],
      }),
    ];

    const hideoutStations: HideoutStation[] = [
      {
        name: "Medstation",
        imageLink: "",
        levels: [
          {
            level: 3,
            skillRequirements: [],
            stationLevelRequirements: [],
            itemRequirements: [
              {
                count: 1,
                item: { name: "LEDX", iconLink: "hideout-ledx.png" },
              },
            ],
          },
        ],
      },
    ];

    const crisisObjectiveKey = buildTaskObjectiveKeys(tasks[1])[0]!;
    const crisisItemKey = buildTaskObjectiveItemProgressKey(
      crisisObjectiveKey,
      "ledx",
    );

    const trackedItems = buildTrackedItems({
      tasks,
      completedTasks: new Set<string>(),
      completedTaskObjectives: new Set<string>(),
      taskObjectiveItemProgress: {
        [crisisItemKey]: 1,
      },
      hideoutStations,
      completedHideoutItems: new Set<string>(),
      hideoutItemQuantities: {
        "Medstation-3-LEDX": 1,
      },
      playerLevel: 20,
    });

    const ledx = trackedItems.find((item) => item.itemName === "LEDX");

    expect(ledx).toBeDefined();
    expect(ledx?.totalRequired).toBe(4);
    expect(ledx?.totalCurrent).toBe(2);
    expect(ledx?.totalRemaining).toBe(2);
    expect(ledx?.foundInRaidRequired).toBe(1);
    expect(ledx?.taskSourceCount).toBe(2);
    expect(ledx?.hideoutSourceCount).toBe(1);
    expect(ledx?.sources.map((source) => source.sourceName)).toEqual(
      expect.arrayContaining(["Private Clinic", "Crisis", "Medstation"]),
    );
  });

  it("merges paired find and hand-over objectives for the same task item", () => {
    const tasks: Task[] = [
      makeTask({
        id: "crisis",
        name: "Crisis",
        objectives: [
          {
            description: "Find Piles of meds in raid",
            count: 20,
            foundInRaid: true,
            items: [{ id: "meds", name: "Pile of meds" }],
          },
          {
            description: "Hand over the Piles of meds",
            count: 20,
            foundInRaid: true,
            items: [{ id: "meds", name: "Pile of meds" }],
          },
        ],
      }),
    ];

    const [trackedItem] = buildTrackedItems({
      tasks,
      completedTasks: new Set<string>(),
      completedTaskObjectives: new Set<string>(),
      taskObjectiveItemProgress: {},
      hideoutStations: [],
      completedHideoutItems: new Set<string>(),
      hideoutItemQuantities: {},
      playerLevel: 1,
    });

    expect(trackedItem.itemName).toBe("Pile of meds");
    expect(trackedItem.totalRequired).toBe(20);
    expect(trackedItem.taskSourceCount).toBe(1);
    expect(trackedItem.sources).toHaveLength(1);
    expect(trackedItem.sources[0].objectiveDescription).toBe(
      "Find and hand over",
    );
    expect(trackedItem.sources[0].objectiveProgressTargets).toHaveLength(2);
  });

  it("marks tasks actionable only when prerequisites and level are met", () => {
    const tasks: Task[] = [
      makeTask({
        id: "gated-task",
        name: "Gated Task",
        minPlayerLevel: 20,
        taskRequirements: [{ task: { id: "task-0", name: "Prior Task" } }],
        objectives: [
          {
            description: "Find item",
            count: 2,
            items: [{ name: "Gas analyzer" }],
          },
        ],
      }),
    ];

    const [trackedItem] = buildTrackedItems({
      tasks,
      completedTasks: new Set<string>(),
      completedTaskObjectives: new Set<string>(),
      taskObjectiveItemProgress: {},
      hideoutStations: [],
      completedHideoutItems: new Set<string>(),
      hideoutItemQuantities: {},
      playerLevel: 10,
    });

    expect(trackedItem.sources[0].actionable).toBe(false);
  });

  it("only marks the next incomplete hideout level as actionable", () => {
    const hideoutStations: HideoutStation[] = [
      {
        name: "Generator",
        imageLink: "",
        levels: [
          {
            level: 1,
            skillRequirements: [],
            stationLevelRequirements: [],
            itemRequirements: [{ count: 1, item: { name: "Spark plug" } }],
          },
          {
            level: 2,
            skillRequirements: [],
            stationLevelRequirements: [],
            itemRequirements: [{ count: 2, item: { name: "Wires" } }],
          },
        ],
      },
    ];

    const trackedItems = buildTrackedItems({
      tasks: [],
      completedTasks: new Set<string>(),
      completedTaskObjectives: new Set<string>(),
      taskObjectiveItemProgress: {},
      hideoutStations,
      completedHideoutItems: new Set<string>(["Generator-1-Spark plug"]),
      hideoutItemQuantities: {},
      playerLevel: 1,
    });

    const sparkPlug = trackedItems.find((item) => item.itemName === "Spark plug");
    const wires = trackedItems.find((item) => item.itemName === "Wires");

    expect(sparkPlug?.sources[0].actionable).toBe(false);
    expect(wires?.sources[0].actionable).toBe(true);
  });

  it("tracks progression metadata and sorts sources by task level then hideout level", () => {
    const tasks: Task[] = [
      makeTask({
        id: "late-task",
        name: "Late Task",
        minPlayerLevel: 30,
        objectives: [
          {
            description: "Hand over bolts",
            count: 2,
            items: [{ name: "Bolts" }],
          },
        ],
      }),
      makeTask({
        id: "early-task",
        name: "Early Task",
        minPlayerLevel: 5,
        objectives: [
          {
            description: "Hand over bolts",
            count: 1,
            items: [{ name: "Bolts" }],
          },
        ],
      }),
    ];

    const hideoutStations: HideoutStation[] = [
      {
        name: "Workbench",
        imageLink: "",
        levels: [
          {
            level: 3,
            skillRequirements: [],
            stationLevelRequirements: [],
            itemRequirements: [{ count: 1, item: { name: "Bolts" } }],
          },
          {
            level: 1,
            skillRequirements: [],
            stationLevelRequirements: [],
            itemRequirements: [{ count: 1, item: { name: "Bolts" } }],
          },
        ],
      },
    ];

    const [trackedItem] = buildTrackedItems({
      tasks,
      completedTasks: new Set<string>(),
      completedTaskObjectives: new Set<string>(),
      taskObjectiveItemProgress: {},
      hideoutStations,
      completedHideoutItems: new Set<string>(),
      hideoutItemQuantities: {},
      playerLevel: 1,
    });

    expect(trackedItem.itemName).toBe("Bolts");
    expect(trackedItem.minTaskLevel).toBe(5);
    expect(trackedItem.minHideoutLevel).toBe(1);
    expect(
      trackedItem.sources.map((source) => ({
        sourceName: source.sourceName,
        taskMinPlayerLevel: source.taskMinPlayerLevel,
        hideoutLevel: source.hideoutLevel,
      })),
    ).toEqual([
      {
        sourceName: "Early Task",
        taskMinPlayerLevel: 5,
        hideoutLevel: undefined,
      },
      {
        sourceName: "Late Task",
        taskMinPlayerLevel: 30,
        hideoutLevel: undefined,
      },
      {
        sourceName: "Workbench",
        taskMinPlayerLevel: undefined,
        hideoutLevel: 1,
      },
      {
        sourceName: "Workbench",
        taskMinPlayerLevel: undefined,
        hideoutLevel: 3,
      },
    ]);
  });

  it("treats non-positive task levels as unknown and skips generic sell-any-item objectives", () => {
    const tasks: Task[] = [
      makeTask({
        id: "unknown-level-task",
        name: "Unknown Level Task",
        minPlayerLevel: 0,
        objectives: [
          {
            description: "Hand over cultist knife",
            count: 1,
            items: [{ name: "Cultist knife" }],
          },
        ],
      }),
      makeTask({
        id: "generic-sell-task",
        name: "Generic Sell Task",
        minPlayerLevel: 10,
        objectives: [
          {
            description: "Sell any items to Ragman",
            count: 50,
            items: [{ name: "Bottle of Dan Jackiel whiskey" }],
          },
        ],
      }),
    ];

    const trackedItems = buildTrackedItems({
      tasks,
      completedTasks: new Set<string>(),
      completedTaskObjectives: new Set<string>(),
      taskObjectiveItemProgress: {},
      hideoutStations: [],
      completedHideoutItems: new Set<string>(),
      hideoutItemQuantities: {},
      playerLevel: 1,
    });

    const cultistKnife = trackedItems.find(
      (item) => item.itemName === "Cultist knife",
    );

    expect(cultistKnife?.minTaskLevel).toBeUndefined();
    expect(cultistKnife?.sources[0].taskMinPlayerLevel).toBeUndefined();
    expect(
      trackedItems.find(
        (item) => item.itemName === "Bottle of Dan Jackiel whiskey",
      ),
    ).toBeUndefined();
  });

  it("tracks task prerequisite depth for progression ordering", () => {
    const tasks: Task[] = [
      makeTask({
        id: "starter-task",
        name: "Starter Task",
        minPlayerLevel: 15,
        objectives: [
          {
            description: "Hand over cultist knife",
            count: 1,
            items: [{ name: "Cultist knife" }],
          },
        ],
      }),
      makeTask({
        id: "deep-prereq-1",
        name: "Deep Prereq 1",
        minPlayerLevel: 1,
        taskRequirements: [{ task: { id: "deep-prereq-0", name: "Deep 0" } }],
      }),
      makeTask({
        id: "deep-prereq-2",
        name: "Deep Prereq 2",
        minPlayerLevel: 1,
        taskRequirements: [{ task: { id: "deep-prereq-1", name: "Deep 1" } }],
      }),
      makeTask({
        id: "late-chain-task",
        name: "Late Chain Task",
        minPlayerLevel: 2,
        taskRequirements: [{ task: { id: "deep-prereq-2", name: "Deep 2" } }],
        objectives: [
          {
            description: "Hand over red rebel",
            count: 1,
            items: [{ name: "Red Rebel ice pick" }],
          },
        ],
      }),
    ];

    const trackedItems = buildTrackedItems({
      tasks,
      completedTasks: new Set<string>(),
      completedTaskObjectives: new Set<string>(),
      taskObjectiveItemProgress: {},
      hideoutStations: [],
      completedHideoutItems: new Set<string>(),
      hideoutItemQuantities: {},
      playerLevel: 1,
    });

    const cultistKnife = trackedItems.find(
      (item) => item.itemName === "Cultist knife",
    );
    const redRebel = trackedItems.find(
      (item) => item.itemName === "Red Rebel ice pick",
    );

    expect(cultistKnife?.minTaskLevel).toBe(15);
    expect(cultistKnife?.minTaskPrerequisiteDepth).toBe(0);
    expect(redRebel?.minTaskLevel).toBe(2);
    expect(redRebel?.minTaskPrerequisiteDepth).toBe(3);
  });

  it("deduplicates repeated task variants with the same visible item requirement", () => {
    const tasks: Task[] = [
      makeTask({
        id: "new-beginning-a",
        name: "New Beginning",
        minPlayerLevel: 55,
        trader: {
          name: "Ragman",
          imageLink: "",
        },
        objectives: [
          {
            description: "Hand over the found in raid item: BEAR operative figurine",
            count: 1,
            foundInRaid: true,
            items: [{ name: "BEAR operative figurine" }],
          },
        ],
      }),
      makeTask({
        id: "new-beginning-b",
        name: "New Beginning",
        minPlayerLevel: 55,
        trader: {
          name: "Ragman",
          imageLink: "",
        },
        objectives: [
          {
            description: "Hand over the found in raid item: BEAR operative figurine",
            count: 1,
            foundInRaid: true,
            items: [{ name: "BEAR operative figurine" }],
          },
        ],
      }),
    ];

    const [trackedItem] = buildTrackedItems({
      tasks,
      completedTasks: new Set<string>(),
      completedTaskObjectives: new Set<string>(),
      taskObjectiveItemProgress: {},
      hideoutStations: [],
      completedHideoutItems: new Set<string>(),
      hideoutItemQuantities: {},
      playerLevel: 1,
    });

    expect(trackedItem.itemName).toBe("BEAR operative figurine");
    expect(trackedItem.totalRequired).toBe(1);
    expect(trackedItem.totalRemaining).toBe(1);
    expect(trackedItem.taskSourceCount).toBe(1);
    expect(trackedItem.sources).toHaveLength(1);
  });

  it("skips broad alternative pools so the tracker stays focused", () => {
    const tasks: Task[] = [
      makeTask({
        id: "any-med-item",
        name: "Any Med Item",
        objectives: [
          {
            description: "Hand over any found in raid medicine items",
            count: 1,
            foundInRaid: true,
            items: Array.from({ length: 20 }, (_, index) => ({
              name: `Medicine ${index + 1}`,
            })),
          },
        ],
      }),
    ];

    const trackedItems = buildTrackedItems({
      tasks,
      completedTasks: new Set<string>(),
      completedTaskObjectives: new Set<string>(),
      taskObjectiveItemProgress: {},
      hideoutStations: [],
      completedHideoutItems: new Set<string>(),
      hideoutItemQuantities: {},
      playerLevel: 1,
    });

    expect(trackedItems).toHaveLength(0);
  });

  it("skips null item entries from API payloads without crashing", () => {
    const tasks: Task[] = [
      makeTask({
        id: "null-objective-item",
        name: "Null Objective Item",
        objectives: [
          {
            description: "Hand over usable item",
            count: 1,
            items: [
              null,
              { id: "usable", name: "Usable item", iconLink: "usable.png" },
            ],
          },
        ],
      }),
    ];

    const hideoutStations = [
      {
        name: "Workbench",
        imageLink: "",
        levels: [
          {
            level: 1,
            skillRequirements: [],
            stationLevelRequirements: [],
            itemRequirements: [
              { count: 1, item: null },
              { count: 2, item: { name: "Wires" } },
            ],
          },
        ],
      },
    ] as unknown as HideoutStation[];

    const trackedItems = buildTrackedItems({
      tasks: tasks as unknown as Task[],
      completedTasks: new Set<string>(),
      completedTaskObjectives: new Set<string>(),
      taskObjectiveItemProgress: {},
      hideoutStations,
      completedHideoutItems: new Set<string>(),
      hideoutItemQuantities: {},
      playerLevel: 1,
    });

    expect(trackedItems.map((item) => item.itemName).sort()).toEqual([
      "Usable item",
      "Wires",
    ]);
  });
});
