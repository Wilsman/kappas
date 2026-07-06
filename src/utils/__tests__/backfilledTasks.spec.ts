import type { Task } from "@/types";
import { buildBackfilledTaskToastItems } from "@/utils/backfilledTasks";

const task = (
  id: string,
  name: string,
  trader: Task["trader"] = { name: "Prapor" },
): Pick<Task, "id" | "name" | "trader"> => ({
  id,
  name,
  trader,
});

describe("buildBackfilledTaskToastItems", () => {
  it("maps auto-completed task ids to toast display rows", () => {
    const knownTasksById = new Map([
      [
        "ambulance",
        task("ambulance", "Ambulance", {
          name: "Jaeger",
          imageLink: "https://example.com/jaeger.webp",
        }),
      ],
      ["acquaintance", task("acquaintance", "Acquaintance")],
    ]);

    expect(
      buildBackfilledTaskToastItems(
        ["ambulance", "acquaintance"],
        knownTasksById,
      ),
    ).toEqual([
      {
        id: "ambulance",
        name: "Ambulance",
        traderName: "Jaeger",
        traderImage: "https://example.com/jaeger.webp",
      },
      {
        id: "acquaintance",
        name: "Acquaintance",
        traderName: "Prapor",
        traderImage: undefined,
      },
    ]);
  });

  it("falls back to task id and removes duplicate ids", () => {
    expect(
      buildBackfilledTaskToastItems(
        ["missing-task", "missing-task"],
        new Map(),
      ),
    ).toEqual([
      {
        id: "missing-task",
        name: "missing-task",
        traderName: undefined,
        traderImage: undefined,
      },
    ]);
  });
});
