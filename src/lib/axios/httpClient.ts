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

export interface ApiFile {
  data: ArrayBuffer;
  contentType: string;
  contentDisposition: string | null;
}

/**
 * A binary response (a generated PDF) instead of the JSON envelope. On a 4xx
 * the API still answers with its JSON error, which axios hands back as bytes
 * here — so it is decoded into `response.data` before rethrowing, and
 * getActionErrorMessage reads the message exactly as it does for JSON calls.
 */
const httpGetFile = async (endpoint: string): Promise<ApiFile> => {
  try {
    const instance = await axiosInstance();
    const response = await instance.get<ArrayBuffer>(endpoint, { responseType: "arraybuffer" });
    return {
      data: response.data,
      contentType: String(response.headers["content-type"] ?? "application/octet-stream"),
      contentDisposition: (response.headers["content-disposition"] as string | undefined) ?? null,
    };
  } catch (error: any) {
    const raw = error?.response?.data;
    if (raw instanceof ArrayBuffer || ArrayBuffer.isView(raw)) {
      try {
        error.response.data = JSON.parse(new TextDecoder().decode(raw as ArrayBuffer));
      } catch {
        // Not JSON — leave the bytes; the caller falls back to its own message.
      }
    }
    console.error(`GET file request to ${endpoint} failed:`, error?.response?.status ?? error);
    throw error;
  }
};

export const httpClient = {
  get: httpGet,
  getFile: httpGetFile,
  post: httpPost,
  put: httpPut,
  patch: httpPatch,
  delete: httpDelete,
  postFormData: httpPostFormData,
  patchFormData: httpPatchFormData,
};
