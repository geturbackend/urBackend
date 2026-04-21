export interface UrBackendConfig {
  apiKey: string;
  baseUrl?: string;
  headers?: Record<string, string>;
}

export interface RequestOptions {
  body?: unknown;
  token?: string;
  isMultipart?: boolean;
  credentials?: RequestCredentials;
  headers?: Record<string, string>;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  populate?: string | string[];
  expand?: string | string[];
  filter?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface SignUpPayload {
  email: string;
  password: string;
  username?: string;
  name?: string;
  [key: string]: unknown;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  username?: string;
  name?: string;
  [key: string]: unknown;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyEmailPayload {
  email: string;
  otp: string;
}

export interface ResendOtpPayload {
  email: string;
}

export interface RequestPasswordResetPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

export interface SocialExchangePayload {
  token: string;
  rtCode: string;
}

export interface SocialExchangeResponse {
  refreshToken: string;
}

export interface AuthUser {
  _id: string;
  email: string;
  username?: string;
  name?: string;
  [key: string]: unknown;
}

export interface AuthResponse {
  accessToken?: string;
  /** @deprecated use accessToken instead */
  token?: string;
  expiresIn?: string;
  userId?: string;
  user?: AuthUser;
}

export interface DocumentData {
  _id: string;
  [key: string]: unknown;
}

export interface InsertPayload {
  [key: string]: unknown;
}

export interface UpdatePayload {
  [key: string]: unknown;
}

export interface PatchPayload {
  [key: string]: unknown;
}

export interface SchemaField {
  key: string;
  type: string;
  required: boolean;
  unique?: boolean;
  ref?: string;
  items?: {
    type: string;
    fields?: SchemaField[];
  };
  fields?: SchemaField[];
}

export interface CollectionSchema {
  name: string;
  model: SchemaField[];
}

/**
 * Mail payload contract:
 * - Template mode: provide `templateId` or `templateName` (with optional `variables`).
 * - Direct mode: provide `subject` and at least one of `text` or `html`.
 */
export interface SendMailPayload {
  to: string | string[];
  variables?: Record<string, unknown>;
  templateId?: string;
  templateName?: string;
  subject?: string;
  text?: string;
  html?: string;
}

export interface SendMailResponse {
  id: string | null;
  provider: 'byok' | 'default';
  monthlyUsage: number;
  monthlyLimit: number;
}

export interface UploadResponse {
  url: string;
  path: string;
  provider: 'internal' | 'external';
  message?: string;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
