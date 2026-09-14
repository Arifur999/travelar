import type { Metadata } from "next";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import AdminAnnouncementsView from "@/components/modules/Admin/Announcements/AdminAnnouncementsView";
import PageHeader from "@/components/shared/PageHeader";
import { getAdminAnnouncements } from "@/services/support.services";

export const metadata: Metadata = { title: "Announcements" };

/** Announcements are few; one page of the newest fifty is the whole history. */
const QUERY_STRING = "limit=50&sortBy=createdAt&sortOrder=desc";

const AdminAnnouncementsPage = async () => {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["admin-announcements", QUERY_STRING],
    queryFn: () => getAdminAnnouncements(QUERY_STRING),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Notices shown to every agency's users, newest first."
      />

      <HydrationBoundary state={dehydrate(queryClient)}>
        <AdminAnnouncementsView queryString={QUERY_STRING} />
      </HydrationBoundary>
    </div>
  );
};

export default AdminAnnouncementsPage;
