"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { markAnnouncementReadAction } from "@/app/(dashboardLayout)/dashboard/support/_action";
import Loader from "@/components/shared/Loader";
import StatusBadge from "@/components/shared/cell/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getMyAnnouncements } from "@/services/support.services";
import {
  ANNOUNCEMENT_TYPE_LABELS,
  type AnnouncementType,
  type BadgeTone,
} from "@/types/enums.types";

/** Announcement type to badge tone. Warnings read as warnings. */
const TYPE_TONES: Record<AnnouncementType, BadgeTone> = {
  INFO: "info",
  FEATURE: "success",
  MAINTENANCE: "warning",
  WARNING: "danger",
};

const AnnouncementsView = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["my-announcements"],
    queryFn: () => getMyAnnouncements(),
  });

  const announcements = data?.data ?? [];
  const unreadCount = announcements.filter((item) => !item.isRead).length;

  const { mutateAsync: markRead, isPending } = useMutation({
    mutationFn: (id: string) => markAnnouncementReadAction(id),
  });

  const handleMarkRead = async (id: string) => {
    const result = await markRead(id);

    if (!result.success) {
      toast.error(result.message || "Failed to mark as read");
      return;
    }

    void queryClient.invalidateQueries({ queryKey: ["my-announcements"] });
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Announcements
          {unreadCount > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {unreadCount} unread
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Notices from the platform. Read state is per person, not per agency.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex h-24 items-center justify-center">
            <Loader size={28} label="Loading announcements" />
          </div>
        ) : announcements.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nothing to read right now.
          </p>
        ) : (
          <ul className="space-y-3">
            {announcements.map((announcement) => (
              <li
                key={announcement.id}
                className={cn(
                  "rounded-lg border p-3",
                  // Unread is the one that should stand out, so the read ones
                  // recede rather than the unread ones shouting.
                  announcement.isRead ? "bg-muted/20" : "border-primary/30",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    label={ANNOUNCEMENT_TYPE_LABELS[announcement.type]}
                    tone={TYPE_TONES[announcement.type]}
                  />
                  <span className="flex-1 text-sm font-medium">{announcement.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(announcement.createdAt)}
                  </span>
                </div>

                <p className="mt-2 text-sm whitespace-pre-wrap text-muted-foreground">
                  {announcement.message}
                </p>

                {!announcement.isRead && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-7 text-xs"
                    onClick={() => handleMarkRead(announcement.id)}
                    disabled={isPending}
                  >
                    <Check className="size-3.5" aria-hidden="true" />
                    Mark as read
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default AnnouncementsView;
