"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { MailCheck, Play } from "lucide-react";
import { toast } from "sonner";
import { runSubscriptionLifecycleAction } from "@/app/(dashboardLayout)/admin/dashboard/_action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";

const plural = (count: number, one: string, many: string) => `${formatNumber(count)} ${count === 1 ? one : many}`;

/**
 * The hourly subscription job, explained, with a way to run it now — after
 * extending a batch of trials, say, or to confirm mail is going out. Running it
 * twice is harmless: each email is recorded and never sent again.
 */
const SubscriptionLifecycleCard = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: () => runSubscriptionLifecycleAction(),
  });

  const handleRun = async () => {
    const result = await mutateAsync();

    if (!result.success) {
      toast.error(result.message || "The job did not run");
      return;
    }

    const { expired, reminders, emails } = result.data;
    toast.success(
      expired === 0 && reminders === 0 ? "Nothing was due" : "Subscription job ran",
      {
        description: `${plural(expired, "agency", "agencies")} expired · ${plural(reminders, "reminder", "reminders")} · ${plural(emails, "email", "emails")} sent`,
      },
    );

    void queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-agencies"] });
    void queryClient.invalidateQueries({ queryKey: ["activity-log"] });
    void queryClient.refetchQueries({ queryKey: ["platform-stats"], type: "active" });
    router.refresh();
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            <MailCheck className="size-4 text-primary" aria-hidden="true" />
            Subscription emails and expiry
          </CardTitle>
          <CardDescription>
            Runs every hour. Lapsed trials and subscriptions become read-only, and agency admins
            are emailed 3 days and 1 day before a trial ends, 7 days and 1 day before a
            subscription ends, and when it lapses. Each email is sent once.
          </CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleRun} disabled={isPending} className="shrink-0">
          <Play className="size-3.5" aria-hidden="true" />
          {isPending ? "Running..." : "Run now"}
        </Button>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">
        Emails need SMTP configured on the API; without it they are logged, not sent.
      </CardContent>
    </Card>
  );
};

export default SubscriptionLifecycleCard;
