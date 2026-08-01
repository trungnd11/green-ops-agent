import { AUTH_STORAGE_KEY } from './constants';
import { loginApi, initAuthService, type LoginResponseData } from './services/auth.service';

export interface AuthState {
  userId: string;
  username: string;
  fullName: string;
  role: string;
  token: string;
  refreshToken: string;
  companyId: string;
  companyName: string;
  companyCode: string;
}

export function createAuthStore(baseUrl: string) {
  initAuthService(baseUrl);

  function getSession(): AuthState | null {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as AuthState;
    } catch {
      return null;
    }
  }

  function setSession(data: AuthState): void {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
  }

  function clearSession(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  function getAccessToken(): string | null {
    return getSession()?.token ?? null;
  }

  async function login(username: string, password: string): Promise<AuthState> {
    const data = await loginApi({ username, password });
    const session: AuthState = {
      userId: data.userId,
      username: data.username,
      fullName: data.fullName,
      role: data.role,
      token: data.token,
      refreshToken: data.refreshToken,
      companyId: data.companyId,
      companyName: data.companyName,
      companyCode: data.companyCode,
    };
    setSession(session);
    return session;
  }

  function logout(): void {
    clearSession();
  }

  return {
    getSession,
    setSession,
    clearSession,
    getAccessToken,
    login,
    logout,
  };
}
