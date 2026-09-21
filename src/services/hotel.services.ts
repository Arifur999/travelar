"use server";

import { httpClient } from "@/lib/axios/httpClient";
import {
  type IChangeHotelBookingStatusPayload,
  type ICreateHotelBookingPayload,
  type IHotelBooking,
  type IHotelBookingDetail,
  type IHotelBookingsListResponse,
  type IHotelSummary,
  type IRecordHotelPaymentPayload,
  type IUpdateHotelBookingPayload,
} from "@/types/hotel.types";

export const getHotelBookings = async (queryString?: string) => {
  return await httpClient.get<IHotelBookingsListResponse>(
    `/hotels${queryString ? `?${queryString}` : ""}`,
  );
};

export const getHotelBookingById = async (id: string) => {
  return await httpClient.get<IHotelBookingDetail>(`/hotels/${id}`);
};

/** Rooms, guests, money and who is arriving next. */
export const getHotelSummary = async () => {
  return await httpClient.get<IHotelSummary>("/hotels/summary");
};

export const createHotelBooking = async (payload: ICreateHotelBookingPayload) => {
  return await httpClient.post<IHotelBooking>("/hotels", payload);
};

export const updateHotelBooking = async (id: string, payload: IUpdateHotelBookingPayload) => {
  return await httpClient.patch<IHotelBookingDetail>(`/hotels/${id}`, payload);
};

export const changeHotelBookingStatus = async (
  id: string,
  payload: IChangeHotelBookingStatusPayload,
) => {
  return await httpClient.patch<IHotelBookingDetail>(`/hotels/${id}/status`, payload);
};

export const recordHotelPayment = async (id: string, payload: IRecordHotelPaymentPayload) => {
  return await httpClient.post<IHotelBookingDetail>(`/hotels/${id}/payments`, payload);
};

/** AGENCY_ADMIN only. */
export const deleteHotelPayment = async (id: string, paymentId: string) => {
  return await httpClient.delete<IHotelBookingDetail>(`/hotels/${id}/payments/${paymentId}`);
};

/** AGENCY_ADMIN only. */
export const deleteHotelBooking = async (id: string) => {
  return await httpClient.delete<null>(`/hotels/${id}`);
};
