import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import AnnouncementsView from "@/components/modules/Support/AnnouncementsView";
import PageHeader from "@/components/shared/PageHeader";
import { getMyAnnouncements } from "@/services/support.services";

export const metadata: Metadata = { title: "Announcements" };

const AnnouncementsPage = async () => {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["my-announcements"],
    queryFn: () => getMyAnnouncements(),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Notices from the platform. Only live announcements appear, and read state is tracked per person."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <AnnouncementsView />
      </HydrationBoundary>
    </div>
  );
};

export default AnnouncementsPage;
