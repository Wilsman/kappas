import { Toast } from "@base-ui/react/toast";
import { X } from "lucide-react";
import { taskToastManager } from "@/utils/taskToastManager";

function BaseToastList() {
  const { toasts } = Toast.useToastManager();

  return toasts.map((toast) => (
    <Toast.Root
      key={toast.id}
      toast={toast}
      className="task-toast pointer-events-auto grid w-[min(420px,calc(100vw-2rem))] grid-cols-[1fr_auto] gap-x-3 rounded-md border border-border bg-background p-4 text-foreground shadow-xl outline-none"
    >
      <Toast.Content className="task-toast-content min-w-0 space-y-1">
        <Toast.Title className="text-sm font-semibold leading-5" />
        <Toast.Description className="text-xs leading-5 text-muted-foreground" />
        {toast.actionProps ? (
          <Toast.Action
            {...toast.actionProps}
            className="mt-2 inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          />
        ) : null}
      </Toast.Content>
      <Toast.Close
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </Toast.Close>
    </Toast.Root>
  ));
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
