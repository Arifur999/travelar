import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate, getInitials } from "@/lib/format";
import { getMyFeatures, getUserInfo } from "@/services/auth.services";
import {
  AGENCY_STATUS_LABELS,
  PLAN_FEATURE_LABELS,
  USER_ROLE_LABELS,
} from "@/types/enums.types";

export const metadata: Metadata = { title: "My profile" };

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
    <dt className="text-sm text-muted-foreground">{label}</dt>
    <dd className="text-sm font-medium">{value}</dd>
  </div>
);

const MyProfilePage = async () => {
  const [userInfo, myFeatures] = await Promise.all([getUserInfo(), getMyFeatures()]);

  if (!userInfo) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="size-14">
            <AvatarFallback className="bg-primary/10 text-lg font-medium text-primary">
              {getInitials(userInfo.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{userInfo.name}</CardTitle>
            <CardDescription>{userInfo.email}</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <dl className="divide-y">
            <Row label="Role" value={USER_ROLE_LABELS[userInfo.role]} />
            <Row
              label="Email verified"
              value={userInfo.emailVerified ? "Yes" : "No"}
            />
            <Row label="Account status" value={userInfo.status} />
          </dl>
        </CardContent>
      </Card>

      {userInfo.agency && (
        <Card>
          <CardHeader>
            <CardTitle>{userInfo.agency.name}</CardTitle>
            <CardDescription>Your agency workspace.</CardDescription>
          </CardHeader>

          <CardContent>
            <dl className="divide-y">
              <Row
                label="Subscription"
                value={AGENCY_STATUS_LABELS[userInfo.agency.status]}
              />
              <Row label="Plan" value={myFeatures?.planName ?? "No plan — trial"} />
              {myFeatures?.isTrial && (
                <Row label="Trial ends" value={formatDate(myFeatures.trialEndsAt)} />
              )}
              {!myFeatures?.isTrial && myFeatures?.subscriptionEndsAt && (
                <Row
                  label="Renews / expires"
                  value={formatDate(myFeatures.subscriptionEndsAt)}
                />
              )}
              {userInfo.agency.phone && <Row label="Phone" value={userInfo.agency.phone} />}
            </dl>

            <Separator className="my-4" />

            <p className="mb-2 text-sm text-muted-foreground">Unlocked modules</p>
            {myFeatures && myFeatures.features.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {myFeatures.features.map((feature) => (
                  <Badge key={feature} variant="secondary">
                    {PLAN_FEATURE_LABELS[feature]}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm">
                No modules are unlocked. Customers and collections stay available; everything
                else needs an active plan.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyProfilePage;
