import { ExternalLink, Megaphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppAnnouncement, AnnouncementTone } from "@/data/announcements";

interface AnnouncementBannerProps {
  announcements: AppAnnouncement[];
  onDismiss: (id: string) => void;
}

const toneClasses: Record<AnnouncementTone, string> = {
  info: "border-sky-500/30 bg-sky-500/10 text-sky-950 dark:text-sky-50",
  success:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-50",
  warning:
    "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-50",
};

const iconClasses: Record<AnnouncementTone, string> = {
  info: "text-sky-600 dark:text-sky-300",
  success: "text-emerald-600 dark:text-emerald-300",
  warning: "text-amber-600 dark:text-amber-300",
};

export function AnnouncementBanner({
  announcements,
  onDismiss,
}: AnnouncementBannerProps): JSX.Element | null {
  if (announcements.length === 0) return null;

  return (
    <section
      aria-label="Announcements"
      className="border-b bg-background/95 px-2 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <div className="space-y-2">
        {announcements.map((announcement) => (
          <article
            key={announcement.id}
            className={cn(
              "flex items-start gap-3 rounded-md border px-3 py-2 shadow-sm",
              toneClasses[announcement.tone],
            )}
          >
            <Megaphone
              aria-hidden="true"
              className={cn("mt-0.5 h-4 w-4 shrink-0", iconClasses[announcement.tone])}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-5">
                {announcement.title}
              </p>
              <p className="text-sm leading-5 text-foreground/75">
                {announcement.body}
              </p>
              {announcement.href && announcement.actionLabel ? (
                <Button
                  asChild
                  variant="link"
                  size="sm"
                  className="mt-1 h-auto p-0 text-xs"
                >
                  <a
                    href={announcement.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {announcement.actionLabel}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-foreground/70 hover:text-foreground"
              onClick={() => onDismiss(announcement.id)}
              aria-label={`Dismiss announcement: ${announcement.title}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}
