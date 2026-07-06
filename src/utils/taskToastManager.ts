import { Toast } from "@base-ui/react/toast";
import type { BackfilledTaskToastItem } from "@/utils/backfilledTasks";

export type TaskToastData = {
  backfilledTasks?: BackfilledTaskToastItem[];
};

export const taskToastManager = Toast.createToastManager<TaskToastData>();
