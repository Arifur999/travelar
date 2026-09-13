"use server";

import { httpClient } from "@/lib/axios/httpClient";
import {
  type IAssignRoomPayload,
  type IChangeHajjBookingStatusPayload,
  type ICreateHajjBatchPayload,
  type ICreateHajjBookingPayload,
  type ICreateHajjPackagePayload,
  type ICreateHajjRoomPayload,
  type IHajjBatch,
  type IHajjBatchSummary,
  type IHajjBooking,
  type IHajjBookingDetail,
  type IHajjBookingsListResponse,
  type IHajjPackage,
  type IHajjRoom,
  type IRecordHajjPaymentPayload,
  type IUpdateHajjBatchPayload,
} from "@/types/hajj.types";
import { type DocumentStatus } from "@/types/enums.types";

/* -------------------------------- packages ------------------------------- */

export const getHajjPackages = async (queryString?: string) => {
  try {
    return await httpClient.get<IHajjPackage[]>(
      `/hajj/packages${queryString ? `?${queryString}` : ""}`,
    );
  } catch (error) {
    console.error("Error fetching hajj packages:", error);
    throw error;
  }
};

export const createHajjPackage = async (payload: ICreateHajjPackagePayload) => {
  try {
    return await httpClient.post<IHajjPackage>("/hajj/packages", payload);
  } catch (error) {
    console.error("Error creating hajj package:", error);
    throw error;
  }
};

export const updateHajjPackage = async (
  id: string,
  payload: Partial<ICreateHajjPackagePayload>,
) => {
  try {
    return await httpClient.patch<IHajjPackage>(`/hajj/packages/${id}`, payload);
  } catch (error) {
    console.error("Error updating hajj package:", error);
    throw error;
  }
};

export const deleteHajjPackage = async (id: string) => {
  try {
    return await httpClient.delete<null>(`/hajj/packages/${id}`);
  } catch (error) {
    console.error("Error deleting hajj package:", error);
    throw error;
  }
};

/* -------------------------------- batches -------------------------------- */

export const getHajjBatches = async (queryString?: string) => {
  try {
    return await httpClient.get<IHajjBatch[]>(
      `/hajj/batches${queryString ? `?${queryString}` : ""}`,
    );
  } catch (error) {
    console.error("Error fetching hajj batches:", error);
    throw error;
  }
};

/** Seats, revenue, status breakdown and room occupancy for one batch. */
export const getHajjBatchSummary = async (id: string) => {
  try {
    return await httpClient.get<IHajjBatchSummary>(`/hajj/batches/${id}/summary`);
  } catch (error) {
    console.error("Error fetching batch summary:", error);
    throw error;
  }
};

export const createHajjBatch = async (payload: ICreateHajjBatchPayload) => {
  try {
    return await httpClient.post<IHajjBatch>("/hajj/batches", payload);
  } catch (error) {
    console.error("Error creating hajj batch:", error);
    throw error;
  }
};

export const updateHajjBatch = async (id: string, payload: IUpdateHajjBatchPayload) => {
  try {
    return await httpClient.patch<IHajjBatch>(`/hajj/batches/${id}`, payload);
  } catch (error) {
    console.error("Error updating hajj batch:", error);
    throw error;
  }
};

export const deleteHajjBatch = async (id: string) => {
  try {
    return await httpClient.delete<null>(`/hajj/batches/${id}`);
  } catch (error) {
    console.error("Error deleting hajj batch:", error);
    throw error;
  }
};

/* --------------------------------- rooms --------------------------------- */

export const getHajjRooms = async (batchId: string) => {
  try {
    return await httpClient.get<IHajjRoom[]>(
      `/hajj/rooms?batchId=${encodeURIComponent(batchId)}`,
    );
  } catch (error) {
    console.error("Error fetching hajj rooms:", error);
    throw error;
  }
};

export const createHajjRoom = async (payload: ICreateHajjRoomPayload) => {
  try {
    return await httpClient.post<IHajjRoom>("/hajj/rooms", payload);
  } catch (error) {
    console.error("Error creating hajj room:", error);
    throw error;
  }
};

export const deleteHajjRoom = async (id: string) => {
  try {
    return await httpClient.delete<null>(`/hajj/rooms/${id}`);
  } catch (error) {
    console.error("Error deleting hajj room:", error);
    throw error;
  }
};

/* -------------------------------- bookings ------------------------------- */

export const getHajjBookings = async (queryString?: string) => {
  try {
    return await httpClient.get<IHajjBookingsListResponse>(
      `/hajj/bookings${queryString ? `?${queryString}` : ""}`,
    );
  } catch (error) {
    console.error("Error fetching hajj bookings:", error);
    throw error;
  }
};

export const getHajjBookingById = async (id: string) => {
  try {
    return await httpClient.get<IHajjBookingDetail>(`/hajj/bookings/${id}`);
  } catch (error) {
    console.error("Error fetching hajj booking:", error);
    throw error;
  }
};

export const createHajjBooking = async (payload: ICreateHajjBookingPayload) => {
  try {
    return await httpClient.post<IHajjBooking>("/hajj/bookings", payload);
  } catch (error) {
    console.error("Error creating hajj booking:", error);
    throw error;
  }
};

export const changeHajjBookingStatus = async (
  id: string,
  payload: IChangeHajjBookingStatusPayload,
) => {
  try {
    return await httpClient.patch<IHajjBookingDetail>(`/hajj/bookings/${id}/status`, payload);
  } catch (error) {
    console.error("Error changing booking status:", error);
    throw error;
  }
};

/** Pass `roomId: null` to clear an assignment and free the bed. */
export const assignHajjRoom = async (id: string, payload: IAssignRoomPayload) => {
  try {
    return await httpClient.patch<IHajjBookingDetail>(`/hajj/bookings/${id}/room`, payload);
  } catch (error) {
    console.error("Error assigning room:", error);
    throw error;
  }
};

export const setHajjDocumentStatus = async (
  id: string,
  documentId: string,
  documentStatus: DocumentStatus,
) => {
  try {
    return await httpClient.patch<IHajjBookingDetail>(
      `/hajj/bookings/${id}/documents/${documentId}`,
      { status: documentStatus },
    );
  } catch (error) {
    console.error("Error updating hajj document:", error);
    throw error;
  }
};

export const recordHajjPayment = async (id: string, payload: IRecordHajjPaymentPayload) => {
  try {
    return await httpClient.post<IHajjBookingDetail>(`/hajj/bookings/${id}/payments`, payload);
  } catch (error) {
    console.error("Error recording hajj payment:", error);
    throw error;
  }
};

/** AGENCY_ADMIN only. */
export const deleteHajjPayment = async (id: string, paymentId: string) => {
  try {
    return await httpClient.delete<IHajjBookingDetail>(
      `/hajj/bookings/${id}/payments/${paymentId}`,
    );
  } catch (error) {
    console.error("Error deleting hajj payment:", error);
    throw error;
  }
};

/** AGENCY_ADMIN only. */
export const deleteHajjBooking = async (id: string) => {
  try {
    return await httpClient.delete<null>(`/hajj/bookings/${id}`);
  } catch (error) {
    console.error("Error deleting hajj booking:", error);
    throw error;
  }
};
