import type { AuthUser } from "../api/auth.types";

const STORAGE_KEY = "xanhsm-auth";

function parse(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function save(user: AuthUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function remove(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export const authSessionService = {
  getSession: (): AuthUser | null => parse(),

  setSession: (user: AuthUser): void => save(user),

  clear: (): void => remove(),

  getAccessToken: (): string | null => parse()?.token ?? null,

  getCompanyId: (): string | null => parse()?.companyId ?? null,

  isAuthenticated: (): boolean => parse() !== null,
};
