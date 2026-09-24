import { redirect } from "next/navigation";
import DashboardNavbar from "@/components/modules/Dashboard/DashboardNavbar";
import DashboardSidebar from "@/components/modules/Dashboard/DashboardSidebar";
import ServiceUnavailable from "@/components/modules/Dashboard/ServiceUnavailable";
import SubscriptionBanner from "@/components/modules/Dashboard/SubscriptionBanner";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getMyFeatures, loadSession } from "@/services/auth.services";

/**
 * The shell reads cookies through getUserInfo(), so it must never be statically
 * cached — otherwise the first user to render it is the one everybody sees.
 */
export const dynamic = "force-dynamic";

const DashboardLayout = async ({ children }: { children: React.ReactNode }) => {
  // proxy.ts already bounced anyone without a valid token. This is the second
  // line: the proxy trusts a locally-verified JWT, while this asks the API who
  // the user actually is — so a revoked or deleted account cannot ride a
  // still-unexpired token into the shell.
  const [session, myFeatures] = await Promise.all([loadSession(), getMyFeatures()]);

  // "Cannot ask" is not "signed out". Redirecting here on any missing user is
  // what made an API outage look like being logged out — and /login could not
  // help, because signing in needs the same API. Access is still refused; the
  // difference is only in what the user is told.
  if (session.outcome === "unavailable") return <ServiceUnavailable />;

  if (session.outcome === "unauthenticated") redirect("/login");

  const userInfo = session.user;

  return (
    <SidebarProvider>
      <DashboardSidebar userInfo={userInfo} myFeatures={myFeatures} />

      <SidebarInset className="min-w-0">
        <DashboardNavbar userInfo={userInfo} />

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6"
        >
          <div className="mx-auto w-full max-w-[1600px] space-y-6">
            <SubscriptionBanner myFeatures={myFeatures} role={userInfo.role} />
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default DashboardLayout;
