"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { RiAddLine, RiDeleteBin6Line } from "@remixicon/react";
import { toast } from "sonner";
import {
  createHajjRoomAction,
  deleteHajjRoomAction,
} from "@/app/(dashboardLayout)/dashboard/hajj/_action";
import Loader from "@/components/shared/Loader";
import AppField from "@/components/shared/form/AppField";
import AppSubmitButton from "@/components/shared/form/AppSubmitButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatNumber } from "@/lib/format";
import { getHajjBatchSummary, getHajjRooms } from "@/services/hajj.services";
import {
  hajjRoomFieldsZodSchema,
  type IHajjRoomFormValues,
} from "@/zod/hajj.validation";
import { HAJJ_HOTEL_TYPE_OPTIONS, type HajjHotelType } from "@/types/enums.types";
import { type IHajjBatch } from "@/types/hajj.types";

interface HajjRoomsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: IHajjBatch;
}

/**
 * Rooms for one batch, plus that batch's live summary.
 *
 * Occupancy counts live bookings only, so a cancelled pilgrim's bed shows as
 * free again — the previous implementation left cancelled pilgrims holding both
 * a seat and a room forever.
 */
const HajjRoomsDialog = ({ open, onOpenChange, batch }: HajjRoomsDialogProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: roomsData, isLoading } = useQuery({
    queryKey: ["hajj-rooms", batch.id],
    queryFn: () => getHajjRooms(batch.id),
    enabled: open,
  });

  const { data: summaryData } = useQuery({
    queryKey: ["hajj-batch-summary", batch.id],
    queryFn: () => getHajjBatchSummary(batch.id),
    enabled: open,
  });

  const rooms = roomsData?.data ?? [];
  const summary = summaryData?.data;

  const { mutateAsync: createRoom, isPending } = useMutation({
    mutationFn: (values: IHajjRoomFormValues) => createHajjRoomAction(values),
  });

  const { mutateAsync: removeRoom } = useMutation({
    mutationFn: (id: string) => deleteHajjRoomAction(id),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["hajj-rooms", batch.id] });
    void queryClient.invalidateQueries({ queryKey: ["hajj-batch-summary", batch.id] });
    router.refresh();
  };

  const defaultValues: IHajjRoomFormValues = {
    batchId: batch.id,
    hotelType: "MAKKAH",
    roomNumber: "",
    capacity: "",
  };

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      const result = await createRoom(value);

      if (!result.success) {
        toast.error(result.message || "Failed to add room");
        return;
      }

      toast.success(result.message || "Room added");
      form.reset();
      invalidate();
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{batch.name} — rooms</DialogTitle>
          <DialogDescription>
            Hotel rooms for this departure. Occupancy counts live bookings, so cancelling a
            pilgrim frees their bed.
          </DialogDescription>
        </DialogHeader>

        {summary && (
          <dl className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground">Seats</dt>
              <dd className="font-medium tabular-nums">
                {formatNumber(summary.bookedSeats)}/{formatNumber(summary.seatCapacity)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Makkah</dt>
              <dd className="font-medium tabular-nums">
                {summary.roomOccupancy.makkah.occupied}/{summary.roomOccupancy.makkah.total}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Madinah</dt>
              <dd className="font-medium tabular-nums">
                {summary.roomOccupancy.madinah.occupied}/{summary.roomOccupancy.madinah.total}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Outstanding</dt>
              <dd className="font-medium tabular-nums">{formatCurrency(summary.totalDue)}</dd>
            </div>
          </dl>
        )}

        {isLoading ? (
          <div className="flex h-24 items-center justify-center">
            <Loader size={28} label="Loading rooms" />
          </div>
        ) : (
          <ul className="space-y-2">
            {rooms.length === 0 && (
              <li className="rounded-lg border p-3 text-sm text-muted-foreground">
                No rooms yet.
              </li>
            )}
            {rooms.map((room) => (
              <li
                key={room.id}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
              >
                <Badge variant="outline">
                  {room.hotelType === "MAKKAH" ? "Makkah" : "Madinah"}
                </Badge>
                <span className="font-medium">{room.roomNumber}</span>
                <span className="text-muted-foreground">sleeps {room.capacity}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="ml-auto size-7 text-muted-foreground hover:text-destructive"
                  onClick={async () => {
                    const result = await removeRoom(room.id);
                    if (!result.success) {
                      // Refused while a pilgrim is still assigned to it.
                      toast.error(result.message || "Failed to delete room");
                      return;
                    }
                    toast.success("Room removed");
                    invalidate();
                  }}
                  aria-label={`Remove room ${room.roomNumber}`}
                >
                  <RiDeleteBin6Line className="size-3.5" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <form
          method="POST"
          action="#"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-3 rounded-lg border p-3"
        >
          <p className="text-xs font-medium text-muted-foreground">Add a room</p>

          <div className="grid grid-cols-3 gap-2">
            <form.Field name="hotelType">
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor={field.name}>Hotel</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(next) => field.handleChange(next as HajjHotelType)}
                    disabled={isPending}
                  >
                    <SelectTrigger id={field.name} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HAJJ_HOTEL_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>

            <form.Field
              name="roomNumber"
              validators={{ onChange: hajjRoomFieldsZodSchema.shape.roomNumber }}
            >
              {(field) => (
                <AppField field={field} label="Room" placeholder="304" disabled={isPending} />
              )}
            </form.Field>

            <form.Field
              name="capacity"
              validators={{ onChange: hajjRoomFieldsZodSchema.shape.capacity }}
            >
              {(field) => (
                <AppField
                  field={field}
                  label="Sleeps"
                  type="number"
                  placeholder="4"
                  disabled={isPending}
                />
              )}
            </form.Field>
          </div>

          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
              <AppSubmitButton
                isPending={isSubmitting || isPending}
                pendingLabel="Adding..."
                disabled={!canSubmit}
                className="w-auto"
              >
                <RiAddLine className="size-4" aria-hidden="true" />
                Add room
              </AppSubmitButton>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default HajjRoomsDialog;
