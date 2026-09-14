"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { CalendarPlus, Layers, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  assignPlanAction,
  extendTrialAction,
  updateAgencyStatusAction,
} from "@/app/(dashboardLayout)/admin/dashboard/_action";
import Loader from "@/components/shared/Loader";
import StatusBadge from "@/components/shared/cell/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { getAdminPlans, getAgencyById } from "@/services/admin.services";
import { type IAdminAgency } from "@/types/admin.types";
import {
  AGENCY_STATUS_LABELS,
  AGENCY_STATUS_TONES,
  PLAN_FEATURE_LABELS,
  USER_ROLE_LABELS,
  type AgencyStatus,
} from "@/types/enums.types";

interface AgencyDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agency: IAdminAgency;
}

/** TRIAL is absent: the API will not put an agency back on trial by hand. */
const SETTABLE_STATUSES: Extract<AgencyStatus, "ACTIVE" | "EXPIRED" | "SUSPENDED">[] = [
  "ACTIVE",
  "EXPIRED",
  "SUSPENDED",
];

const PLAN_ACTION_LABELS: Record<string, string> = {
  ASSIGNED: "Assigned",
  UPGRADED: "Upgraded",
  DOWNGRADED: "Downgraded",
  TRIAL_EXTENDED: "Trial extended",
};

