import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type {
  User,
  AuthResponse,
  RegisterPayload,
  VerifyOtpPayload,
  LoginPayload,
  RegisterResponse,
  VerifyOtpResponse,
} from '../types';
import { registerUser, verifyOtp as verifyOtpApi, loginUser } from '../api/auth';

export class AuthError extends Error {
  status?: number;
  isUnverified?: boolean;
  email?: string;

  constructor(message: string, status?: number, isUnverified?: boolean, email?: string) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
    this.isUnverified = isUnverified;
    this.email = email;
  }
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<RegisterResponse>;
  verifyOtp: (payload: VerifyOtpPayload) => Promise<VerifyOtpResponse>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state if unauthorized event fired from axios
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setToken(null);
      setError('Your session has expired. Please sign in again.');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const handleAuthSuccess = (data: AuthResponse) => {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setError(null);
  };

  const login = async (credentials: LoginPayload): Promise<AuthResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await loginUser(credentials);
      handleAuthSuccess(data);
      return data;
    } catch (err: any) {
      const status = err.response?.status;
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Authentication failed. Please check your credentials.';

      const isUnverified = status === 403 || message.toLowerCase().includes('not verified');
      setError(message);
      throw new AuthError(message, status, isUnverified, credentials.email);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload): Promise<RegisterResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await registerUser(payload);
      return data;
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Registration failed. Please try again.';
      setError(message);
      throw new AuthError(message, err.response?.status);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (payload: VerifyOtpPayload): Promise<VerifyOtpResponse> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await verifyOtpApi(payload);
      return data;
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        'Failed to verify code. Please try again.';
      setError(message);
      throw new AuthError(message, err.response?.status);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setError(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        error,
        login,
        register,
        verifyOtp,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
