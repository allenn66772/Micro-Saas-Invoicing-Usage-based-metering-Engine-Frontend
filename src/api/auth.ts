import { apiClient } from './axios';
import type {
  RegisterPayload,
  VerifyOtpPayload,
  LoginPayload,
  RegisterResponse,
  VerifyOtpResponse,
  AuthResponse,
} from '../types';

/**
 * Register a new user account.
 * Dispatches a 6-digit OTP verification code to the provided email.
 * POST /register
 */
export const registerUser = async (payload: RegisterPayload): Promise<RegisterResponse> => {
  const response = await apiClient.post<RegisterResponse>('/register', {
    userName: payload.userName,
    email: payload.email,
    Password: payload.Password,
  });
  return response.data;
};

/**
 * Verify 6-digit numeric OTP sent to user's email.
 * POST /verify-code
 */
export const verifyOtp = async (payload: VerifyOtpPayload): Promise<VerifyOtpResponse> => {
  const response = await apiClient.post<VerifyOtpResponse>('/verify-code', {
    email: payload.email,
    otp: payload.otp.trim(),
  });
  return response.data;
};

/**
 * Authenticate verified user and retrieve JWT session.
 * POST /login
 */
export const loginUser = async (payload: LoginPayload): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/login', {
    email: payload.email,
    Password: payload.Password,
  });
  return response.data;
};

export default {
  registerUser,
  verifyOtp,
  loginUser,
};
