"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { RiMegaphoneLine } from "@remixicon/react";
import { toast } from "sonner";
import {
  createAnnouncementAction,
  updateAnnouncementAction,
} from "@/app/(dashboardLayout)/admin/dashboard/_action";
import Loader from "@/components/shared/Loader";
import AppField from "@/components/shared/form/AppField";
import AppSubmitButton from "@/components/shared/form/AppSubmitButton";
import StatusBadge from "@/components/shared/cell/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getAdminAnnouncements } from "@/services/support.services";
import {
  ANNOUNCEMENT_TYPE_LABELS,
  ANNOUNCEMENT_TYPE_OPTIONS,
  ANNOUNCEMENT_TYPE_TONES,
  type AnnouncementType,
} from "@/types/enums.types";
import {
  announcementFieldsZodSchema,
  type IAnnouncementFormValues,
} from "@/zod/support.validation";

const AdminAnnouncementsView = ({ queryString }: { queryString: string }) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-announcements", queryString],
    queryFn: () => getAdminAnnouncements(queryString),
  });

  const announcements = data?.data ?? [];

  const { mutateAsync: publish, isPending } = useMutation({
    mutationFn: (values: IAnnouncementFormValues) => createAnnouncementAction(values),
  });

  const { mutateAsync: toggle, isPending: isToggling } = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateAnnouncementAction(id, { isActive }),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin-announcements"] });
    void queryClient.invalidateQueries({ queryKey: ["my-announcements"] });
    void queryClient.refetchQueries({ queryKey: ["admin-announcements"], type: "active" });
    router.refresh();
  };

  const defaultValues: IAnnouncementFormValues = { title: "", message: "", type: "INFO" };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = await publish(value);
      if (!result.success) {
        toast.error(result.message || "Failed to publish");
        return;
      }
      toast.success(result.message || "Published");
      form.reset();
      invalidate();
    },
  });

  const handleToggle = async (id: string, isActive: boolean) => {
    const result = await toggle({ id, isActive });
    if (!result.success) {
      toast.error(result.message || "Failed to update");
      return;
    }
    toast.success(isActive ? "Announcement republished" : "Announcement withdrawn");
    invalidate();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Publish an announcement</CardTitle>
          <CardDescription>Every agency sees it until you withdraw it.</CardDescription>
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
            <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
              <form.Field
                name="title"
                validators={{ onChange: announcementFieldsZodSchema.shape.title }}
              >
                {(field) => <AppField field={field} label="Title" disabled={isPending} />}
              </form.Field>

              <form.Field name="type">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor={field.name}>Type</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(next) => field.handleChange(next as AnnouncementType)}
                      disabled={isPending}
                    >
                      <SelectTrigger id={field.name} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ANNOUNCEMENT_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>
            </div>

            <form.Field
              name="message"
              validators={{ onChange: announcementFieldsZodSchema.shape.message }}
            >
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor={field.name}>Message</Label>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    rows={3}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => field.handleChange(event.target.value)}
                    disabled={isPending}
                  />
                </div>
              )}
            </form.Field>

            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
              {([canSubmit, isSubmitting]) => (
                <AppSubmitButton
                  isPending={isSubmitting || isPending}
                  pendingLabel="Publishing..."
                  disabled={!canSubmit}
                  className="w-auto"
                >
                  <RiMegaphoneLine className="size-4" aria-hidden="true" />
                  Publish
                </AppSubmitButton>
              )}
            </form.Subscribe>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Published</CardTitle>
          <CardDescription>
            Withdrawing hides one from every agency without deleting it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-24 items-center justify-center">
              <Loader size={28} label="Loading announcements" />
            </div>
          ) : announcements.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nothing published.</p>
          ) : (
            <ul className="space-y-3">
              {announcements.map((item) => (
                <li
                  key={item.id}
                  className={cn("rounded-lg border p-3", !item.isActive && "bg-muted/30")}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge
                      label={ANNOUNCEMENT_TYPE_LABELS[item.type]}
                      tone={ANNOUNCEMENT_TYPE_TONES[item.type]}
                    />
                    <span className="flex-1 text-sm font-medium">{item.title}</span>
                    {item.isActive ? (
                      <StatusBadge label="Live" tone="success" />
                    ) : (
                      <StatusBadge label="Withdrawn" tone="neutral" />
                    )}
                  </div>
                  <p className="mt-2 text-sm whitespace-pre-wrap text-muted-foreground">
                    {item.message}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(item.createdAt)}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={isToggling}
                      onClick={() => handleToggle(item.id, !item.isActive)}
                    >
                      {item.isActive ? "Withdraw" : "Republish"}
                    </Button>
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

export default AdminAnnouncementsView;
