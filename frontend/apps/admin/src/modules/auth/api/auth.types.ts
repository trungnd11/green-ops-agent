export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  username: string;
  fullName: string;
  role: string;
  token: string;
  refreshToken: string;
  companyId: string;
  companyName: string;
  companyCode: string;
  require2fa?: boolean | undefined;
  forcePasswordChange?: boolean | undefined;
}

export interface ChangePasswordRequest {
  newPassword: string;
}

export interface Verify2FARequest {
  username: string;
  otp: string;
}

export interface TwoFAStatusResponse {
  enabled: boolean;
  qrCodeUrl: string | null;
}

export interface AuthUser {
  userId: string;
  username: string;
  fullName: string;
  role: string;
  token: string;
  refreshToken: string;
  companyId: string;
  companyName: string;
  companyCode: string;
  require2fa?: boolean | undefined;
  forcePasswordChange?: boolean | undefined;
}
