export interface User {
  _id: string;
  email: string;
  userName?: string;
  username?: string;
  role?: string;
}

export interface RegisterPayload {
  userName: string;
  email: string;
  Password: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface LoginPayload {
  email: string;
  Password: string;
}

export interface RegisterResponse {
  message: string;
  email?: string;
}

export interface VerifyOtpResponse {
  message: string;
}

export interface AuthResponse {
  token: string;
  user: {
    _id: string;
    email: string;
    userName: string;
    role: string;
    username?: string;
  };
  message?: string;
}

export interface ApiKeyItem {
  _id: string;
  keyPrefix?: string;
  maskedKey?: string;
  status: "active" | "revoked";
  createdAt: string;
}

export interface TierBreakdown {
  range: string;
  unitsBilled: number;
  unitPrice: number;
  subtotal: number;
}

export interface LineItem {
  metric: string;
  unitName: string;
  totalUnits: number;
  subtotal: number;
  tierBreakdown: TierBreakdown[];
}

export interface Invoice {
  _id: string;
  customerId: string;
  invoiceNumber: string;
  billingPeriod: {
    start: string;
    end: string;
  };
  lineItems: LineItem[];
  totalAmount: number;
  status: "unpaid" | "paid" | "void";
  createdAt: string;
}

export interface UsageBreakdownItem {
  metric: string;
  unitName: string;
  totalUnits: number;
  freeUnits: number;
  billableUnits: number;
  ratePerUnit: number;
  subtotal: number;
  totalEventsLogged: number;
}

export interface CurrentPeriodUsageResponse {
  billingPeriod: {
    start: string;
    end: string;
  };
  breakdown: UsageBreakdownItem[];
  estimatedTotalAmount: number;
}

export interface GenerateKeyResponse {
  apiKey: string;
  message: string;
}

export interface InvoicesListResponse {
  invoices: Invoice[];
}

export interface SingleInvoiceResponse {
  invoice: Invoice;
}

export interface ApiErrorResponse {
  message?: string;
  error?: string;
}
