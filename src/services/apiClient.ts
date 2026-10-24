import axios from "axios";
import { API_BASE_URL, DEALER_ID } from "../config";
import { clearToken, getToken } from "./tokenStorage";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(async (config) => {
  config.headers.set("X-Dealer-Id", String(DEALER_ID));

  const token = await getToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

// Registered by AuthContext so the interceptor can reset in-memory auth
// state (it can't call React hooks directly from here).
let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      await clearToken();
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (error.message) return error.message;
  }
  return "Something went wrong. Please try again.";
}

export function getApiErrorStatus(error: unknown): number | undefined {
  return axios.isAxiosError(error) ? error.response?.status : undefined;
}

/** Windows-style backslashes in a stored path would otherwise produce a broken image URL. */
export function fileUrl(relativePath: string): string {
  const normalized = relativePath.replace(/\\/g, "/");
  return `${API_BASE_URL}/${normalized.replace(/^\/+/, "")}`;
}
