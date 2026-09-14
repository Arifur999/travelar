"use client";

import Link from "next/link";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateAgencyProfileAction } from "@/app/(dashboardLayout)/dashboard/settings/_action";
import Loader from "@/components/shared/Loader";
import StatusBadge from "@/components/shared/cell/StatusBadge";
import AppField from "@/components/shared/form/AppField";
import AppSubmitButton from "@/components/shared/form/AppSubmitButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { daysUntil, formatDate, formatNumber } from "@/lib/format";
import { getAgencyProfile } from "@/services/team.services";
import {
  AGENCY_STATUS_LABELS,
  AGENCY_STATUS_TONES,
  PLAN_FEATURE_LABELS,
} from "@/types/enums.types";
import { type IAgencyProfile } from "@/types/team.types";
import {
  agencyProfileFormZodSchema,
  type IAgencyProfileFormValues,
} from "@/zod/team.validation";

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-4 py-2.5">
    <dt className="text-sm text-muted-foreground">{label}</dt>
    <dd className="text-right text-sm font-medium">{value}</dd>
  </div>
);

const toFormValues = (profile: IAgencyProfile): IAgencyProfileFormValues => ({
  name: profile.name,
  email: profile.email ?? "",
  phone: profile.phone ?? "",
  address: profile.address ?? "",
  logo: profile.logo ?? "",
});

const ProfileForm = ({ profile, canEdit }: { profile: IAgencyProfile; canEdit: boolean }) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (values: IAgencyProfileFormValues) => updateAgencyProfileAction(values),
  });

  const form = useForm({
    defaultValues: toFormValues(profile),
    onSubmit: async ({ value }) => {
      const result = await mutateAsync(value);

      if (!result.success) {
        toast.error(result.message || "Failed to save the profile");
        return;
      }

      toast.success(result.message || "Profile saved");
      // Reset to what the API stored, so the form is clean again and shows the
      // trimmed values rather than what was typed.
      form.reset(toFormValues(result.data));
      void queryClient.invalidateQueries({ queryKey: ["agency-profile"] });
      void queryClient.refetchQueries({ queryKey: ["agency-profile"], type: "active" });
      // The sidebar header shows the agency name from the server layout.
      router.refresh();
    },
  });

  const disabled = !canEdit || isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
        <CardDescription>
          {canEdit
            ? "Leave a field blank to remove it."
            : "Only an agency admin can change these details."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          method="POST"
          action="#"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field name="name" validators={{ onChange: agencyProfileFormZodSchema.shape.name }}>
            {(field) => <AppField field={field} label="Agency name" disabled={disabled} />}
          </form.Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field name="email" validators={{ onChange: agencyProfileFormZodSchema.shape.email }}>
              {(field) => (
                <AppField
                  field={field}
                  label="Contact email"
                  type="email"
                  disabled={disabled}
                  hint="Shown to customers. Not a login."
                />
              )}
            </form.Field>
            <form.Field name="phone" validators={{ onChange: agencyProfileFormZodSchema.shape.phone }}>
              {(field) => <AppField field={field} label="Phone" type="tel" disabled={disabled} />}
            </form.Field>
          </div>

          <form.Field name="address" validators={{ onChange: agencyProfileFormZodSchema.shape.address }}>
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name}>Address</Label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  rows={3}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  disabled={disabled}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="logo" validators={{ onChange: agencyProfileFormZodSchema.shape.logo }}>
            {(field) => (
              <AppField
                field={field}
                label="Logo URL"
                placeholder="https://..."
                disabled={disabled}
                hint="A link to a hosted image."
              />
            )}
          </form.Field>

          {canEdit && (
            <div className="flex justify-end">
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting, state.isDirty] as const}
              >
                {([canSubmit, isSubmitting, isDirty]) => (
                  <AppSubmitButton
                    isPending={isSubmitting || isPending}
                    pendingLabel="Saving..."
                    disabled={!canSubmit || !isDirty}
                    className="w-auto"
                  >
                    Save changes
                  </AppSubmitButton>
                )}
              </form.Subscribe>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

const AgencyProfileView = ({ canEdit }: { canEdit: boolean }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["agency-profile"],
    queryFn: () => getAgencyProfile(),
  });

  const profile = data?.data;

  if (isLoading && !profile) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader size={28} label="Loading the agency profile" />
      </div>
    );
  }

  if (!profile) {
    return <p className="text-sm text-muted-foreground">The agency profile could not be loaded.</p>;
  }

  const endsAt = profile.status === "TRIAL" ? profile.trialEndsAt : profile.subscriptionEndsAt;
  const daysLeft = daysUntil(endsAt);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <ProfileForm profile={profile} canEdit={canEdit} />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y">
              <Row
                label="Status"
                value={
                  <StatusBadge
                    label={AGENCY_STATUS_LABELS[profile.status]}
                    tone={AGENCY_STATUS_TONES[profile.status]}
                  />
                }
              />
              <Row label="Plan" value={profile.plan?.name ?? "No plan"} />
              {endsAt && (
                <Row
                  label={profile.status === "TRIAL" ? "Trial ends" : "Paid until"}
                  value={
                    <span>
                      {formatDate(endsAt)}
                      {daysLeft !== null && daysLeft >= 0 && (
                        <span className="block text-xs font-normal text-muted-foreground">
                          {daysLeft === 0 ? "today" : `in ${formatNumber(daysLeft)} days`}
                        </span>
                      )}
                    </span>
                  }
                />
              )}
              <Row label="Member since" value={formatDate(profile.createdAt)} />
            </dl>
            {profile.plan && profile.plan.features.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {profile.plan.features.map((feature) => (
                  <Badge key={feature} variant="secondary" className="text-xs">
                    {PLAN_FEATURE_LABELS[feature]}
                  </Badge>
                ))}
              </div>
            )}
            {canEdit && (
              <Button asChild variant="outline" size="sm" className="mt-4 w-full">
                <Link href="/dashboard/billing">Manage billing</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="divide-y">
              <Row label="Members" value={formatNumber(profile.team.total)} />
              <Row label="Admins" value={formatNumber(profile.team.admins)} />
              <Row label="Staff" value={formatNumber(profile.team.staff)} />
              {profile.team.blocked > 0 && (
                <Row label="Blocked" value={formatNumber(profile.team.blocked)} />
              )}
            </dl>
            <Button asChild variant="outline" size="sm" className="mt-4 w-full">
              <Link href="/dashboard/team">{canEdit ? "Manage team" : "View team"}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgencyProfileView;
