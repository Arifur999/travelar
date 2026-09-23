"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Cell, Pie, PieChart } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCurrency, formatDate, formatNumber, formatPercent } from "@/lib/format";
import { buildStatusSlices } from "@/lib/hotelCharts";
import { getHotelSummary } from "@/services/hotel.services";

/**
 * The status colours, not chart colours: a slice has to match the badge on
 * the row it counts, or the same booking is two colours on one screen.
 */
const chartConfig = {
  RESERVED: { label: "Reserved", color: "var(--warning)" },
  CONFIRMED: { label: "Confirmed", color: "var(--success)" },
  COMPLETED: { label: "Checked out", color: "var(--info)" },
  CANCELLED: { label: "Cancelled", color: "var(--destructive)" },
} satisfies ChartConfig;

/**
 * Where the bookings stand, and who is arriving next.
 *
 * The arrivals list is the operational half: a guest checking in on Thursday
 * still owing money is something the desk wants to see before Thursday.
 */
const HotelOverview = () => {
  const { data } = useQuery({
    queryKey: ["hotel-summary"],
    queryFn: () => getHotelSummary(),
  });

  const summary = data?.data;
  const breakdown = useMemo(() => summary?.statusBreakdown ?? {}, [summary]);
  const slices = useMemo(() => buildStatusSlices(breakdown), [breakdown]);
  const arriving = summary?.arriving ?? [];

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Where the bookings stand</CardTitle>
          <CardDescription>
            {summary
              ? `${formatNumber(summary.totalRooms)} rooms for ${formatNumber(summary.totalGuests)} guests, across every live booking.`
              : "Every booking, by status."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {slices.length === 0 ? (
            <div className="flex h-50 items-center justify-center rounded-lg border border-dashed">
              <p className="text-sm text-muted-foreground">No bookings yet.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <ChartContainer config={chartConfig} className="aspect-square h-50 shrink-0">
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent nameKey="label" hideLabel />}
                  />
                  <Pie data={slices} dataKey="count" nameKey="label" innerRadius={45}>
                    {slices.map((slice) => (
                      <Cell key={slice.status} fill={`var(--color-${slice.status})`} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>

              <ul className="w-full space-y-3">
                {slices.map((slice) => (
                  <li key={slice.status} className="flex items-center gap-3 text-sm">
                    <span
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ background: `var(--color-${slice.status})` }}
                      aria-hidden="true"
                    />
                    <span className="flex-1">{slice.label}</span>
                    <span className="font-medium tabular-nums">{formatNumber(slice.count)}</span>
                    <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
                      {formatPercent(slice.share, 0)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Arriving next</CardTitle>
          <CardDescription>The next check-ins, soonest first.</CardDescription>
        </CardHeader>

        <CardContent>
          {arriving.length === 0 ? (
            <div className="flex h-50 items-center justify-center rounded-lg border border-dashed">
              <p className="text-sm text-muted-foreground">Nobody is checking in yet.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {arriving.map((booking) => (
                <li key={booking.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{booking.guestName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {booking.hotelName}, {booking.city} · {formatNumber(booking.nights)}{" "}
                      {booking.nights === 1 ? "night" : "nights"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm whitespace-nowrap">{formatDate(booking.checkIn)}</p>
                    <p
                      className={
                        booking.dueAmount > 0
                          ? "text-xs tabular-nums text-destructive"
                          : "text-xs tabular-nums text-success"
                      }
                    >
                      {booking.dueAmount > 0
                        ? `${formatCurrency(booking.dueAmount)} due`
                        : "Paid"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HotelOverview;
