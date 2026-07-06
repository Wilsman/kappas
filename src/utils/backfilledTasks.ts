import type { Task } from "@/types";

export type BackfilledTaskToastItem = {
  id: string;
  name: string;
  traderName?: string;
  traderImage?: string;
};

export type TaskLookup = Pick<Task, "id" | "name" | "trader">;

export function buildBackfilledTaskToastItems(
  taskIds: string[],
  knownTasksById: Map<string, TaskLookup>,
): BackfilledTaskToastItem[] {
  const seenTaskIds = new Set<string>();

  return taskIds.reduce<BackfilledTaskToastItem[]>((items, taskId) => {
    if (seenTaskIds.has(taskId)) {
      return items;
    }

    seenTaskIds.add(taskId);
    const task = knownTasksById.get(taskId);

    items.push({
      id: taskId,
      name: task?.name ?? taskId,
      traderName: task?.trader?.name,
      traderImage: task?.trader?.imageLink,
    });

    return items;
  }, []);
}
