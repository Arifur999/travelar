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
  try {
    return await httpClient.get<IAirline[]>(`/airlines${queryString ? `?${queryString}` : ""}`);
  } catch (error) {
    console.error("Error fetching airlines:", error);
    throw error;
  }
};

export const getAirlineById = async (id: string) => {
  try {
    return await httpClient.get<IAirline>(`/airlines/${id}`);
  } catch (error) {
    console.error("Error fetching airline:", error);
    throw error;
  }
};

export const createAirline = async (payload: ICreateAirlinePayload) => {
  try {
    return await httpClient.post<IAirline>("/airlines", payload);
  } catch (error) {
    console.error("Error creating airline:", error);
    throw error;
  }
};

export const updateAirline = async (id: string, payload: Partial<ICreateAirlinePayload>) => {
  try {
    return await httpClient.patch<IAirline>(`/airlines/${id}`, payload);
  } catch (error) {
    console.error("Error updating airline:", error);
    throw error;
  }
};

export const deleteAirline = async (id: string) => {
  try {
    return await httpClient.delete<{ message: string }>(`/airlines/${id}`);
  } catch (error) {
    console.error("Error deleting airline:", error);
    throw error;
  }
};

/* --------------------------------- routes -------------------------------- */

/** Mounted at /routes-master, not /routes — /routes is taken by the Express router tree. */
export const getRoutes = async (queryString?: string) => {
  try {
    return await httpClient.get<IRoute[]>(
      `/routes-master${queryString ? `?${queryString}` : ""}`,
    );
  } catch (error) {
    console.error("Error fetching routes:", error);
    throw error;
  }
};

export const getRouteById = async (id: string) => {
  try {
    return await httpClient.get<IRoute>(`/routes-master/${id}`);
  } catch (error) {
    console.error("Error fetching route:", error);
    throw error;
  }
};

export const createRoute = async (payload: ICreateRoutePayload) => {
  try {
    return await httpClient.post<IRoute>("/routes-master", payload);
  } catch (error) {
    console.error("Error creating route:", error);
    throw error;
  }
};

export const updateRoute = async (id: string, payload: Partial<ICreateRoutePayload>) => {
  try {
    return await httpClient.patch<IRoute>(`/routes-master/${id}`, payload);
  } catch (error) {
    console.error("Error updating route:", error);
    throw error;
  }
};

export const deleteRoute = async (id: string) => {
  try {
    return await httpClient.delete<{ message: string }>(`/routes-master/${id}`);
  } catch (error) {
    console.error("Error deleting route:", error);
    throw error;
  }
};
