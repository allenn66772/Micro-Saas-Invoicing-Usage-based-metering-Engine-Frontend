import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type {
  AuthResponse,
  CurrentPeriodUsageResponse,
  ApiKeyItem,
  GenerateKeyResponse,
  Invoice,
  InvoicesListResponse,
  SingleInvoiceResponse,
  RegisterPayload,
  VerifyOtpPayload,
  LoginPayload,
  RegisterResponse,
  VerifyOtpResponse,
} from '../types';

const API_BASE_URL = "https://micro-saas-invoicing-usage-based.onrender.com";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000,
});

// Request Interceptor: Automatically inject JWT Bearer token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global errors and 401 unauthenticated
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

// Modular API service endpoints mapped exactly to backend specs
export const api = {
  // Authentication
  register: async (payload: RegisterPayload): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/register', {
      userName: payload.userName,
      email: payload.email,
      Password: payload.Password,
    });
    return response.data;
  },

  verifyOtp: async (payload: VerifyOtpPayload): Promise<VerifyOtpResponse> => {
    const response = await apiClient.post<VerifyOtpResponse>('/verify-code', {
      email: payload.email,
      otp: payload.otp.trim(),
    });
    return response.data;
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/login', {
      email: payload.email,
      Password: payload.Password,
    });
    return response.data;
  },

  // API Key Management
  generateKey: async (): Promise<GenerateKeyResponse> => {
    const response = await apiClient.post<GenerateKeyResponse>('/generate-key', {});
    return response.data;
  },

  getApiKeys: async (): Promise<ApiKeyItem[]> => {
    const response = await apiClient.get<any>('/get-apiKey');
    const data = response.data;

    if (Array.isArray(data)) {
      return data;
    }
    if (data?.keys && Array.isArray(data.keys)) {
      return data.keys;
    }
    if (data && typeof data === 'object') {
      if (data.hasKey && data.prefix) {
        return [
          {
            _id: 'active_api_key',
            keyPrefix: data.prefix,
            maskedKey: `${data.prefix}••••••••••••••••••••••••`,
            status: 'active',
            createdAt: data.createdAt || new Date().toISOString(),
          },
        ];
      }
      if (data.hasKey === false) {
        return [];
      }
    }
    return [];
  },

  revokeKey: async (keyId?: string): Promise<{ message?: string; success?: boolean }> => {
    const response = await apiClient.delete('/revoke-key', {
      params: keyId ? { keyId } : undefined,
      data: keyId ? { keyId } : undefined,
    });
    return response.data;
  },

  // Usage & Real-Time Aggregation
  getCurrentPeriodUsage: async (): Promise<CurrentPeriodUsageResponse> => {
    const response = await apiClient.get<CurrentPeriodUsageResponse>('/current-period');
    return response.data;
  },

  // Invoice Management
  generateInvoice: async (): Promise<Invoice> => {
    const response = await apiClient.post<Invoice | SingleInvoiceResponse>('/generate-invoice', {});
    if ((response.data as SingleInvoiceResponse)?.invoice) {
      return (response.data as SingleInvoiceResponse).invoice;
    }
    return response.data as Invoice;
  },

  getAllInvoices: async (): Promise<Invoice[]> => {
    const response = await apiClient.get<InvoicesListResponse | Invoice[]>('/get-all-invoice');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    if ((response.data as InvoicesListResponse)?.invoices) {
      return (response.data as InvoicesListResponse).invoices;
    }
    return [];
  },

  getInvoiceById: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get<SingleInvoiceResponse | Invoice>(`/get-invoice-by/${id}`);
    if ((response.data as SingleInvoiceResponse)?.invoice) {
      return (response.data as SingleInvoiceResponse).invoice;
    }
    return response.data as Invoice;
  },

  downloadInvoicePdf: async (id: string, invoiceNumber?: string): Promise<void> => {
    const response = await apiClient.get(`/invoices/${id}/download`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `invoice-${invoiceNumber || id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  },
};

export default apiClient;
