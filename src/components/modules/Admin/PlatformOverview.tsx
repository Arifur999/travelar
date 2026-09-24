"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  RiAlertLine,
  RiArrowUpCircleLine,
  RiBuilding2Line,
  RiLifebuoyLine,
  RiWallet3Line,
} from "@remixicon/react";
import Loader from "@/components/shared/Loader";
import StatsCard from "@/components/shared/StatsCard";
import StatusBadge from "@/components/shared/cell/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";
import { getPlatformStats } from "@/services/admin.services";
import SubscriptionLifecycleCard from "./SubscriptionLifecycleCard";
import {
  AGENCY_STATUS_LABELS,
  AGENCY_STATUS_TONES,
  type AgencyStatus,
} from "@/types/enums.types";

const STATUS_ORDER: AgencyStatus[] = ["TRIAL", "ACTIVE", "EXPIRED", "SUSPENDED"];

const PlatformOverview = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: () => getPlatformStats(),
  });

  const stats = data?.data;

  if (isLoading || !stats) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader size={32} label="Loading platform stats" />
      </div>
    );
  }

  const active = stats.byStatus.ACTIVE ?? 0;
  const trial = stats.byStatus.TRIAL ?? 0;
  // Of the agencies that have finished evaluating, how many are paying. null
  // rather than 0% when nobody has left a trial yet — no data is not "0%".
  const decided = stats.totalAgencies - trial;
  const conversion = decided > 0 ? (active / decided) * 100 : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Agencies"
          value={formatNumber(stats.totalAgencies)}
          icon={RiBuilding2Line}
          accent="primary"
          hint={`${formatNumber(active)} paying, ${formatNumber(trial)} on trial`}
        />
        <StatsCard
          title="MRR"
          value={formatCurrency(stats.mrr)}
          icon={RiArrowUpCircleLine}
          accent="success"
          // Every active plan normalised to a 30-day month, so a yearly plan
          // counts a twelfth of its price rather than all of it.
          hint="Active plans normalised to 30 days"
        />
        <StatsCard
          title="Revenue to date"
          value={formatCurrency(stats.totalRevenue)}
          icon={RiWallet3Line}
          accent="ledger"
          hint={`${formatCurrency(stats.onlineRevenue)} online · ${formatCurrency(stats.manualRevenue)} manual`}
        />
        <StatsCard
          title="Open tickets"
          value={formatNumber(stats.openTickets)}
          icon={RiLifebuoyLine}
          accent={stats.openTickets > 0 ? "expense" : "success"}
          hint="Open or in progress"
        />
      </div>

      {stats.expiringSoon > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4 sm:flex-row sm:items-center">
          <RiAlertLine className="size-5 shrink-0 text-warning" aria-hidden="true" />
          <p className="flex-1 text-sm">
            <span className="font-medium">
              {formatNumber(stats.expiringSoon)}{" "}
              {stats.expiringSoon === 1 ? "subscription ends" : "subscriptions end"} within 7
              days.
            </span>{" "}
            <span className="text-muted-foreground">
              Those agencies drop to read-only when they lapse.
            </span>
          </p>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/dashboard/agencies?status=ACTIVE">Review</Link>
          </Button>
        </div>
      )}

      <SubscriptionLifecycleCard />

      <Card>
        <CardHeader>
          <CardTitle>Agencies by status</CardTitle>
          <CardDescription>
            {conversion === null
              ? "Nobody has finished a trial yet, so there is no conversion rate to show."
              : `${formatPercent(conversion)} of agencies past their trial are paying.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {STATUS_ORDER.map((status) => {
              const count = stats.byStatus[status] ?? 0;
              const share = stats.totalAgencies > 0 ? (count / stats.totalAgencies) * 100 : 0;

              return (
                <li key={status} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      label={AGENCY_STATUS_LABELS[status]}
                      tone={AGENCY_STATUS_TONES[status]}
                    />
                    <span className="ml-auto text-sm font-medium tabular-nums">
                      {formatNumber(count)}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
                  </div>
                  {count > 0 && (
                    <Link
                      href={`/admin/dashboard/agencies?status=${status}`}
                      className="text-xs text-primary hover:underline"
                    >
                      View {AGENCY_STATUS_LABELS[status].toLowerCase()} agencies
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlatformOverview;