const AgencyDetailSheet = ({ open, onOpenChange, agency }: AgencyDetailSheetProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [nextStatus, setNextStatus] = useState<string>("");
  const [planId, setPlanId] = useState<string>("");
  const [trialDays, setTrialDays] = useState("7");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-agency", agency.id],
    queryFn: () => getAgencyById(agency.id),
    enabled: open,
  });

  const { data: plansData } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: () => getAdminPlans(),
    enabled: open,
  });

  const detail = data?.data;
  const plans = (plansData?.data ?? []).filter((plan) => plan.isActive);
  const currentStatus = detail?.status ?? agency.status;

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-agency", agency.id] });
    void queryClient.invalidateQueries({ queryKey: ["admin-agencies"] });
    void queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
    void queryClient.invalidateQueries({ queryKey: ["activity-log"] });
    router.refresh();
  };

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateAgencyStatusAction(agency.id, { status }),
  });
  const planMutation = useMutation({
    mutationFn: (id: string) => assignPlanAction(agency.id, { planId: id }),
  });
  const trialMutation = useMutation({
    mutationFn: (days: string) => extendTrialAction(agency.id, { days }),
  });

  const run = async (
    promise: Promise<{ success: boolean; message: string }>,
    fallback: string,
    reset: () => void,
  ) => {
    const result = await promise;
    if (!result.success) {
      toast.error(result.message || fallback);
      return;
    }
    toast.success(result.message);
    reset();
    invalidate();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 sm:max-w-xl">
        <SheetHeader>
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle>{agency.name}</SheetTitle>
            <StatusBadge
              label={AGENCY_STATUS_LABELS[currentStatus]}
              tone={AGENCY_STATUS_TONES[currentStatus]}
            />
          </div>
          <SheetDescription>
            {agency.email || "No email"} · joined {formatDate(agency.createdAt)}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-4">
          {isLoading || !detail ? (
            <div className="flex h-32 items-center justify-center">
              <Loader size={28} label="Loading agency" />
            </div>
          ) : (
            <>
              <dl className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Plan</dt>
                  <dd className="font-medium">
                    {detail.plan
                      ? `${detail.plan.name} · ${formatCurrency(detail.plan.price)}`
                      : "None"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">
                    {currentStatus === "TRIAL" ? "Trial ends" : "Subscription ends"}
                  </dt>
                  <dd className="font-medium">
                    {formatDate(
                      currentStatus === "TRIAL" ? detail.trialEndsAt : detail.subscriptionEndsAt,
                    )}
                  </dd>
                </div>
              </dl>

              {detail.plan && (
                <div className="flex flex-wrap gap-1">
                  {detail.plan.features.map((feature) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {PLAN_FEATURE_LABELS[feature]}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Status */}
              <section className="space-y-2 rounded-lg border p-3">
                <h3 className="flex items-center gap-2 text-sm font-medium">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  Status
                </h3>
                <p className="text-xs text-muted-foreground">
                  Suspending is not cosmetic: the agency drops to read-only and loses its
                  modules, because the feature check reads this status.
                </p>
                <div className="flex gap-2">
                  <Select value={nextStatus} onValueChange={setNextStatus}>
                    <SelectTrigger className="flex-1" aria-label="New status">
                      <SelectValue placeholder="Change status" />
                    </SelectTrigger>
                    <SelectContent>
                      {SETTABLE_STATUSES.filter((status) => status !== currentStatus).map(
                        (status) => (
                          <SelectItem key={status} value={status}>
                            {AGENCY_STATUS_LABELS[status]}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant={nextStatus === "SUSPENDED" ? "destructive" : "default"}
                    disabled={!nextStatus || statusMutation.isPending}
                    onClick={() =>
                      run(statusMutation.mutateAsync(nextStatus), "Failed to update status", () =>
                        setNextStatus(""),
                      )
                    }
                  >
                    Apply
                  </Button>
                </div>
              </section>

              {/* Plan */}
              <section className="space-y-2 rounded-lg border p-3">
                <h3 className="flex items-center gap-2 text-sm font-medium">
                  <Layers className="size-4" aria-hidden="true" />
                  Assign a plan
                </h3>
                <p className="text-xs text-muted-foreground">
                  Stacks from the later of today or the current end date — the same rule an
                  online payment uses, so the two cannot disagree.
                </p>
                <div className="flex gap-2">
                  <Select value={planId} onValueChange={setPlanId}>
                    <SelectTrigger className="flex-1" aria-label="Plan">
                      <SelectValue placeholder="Pick a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} · {formatCurrency(plan.price)} / {plan.durationDays}d
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    disabled={!planId || planMutation.isPending}
                    onClick={() =>
                      run(planMutation.mutateAsync(planId), "Failed to assign the plan", () =>
                        setPlanId(""),
                      )
                    }
                  >
                    Assign
                  </Button>
                </div>
              </section>

              {/* Trial */}
              <section className="space-y-2 rounded-lg border p-3">
                <h3 className="flex items-center gap-2 text-sm font-medium">
                  <CalendarPlus className="size-4" aria-hidden="true" />
                  Extend trial
                </h3>
                <p className="text-xs text-muted-foreground">
                  Adds days from the later of today or the current trial end. An expired agency
                  is put back on trial.
                </p>
                <div className="flex items-end gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="trial-days" className="text-xs">
                      Days
                    </Label>
                    <Input
                      id="trial-days"
                      type="number"
                      min={1}
                      max={365}
                      value={trialDays}
                      onChange={(event) => setTrialDays(event.target.value)}
                      className="w-24"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      trialMutation.isPending ||
                      !/^\d+$/.test(trialDays) ||
                      Number(trialDays) < 1 ||
                      Number(trialDays) > 365
                    }
                    onClick={() =>
                      run(trialMutation.mutateAsync(trialDays), "Failed to extend the trial", () =>
                        setTrialDays("7"),
                      )
                    }
                  >
                    Extend
                  </Button>
                </div>
              </section>

              {/* Users */}
              <section>
                <h3 className="mb-2 text-sm font-medium">Users</h3>
                <ul className="divide-y rounded-lg border">
                  {detail.users.map((user) => (
                    <li key={user.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {USER_ROLE_LABELS[user.role]}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Plan history */}
              {detail.planHistories.length > 0 && (
                <section>
                  <h3 className="mb-2 text-sm font-medium">Plan history</h3>
                  <ol className="space-y-2 rounded-lg border p-3">
                    {detail.planHistories.map((entry) => (
                      <li key={entry.id} className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(entry.assignedAt)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {PLAN_ACTION_LABELS[entry.action] ?? entry.action}
                        </Badge>
                        <span>{entry.plan?.name ?? "—"}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AgencyDetailSheet;
