import { Toast } from "@base-ui/react/toast";
import { ListChecks, X } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { taskToastManager } from "@/utils/taskToastManager";

function BaseToastList() {
  const { toasts } = Toast.useToastManager();

  return toasts.map((toast) => {
    const backfilledTasks = toast.data?.backfilledTasks ?? [];

    return (
      <Toast.Root
        key={toast.id}
        toast={toast}
        className="task-toast pointer-events-auto grid w-[min(420px,calc(100vw-2rem))] grid-cols-[1fr_auto] gap-x-3 rounded-md border border-border bg-background p-4 text-foreground shadow-xl outline-none"
      >
        <Toast.Content className="task-toast-content min-w-0 space-y-1">
          <Toast.Title className="text-sm font-semibold leading-5" />
          <Toast.Description className="text-xs leading-5 text-muted-foreground" />
          {(backfilledTasks.length > 0 || toast.actionProps) && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {backfilledTasks.length > 0 && (
                <HoverCard openDelay={120} closeDelay={80}>
                  <HoverCardTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-border bg-muted/40 px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      aria-label={`View ${backfilledTasks.length} backfilled previous ${
                        backfilledTasks.length === 1 ? "quest" : "quests"
                      }`}
                    >
                      <ListChecks className="h-3.5 w-3.5 text-primary" />
                      {backfilledTasks.length}{" "}
                      {backfilledTasks.length === 1 ? "quest" : "quests"}
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent
                    align="start"
                    side="top"
                    className="z-[120] w-[min(360px,calc(100vw-2rem))] p-3"
                  >
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Backfilled quests
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          These prerequisites were completed automatically.
                        </p>
                      </div>
                      <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
                        {backfilledTasks.map((task) => (
                          <li
                            key={task.id}
                            className="flex min-w-0 items-center gap-2"
                          >
                            {task.traderImage ? (
                              <img
                                src={task.traderImage}
                                alt=""
                                className="h-6 w-6 shrink-0 rounded-full border border-border object-cover"
                              />
                            ) : (
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-[10px] font-semibold text-muted-foreground">
                                {task.traderName?.charAt(0) ?? "?"}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium leading-5">
                                {task.name}
                              </p>
                              {task.traderName && (
                                <p className="truncate text-xs text-muted-foreground">
                                  {task.traderName}
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              )}
              {toast.actionProps ? (
                <Toast.Action
                  {...toast.actionProps}
                  className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                />
              ) : null}
            </div>
          )}
        </Toast.Content>
        <Toast.Close
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </Toast.Close>
      </Toast.Root>
    );
  });
}

export function BaseToastViewport() {
  return (
    <Toast.Provider toastManager={taskToastManager} limit={5} timeout={10000}>
      <Toast.Portal>
        <Toast.Viewport className="task-toast-viewport pointer-events-none fixed bottom-4 right-4 z-[100] outline-none">
          <BaseToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}
