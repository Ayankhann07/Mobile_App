import { apiClient } from "./apiClient";
import type { ApiResponse, AuthResponse } from "./types";

export async function checkMobileExists(mobileNumber: string): Promise<boolean> {
  const res = await apiClient.post<ApiResponse<{ exists: boolean }>>("/api/customer/auth/check-mobile", {
    mobileNumber,
  });
  return res.data.data.exists;
}

export async function loginWithOtp(mobileNumber: string, otp: string): Promise<AuthResponse> {
  const res = await apiClient.post<ApiResponse<AuthResponse>>("/api/customer/auth/login-otp", {
    mobileNumber,
    otp,
  });
  return res.data.data;
}

export async function registerWithOtp(fullName: string, mobileNumber: string, otp: string): Promise<AuthResponse> {
  const res = await apiClient.post<ApiResponse<AuthResponse>>("/api/customer/auth/register-otp", {
    fullName,
    mobileNumber,
    otp,
  });
  return res.data.data;
}
