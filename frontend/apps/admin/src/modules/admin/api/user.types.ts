export interface UserResponse {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  lastLogin: string;
  createdAt: string;
  companyName?: string | undefined;
}

export interface UserSearchParams {
  page?: number | undefined;
  size?: number | undefined;
  keyword?: string | undefined;
  role?: string | undefined;
  status?: string | undefined;
}

export interface UserCompanyResponse {
  companyId: string;
  companyCode: string;
  companyName: string;
  defaultCompany: boolean;
  active: boolean;
}

export interface BasicCompany {
  id: string;
  code: string;
  name: string;
  status: string;
  createdAt?: string | undefined;
}

export interface CompanyDetail {
  id: string;
  code: string;
  name: string;
  address?: string | undefined;
  phone?: string | undefined;
  email?: string | undefined;
  taxCode?: string | undefined;
  contactPerson?: string | undefined;
  logoUrl?: string | undefined;
  status: string;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
}

export interface UserRoleItem {
  id: string;
  code: string;
  name: string;
}

export interface UserPermissionItem {
  code: string;
  name: string;
}

export interface UserPermissionGroup {
  module: string;
  permissions: UserPermissionItem[];
}

export interface UserRolesResponse {
  roles: UserRoleItem[];
  permissionGroups: UserPermissionGroup[];
}
