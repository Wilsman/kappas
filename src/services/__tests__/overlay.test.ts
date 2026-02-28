import { describe, expect, test } from "vitest";
import { applyTaskOverlay, fetchOverlay, buildEventTasksFromOverlay } from "../tarkovApi";
import type { Task, Overlay } from "../../types";

describe("Overlay Integration", () => {
    const mockOverlay: Overlay = {
        tasks: {
            "task-1": {
                experience: 99999,
                name: "Overridden Task Name",
            },
            "disabled-task": {
                disabled: true,
            },
        },
        $meta: {
            version: "1.0.0",
            generated: new Date().toISOString(),
        },
    };

    const baseTask: Task = {
        id: "task-1",
        name: "Original Task Name",
        experience: 1000,
        minPlayerLevel: 1,
        taskRequirements: [],
        wikiLink: "",
        map: { name: "Customs" },
        maps: [],
        trader: { name: "Prapor" },
        startRewards: { items: [] },
        finishRewards: { items: [] },
        objectives: [],
    };

    test("should apply top-level field overrides", () => {
        const patched = applyTaskOverlay(baseTask, mockOverlay);
        expect(patched).not.toBeNull();
        expect(patched?.name).toBe("Overridden Task Name");
        expect(patched?.experience).toBe(99999);
    });

    test("should return null for disabled tasks", () => {
        const disabledBase: Task = { ...baseTask, id: "disabled-task" };
        const patched = applyTaskOverlay(disabledBase, mockOverlay);
        expect(patched).toBeNull();
    });

    test("should return original task if no override exists", () => {
        const otherTask: Task = { ...baseTask, id: "other-task" };
        const patched = applyTaskOverlay(otherTask, mockOverlay);
        expect(patched).toEqual(otherTask);
    });

    test("should merge taskRequirements (append, not replace)", () => {
        const overlayWithReqs: Overlay = {
            tasks: {
                "task-1": {
                    taskRequirements: [
                        { task: { id: "new-req", name: "New Requirement" } }
                    ]
                }
            },
            $meta: { version: "1.0.0", generated: new Date().toISOString() }
        };

        const taskWithExistingReqs: Task = {
            ...baseTask,
            taskRequirements: [
                { task: { id: "existing-req", name: "Existing Requirement" } }
            ]
        };

        const patched = applyTaskOverlay(taskWithExistingReqs, overlayWithReqs);
        expect(patched?.taskRequirements).toHaveLength(2);
        expect(patched?.taskRequirements.map((r) => r.task.id)).toContain("existing-req");
        expect(patched?.taskRequirements.map((r) => r.task.id)).toContain("new-req");
    });

    test("should build seasonal event tasks from overlay tasksAdd", () => {
        const overlayWithEvents: Overlay = {
            tasksAdd: {
                winter_event_01: {
                    id: "winter_event_01",
                    name: "Missing in Action",
                    wikiLink: "https://example.com",
                    trader: { id: "trader-1", name: "Prapor" },
                    maps: [{ id: "map-woods", name: "Woods" }],
                    taskRequirements: [],
                    objectives: [
                        {
                            id: "obj-1",
                            description: "Stash buckwheat",
                            maps: [{ id: "map-woods", name: "Woods" }],
                            item: { id: "item-1", name: "Buckwheat" },
                            count: 1,
                        },
                    ],
                    finishRewards: {
                        items: [
                            {
                                count: 1,
                                item: { id: "reward-1", name: "Roubles" },
                            },
                        ],
                        traderStanding: [
                            {
                                trader: {
                                    id: "trader-1",
                                    name: "Prapor",
                                },
                                standing: 0.05,
                            },
                        ],
                        customization: [
                            {
                                id: "custom-1",
                                name: "Scavenger target",
                                customizationType: "ShootingRangeMark",
                                customizationTypeName: "Targets",
                            },
                        ],
                        achievement: [
                            {
                                id: "achievement-1",
                                name: "Duck Hunt",
                                description: "Complete the event task",
                            },
                        ],
                        skillLevelReward: [
                            {
                                name: "Perception",
                                level: 4,
                                skill: {
                                    id: "Perception",
                                    name: "Perception",
                                },
                            },
                        ],
                    },
                },
            },
            $meta: {
                version: "1.0.0",
                generated: new Date().toISOString(),
            },
        };

        const tasks = buildEventTasksFromOverlay(overlayWithEvents);
        expect(tasks).toHaveLength(1);
        const eventTask = tasks[0];
        expect(eventTask.isEvent).toBe(true);
        expect(eventTask.name).toBe("Missing in Action");
        expect(eventTask.maps.map((m) => m.name)).toContain("Woods");
        expect(eventTask.objectives?.[0].items?.[0].iconLink).toBe(
            "https://assets.tarkov.dev/item-1-icon.webp"
        );
        expect(eventTask.finishRewards?.items?.[0].item.iconLink).toBe(
            "https://assets.tarkov.dev/reward-1-icon.webp"
        );
        expect(eventTask.finishRewards?.traderStanding?.[0].trader?.name).toBe(
            "Prapor"
        );
        expect(eventTask.finishRewards?.traderStanding?.[0].standing).toBe(0.05);
        expect(eventTask.finishRewards?.customization?.[0].name).toBe(
            "Scavenger target"
        );
        expect(eventTask.finishRewards?.achievement?.[0].name).toBe("Duck Hunt");
        expect(eventTask.finishRewards?.skillLevelReward?.[0].name).toBe(
            "Perception"
        );
        expect(eventTask.finishRewards?.skillLevelReward?.[0].level).toBe(4);
    });

    describe("Collector Task (Mock Overlay)", () => {
        test("should work with mock overlay data", () => {
            const overlay: Overlay = {
                tasks: {
                    "5c51aac186f77432ea65c552": {
                        objectivesAdd: [
                            {
                                description: "Hand over the found in raid item: Nut Sack balaclava",
                                items: [{ id: "69398e94ca94fd2877039504", name: "Nut Sack balaclava" }]
                            }
                        ]
                    }
                },
                $meta: { version: "1.0.0", generated: new Date().toISOString() }
            };
            const collectorTaskId = "5c51aac186f77432ea65c552";

            const baseCollectorTask: Task = {
                id: collectorTaskId,
                name: "Collector",
                minPlayerLevel: 1,
                taskRequirements: [],
                wikiLink: "",
                map: { name: "Customs" },
                maps: [],
                trader: { name: "Prapor" },
                startRewards: { items: [] },
                finishRewards: { items: [] },
                objectives: [
                    { description: "Existing Objective", items: [{ id: "item1", name: "Existing Item" }] }
                ]
            };

            const patched = applyTaskOverlay(baseCollectorTask, overlay);

            expect(patched).not.toBeNull();
            // Verify objectivesAdd appended Nut Sack items
            const objectives = patched?.objectives || [];
            expect(objectives.length).toBeGreaterThan(1);

            const nutSackObjective = objectives.find(obj =>
                obj.description === "Hand over the found in raid item: Nut Sack balaclava"
            );
            expect(nutSackObjective).toBeDefined();
            const nutSackItem = nutSackObjective?.items?.find(
                (item) => item.name === "Nut Sack balaclava"
            );
            expect(nutSackItem?.id).toBe("69398e94ca94fd2877039504");
            expect(nutSackItem?.iconLink).toBe(
                "https://assets.tarkov.dev/69398e94ca94fd2877039504-icon.webp"
            );
        });

        test("should skip duplicate collector items already returned by the API", () => {
            const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
            const overlay: Overlay = {
                tasks: {
                    "5c51aac186f77432ea65c552": {
                        objectivesAdd: [
                            {
                                description: "Hand over the found in raid Collector items",
                                items: [{ id: "69398e94ca94fd2877039504", name: "Nut Sack balaclava" }]
                            }
                        ]
                    }
                },
                $meta: { version: "1.0.0", generated: new Date().toISOString() }
            };

            const baseCollectorTask: Task = {
                id: "5c51aac186f77432ea65c552",
                name: "Collector",
                minPlayerLevel: 1,
                taskRequirements: [],
                wikiLink: "",
                map: { name: "Customs" },
                maps: [],
                trader: { name: "Fence" },
                startRewards: { items: [] },
                finishRewards: { items: [] },
                objectives: [
                    {
                        description: "Hand over the found in raid item: Nut Sack balaclava",
                        items: [{ id: "69398e94ca94fd2877039504", name: "Nut Sack balaclava" }]
                    }
                ]
            };

            const patched = applyTaskOverlay(baseCollectorTask, overlay);
            const matchingObjectives = patched?.objectives?.filter((objective) =>
                objective.items?.some((item) => item.id === "69398e94ca94fd2877039504")
            );

            expect(matchingObjectives).toHaveLength(1);
            expect(warnSpy).not.toHaveBeenCalled();
            warnSpy.mockRestore();
        });
    });

    describe("Remote Fetching", () => {
        test("should fetch the overlay from the remote URL", async () => {
            const overlay = await fetchOverlay();
            expect(overlay).toBeDefined();
            expect(overlay.$meta).toBeDefined();
            expect(overlay.$meta.version).toBeDefined();
            console.log(`[Test] Remote version: ${overlay.$meta.version}`);
        });
    });

    describe("Data Comparison (Showcase)", () => {
        test("demonstrate merge: Grenadier experience", () => {
            const overlay: Overlay = {
                tasks: {
                    "5c0d190cd09282029f5390d8": {
                        experience: 12500
                    }
                },
                $meta: { version: "1.0.0", generated: new Date().toISOString() }
            };
            const grenadierId = "5c0d190cd09282029f5390d8";

            const apiData: Task = {
                id: grenadierId,
                name: "Grenadier",
                experience: 10000, // Tarkov Dev API might say 10k
                minPlayerLevel: 1,
                taskRequirements: [],
                wikiLink: "",
                map: { name: "Customs" },
                maps: [],
                trader: { name: "Prapor" },
                startRewards: { items: [] },
                finishRewards: { items: [] },
                objectives: [],
            };

            const overlayData = overlay.tasks?.[grenadierId];
            const result = applyTaskOverlay(apiData, overlay);

            console.log(`\n--- Grenadier Merge Result ---`);
            console.log(`API Data Exp: ${apiData.experience}`);
            console.log(`Overlay Data Exp: ${overlayData?.experience}`);
            console.log(`Merged Result Exp: ${result?.experience}`);
            console.log(`------------------------------\n`);

            if (overlayData?.experience) {
                expect(result?.experience).toBe(overlayData.experience);
            }
        });
    });
});
