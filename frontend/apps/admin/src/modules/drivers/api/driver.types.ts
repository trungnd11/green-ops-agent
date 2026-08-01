export interface DriverResponse {
  id: string;
  driverCode: string;
  fullName: string;
  phone: string;
  email?: string | undefined;
  cccd?: string | undefined;
  birthDate?: string | undefined;
  gender?: string | undefined;
  address?: string | undefined;
  licenseNumber?: string | undefined;
  licenseClass?: string | undefined;
  joinDate?: string | undefined;
  resignDate?: string | undefined;
  status: string;
  depositAmount?: number | undefined;
  note?: string | undefined;
  referrerId?: string | undefined;
  referrerName?: string | undefined;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

export interface DriverSearchParams {
  page?: number | undefined;
  size?: number | undefined;
  search?: string | undefined;
  status?: string | undefined;
  sortBy?: string | undefined;
  sortDir?: string | undefined;
}
