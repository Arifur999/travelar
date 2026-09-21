"use server";

import { httpClient } from "@/lib/axios/httpClient";
import {
  type IChangeTourBookingStatusPayload,
  type ICreateTourBookingPayload,
  type ICreateTourPackagePayload,
  type IRecordTourPaymentPayload,
  type ITourBooking,
  type ITourBookingDetail,
  type ITourBookingsListResponse,
  type ITourPackage,
  type ITourPackageDetail,
  type ITourSummary,
  type IUpdateTourBookingPayload,
  type IUpdateTourPackagePayload,
} from "@/types/tour.types";

/* --------------------------------- tours --------------------------------- */

export const getTours = async (queryString?: string) => {
  return await httpClient.get<ITourPackage[]>(`/tours${queryString ? `?${queryString}` : ""}`);
};

/** Seats, revenue, profit and the status breakdown for one tour. */
export const getTourById = async (id: string) => {
  return await httpClient.get<ITourPackageDetail>(`/tours/${id}`);
};

export const getTourSummary = async () => {
  return await httpClient.get<ITourSummary>("/tours/summary");
};

export const createTour = async (payload: ICreateTourPackagePayload) => {
  return await httpClient.post<ITourPackage>("/tours", payload);
};

export const updateTour = async (id: string, payload: IUpdateTourPackagePayload) => {
  return await httpClient.patch<ITourPackageDetail>(`/tours/${id}`, payload);
};

/** AGENCY_ADMIN only, and refused while the tour has bookings. */
export const deleteTour = async (id: string) => {
  return await httpClient.delete<null>(`/tours/${id}`);
};

/* -------------------------------- bookings ------------------------------- */

export const getTourBookings = async (queryString?: string) => {
  return await httpClient.get<ITourBookingsListResponse>(
    `/tours/bookings${queryString ? `?${queryString}` : ""}`,
  );
};

export const getTourBookingById = async (id: string) => {
  return await httpClient.get<ITourBookingDetail>(`/tours/bookings/${id}`);
};

export const createTourBooking = async (payload: ICreateTourBookingPayload) => {
  return await httpClient.post<ITourBooking>("/tours/bookings", payload);
};

export const updateTourBooking = async (id: string, payload: IUpdateTourBookingPayload) => {
  return await httpClient.patch<ITourBookingDetail>(`/tours/bookings/${id}`, payload);
};

export const changeTourBookingStatus = async (
  id: string,
  payload: IChangeTourBookingStatusPayload,
) => {
  return await httpClient.patch<ITourBookingDetail>(`/tours/bookings/${id}/status`, payload);
};

export const recordTourPayment = async (id: string, payload: IRecordTourPaymentPayload) => {
  return await httpClient.post<ITourBookingDetail>(`/tours/bookings/${id}/payments`, payload);
};

/** AGENCY_ADMIN only. */
export const deleteTourPayment = async (id: string, paymentId: string) => {
  return await httpClient.delete<ITourBookingDetail>(`/tours/bookings/${id}/payments/${paymentId}`);
};

/** AGENCY_ADMIN only. */
export const deleteTourBooking = async (id: string) => {
  return await httpClient.delete<null>(`/tours/bookings/${id}`);
};
