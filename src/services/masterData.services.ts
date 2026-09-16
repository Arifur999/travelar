"use server";

import { httpClient } from "@/lib/axios/httpClient";
import {
  type IAirline,
  type ICreateAirlinePayload,
  type ICreateRoutePayload,
  type IRoute,
} from "@/types/masterData.types";

/**
 * Services never swallow — they log and rethrow. The `_action` layer is what
 * converts a throw into `{ success: false, message }`.
 */

/* -------------------------------- airlines ------------------------------- */

export const getAirlines = async (queryString?: string) => {
  return await httpClient.get<IAirline[]>(`/airlines${queryString ? `?${queryString}` : ""}`);
};

export const getAirlineById = async (id: string) => {
  return await httpClient.get<IAirline>(`/airlines/${id}`);
};

export const createAirline = async (payload: ICreateAirlinePayload) => {
  return await httpClient.post<IAirline>("/airlines", payload);
};

export const updateAirline = async (id: string, payload: Partial<ICreateAirlinePayload>) => {
  return await httpClient.patch<IAirline>(`/airlines/${id}`, payload);
};

export const deleteAirline = async (id: string) => {
  return await httpClient.delete<{ message: string }>(`/airlines/${id}`);
};

/* --------------------------------- routes -------------------------------- */

/** Mounted at /routes-master, not /routes — /routes is taken by the Express router tree. */
export const getRoutes = async (queryString?: string) => {
  return await httpClient.get<IRoute[]>(
    `/routes-master${queryString ? `?${queryString}` : ""}`,
  );
};

export const getRouteById = async (id: string) => {
  return await httpClient.get<IRoute>(`/routes-master/${id}`);
};

export const createRoute = async (payload: ICreateRoutePayload) => {
  return await httpClient.post<IRoute>("/routes-master", payload);
};

export const updateRoute = async (id: string, payload: Partial<ICreateRoutePayload>) => {
  return await httpClient.patch<IRoute>(`/routes-master/${id}`, payload);
};

export const deleteRoute = async (id: string) => {
  return await httpClient.delete<{ message: string }>(`/routes-master/${id}`);
};
