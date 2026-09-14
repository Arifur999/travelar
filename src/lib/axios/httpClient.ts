/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { cookies, headers } from "next/headers";
import { getNewTokensWithRefreshToken } from "@/services/auth.services";
import { ApiResponse } from "@/types/api.types";
import { getApiBaseUrl } from "../apiBaseUrl";
import { getForwardedForHeader } from "../forwardedFor";
import { isTokenExpiringSoon } from "../tokenUtils";

async function tryRefreshToken(accessToken: string, refreshToken: string): Promise<void> {
  if (!(await isTokenExpiringSoon(accessToken))) return;

  const requestHeaders = await headers();

  // proxy.ts may already have refreshed for this request. Without this check
  // every Server Component in the tree fires its own refresh.
  if (requestHeaders.get("x-token-refreshed") === "1") return;

  try {
    await getNewTokensWithRefreshToken(refreshToken);
  } catch (error: any) {
    console.error("Error refreshing token in http client:", error);
  }
}

// The backend authenticates on cookies, not a Bearer header, so the whole jar
// is forwarded. eg "accessToken=abc; refreshToken=def"
const buildCookieHeader = async () => {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
};

const axiosInstance = async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (accessToken && refreshToken) {
    await tryRefreshToken(accessToken, refreshToken);
  }

  return axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 30000,
    headers: {
      "Content-Type": "application/json",
      Cookie: await buildCookieHeader(),
      ...(await getForwardedForHeader()),
    },
  });
};

const multipartAxiosInstance = async () => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (accessToken && refreshToken) {
    await tryRefreshToken(accessToken, refreshToken);
  }

  return axios.create({
    baseURL: getApiBaseUrl(),
    timeout: 30000,
    // No Content-Type on purpose — axios must set the multipart boundary.
    headers: { Cookie: await buildCookieHeader(), ...(await getForwardedForHeader()) },
  });
};

export interface ApiRequestOptions {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
}

const httpGet = async <TData>(
  endpoint: string,
  options?: ApiRequestOptions,
): Promise<ApiResponse<TData>> => {
  try {
    const instance = await axiosInstance();
    const response = await instance.get<ApiResponse<TData>>(endpoint, {
      params: options?.params,
      headers: options?.headers,
    });
    return response.data;
  } catch (error) {
    console.error(`GET request to ${endpoint} failed:`, error);
    throw error;
  }
};

const httpPost = async <TData>(
  endpoint: string,
  payload?: unknown,
  options?: ApiRequestOptions,
): Promise<ApiResponse<TData>> => {
  try {
    const instance = await axiosInstance();
    const response = await instance.post<ApiResponse<TData>>(endpoint, payload, {
      params: options?.params,
      headers: options?.headers,
    });
    return response.data;
  } catch (error) {
    console.error(`POST request to ${endpoint} failed:`, error);
    throw error;
  }
};

const httpPatch = async <TData>(
  endpoint: string,
  payload?: unknown,
  options?: ApiRequestOptions,
): Promise<ApiResponse<TData>> => {
  try {
    const instance = await axiosInstance();
    const response = await instance.patch<ApiResponse<TData>>(endpoint, payload, {
      params: options?.params,
      headers: options?.headers,
    });
    return response.data;
  } catch (error) {
    console.error(`PATCH request to ${endpoint} failed:`, error);
    throw error;
  }
};

const httpPut = async <TData>(
  endpoint: string,
  payload?: unknown,
  options?: ApiRequestOptions,
): Promise<ApiResponse<TData>> => {
  try {
    const instance = await axiosInstance();
    const response = await instance.put<ApiResponse<TData>>(endpoint, payload, {
      params: options?.params,
      headers: options?.headers,
    });
    return response.data;
  } catch (error) {
    console.error(`PUT request to ${endpoint} failed:`, error);
    throw error;
  }
};

const httpDelete = async <TData>(
  endpoint: string,
  options?: ApiRequestOptions,
): Promise<ApiResponse<TData>> => {
  try {
    const instance = await axiosInstance();
    const response = await instance.delete<ApiResponse<TData>>(endpoint, {
      params: options?.params,
      headers: options?.headers,
    });
    return response.data;
  } catch (error) {
    console.error(`DELETE request to ${endpoint} failed:`, error);
    throw error;
  }
};

const httpPostFormData = async <TData>(
  endpoint: string,
  formData: FormData,
  options?: ApiRequestOptions,
): Promise<ApiResponse<TData>> => {
  try {
    const instance = await multipartAxiosInstance();
    const response = await instance.post<ApiResponse<TData>>(endpoint, formData, {
      params: options?.params,
      headers: options?.headers,
    });
    return response.data;
  } catch (error) {
    console.error(`Multipart POST request to ${endpoint} failed:`, error);
    throw error;
  }
};

const httpPatchFormData = async <TData>(
  endpoint: string,
  formData: FormData,
  options?: ApiRequestOptions,
): Promise<ApiResponse<TData>> => {
  try {
    const instance = await multipartAxiosInstance();
    const response = await instance.patch<ApiResponse<TData>>(endpoint, formData, {
      params: options?.params,
      headers: options?.headers,
    });
    return response.data;
  } catch (error) {
    console.error(`Multipart PATCH request to ${endpoint} failed:`, error);
    throw error;
  }
};

export const httpClient = {
  get: httpGet,
  post: httpPost,
  put: httpPut,
  patch: httpPatch,
  delete: httpDelete,
  postFormData: httpPostFormData,
  patchFormData: httpPatchFormData,
};
