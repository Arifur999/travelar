import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { ShieldCheck, UserRoundX, Users, UsersRound } from "lucide-react";
import TeamTable from "@/components/modules/Team/TeamTable";
import PageHeader from "@/components/shared/PageHeader";
import StatsCard from "@/components/shared/StatsCard";
import { formatNumber } from "@/lib/format";
import { buildQueryString, type PageSearchParams } from "@/lib/queryString";
import { getUserInfo } from "@/services/auth.services";
import { getAgencyProfile, getTeamMembers } from "@/services/team.services";
import { type ApiResponse } from "@/types/api.types";
import { type IAgencyProfile } from "@/types/team.types";

export const metadata: Metadata = { title: "Team" };

const TeamPage = async ({ searchParams }: { searchParams: PageSearchParams }) => {
  const queryString = buildQueryString(await searchParams);

  const queryClient = new QueryClient();

  const [userInfo] = await Promise.all([
    getUserInfo(),
    queryClient.prefetchQuery({
      queryKey: ["team", queryString],
      queryFn: () => getTeamMembers(queryString),
    }),
    queryClient.prefetchQuery({
      queryKey: ["agency-profile"],
      queryFn: () => getAgencyProfile(),
    }),
  ]);

  if (!userInfo) notFound();

  // Read back from the cache rather than awaited directly: prefetchQuery never
  // throws, so a failed profile call degrades to no counts instead of an error
  // page for a table that loaded fine.
  const profile = queryClient.getQueryData<ApiResponse<IAgencyProfile>>(["agency-profile"])?.data;
  const team = profile?.team;

  const viewer = {
    id: userInfo.id,
    role: userInfo.role,
    isOwner: team?.ownerId === userInfo.id,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="Who can sign in to this agency. Admins manage staff; only the owner manages other admins, and nobody changes their own access here."
      />

      {team && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Members" value={formatNumber(team.total)} icon={Users} />
          <StatsCard title="Admins" value={formatNumber(team.admins)} icon={ShieldCheck} accent="ledger" />
          <StatsCard title="Staff" value={formatNumber(team.staff)} icon={UsersRound} accent="hajj" />
          <StatsCard
            title="Blocked"
            value={formatNumber(team.blocked)}
            icon={UserRoundX}
            accent={team.blocked > 0 ? "destructive" : "primary"}
          />
        </div>
      )}

      <HydrationBoundary state={dehydrate(queryClient)}>
        <TeamTable initialQueryString={queryString} viewer={viewer} />
      </HydrationBoundary>
    </div>
  );
};

export default TeamPage;
