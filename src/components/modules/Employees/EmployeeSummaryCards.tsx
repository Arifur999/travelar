"use client";

import { useQuery } from "@tanstack/react-query";
import { Banknote, CalendarCheck, Users } from "lucide-react";
import StatsCard from "@/components/shared/StatsCard";
import { formatCurrency, formatNumber } from "@/lib/format";
import { getAttendanceSummary, getEmployeeDashboard } from "@/services/employee.services";

/** The four headline figures for the Employees section. */
const EmployeeSummaryCards = () => {
  const { data: dashboardData } = useQuery({
    queryKey: ["employee-dashboard"],
    queryFn: () => getEmployeeDashboard(),
  });

  const { data: attendanceSummaryData } = useQuery({
    queryKey: ["attendance-summary"],
    queryFn: () => getAttendanceSummary(),
  });

  const summary = dashboardData?.data.summary;
  const attendanceSummary = attendanceSummaryData?.data;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Active staff"
        value={formatNumber(summary?.activeCount ?? 0)}
        icon={Users}
        accent="primary"
        hint={
          summary?.resignedCount
            ? `${formatNumber(summary.resignedCount)} resigned`
            : "Nobody has resigned"
        }
      />
      <StatsCard
        title="Salary paid"
        value={formatCurrency(summary?.totalSalary ?? 0)}
        icon={Banknote}
        accent="expense"
      />
      <StatsCard
        title="Bonus paid"
        value={formatCurrency(summary?.totalBonus ?? 0)}
        icon={Banknote}
        accent="ledger"
      />
      <StatsCard
        title="Attendance"
        value={`${formatNumber(attendanceSummary?.presentCount ?? 0)} present`}
        icon={CalendarCheck}
        accent="success"
        hint={
          attendanceSummary
            ? `${formatNumber(attendanceSummary.absentCount)} absent across ${formatNumber(attendanceSummary.daysRecorded)} days`
            : undefined
        }
      />
    </div>
  );
};

export default EmployeeSummaryCards;
