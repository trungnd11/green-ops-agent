export interface User {
  id: string;
  displayName: string;
  email: string;
  roles: Role[];
  isActive: boolean;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface Permission {
  code: string;
  name: string;
  description: string;
}
