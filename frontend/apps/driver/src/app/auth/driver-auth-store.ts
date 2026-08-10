import { driverLoginApi } from '@xanh/auth';

const AUTH_KEY = 'xanhsm-driver-auth';

export interface DriverAuthState {
  driverId: string;
  driverCode: string;
  fullName: string;
  phone: string;
  token: string;
  companyId: string;
}

export function createDriverAuthStore(_baseUrl: string) {
  function getSession(): DriverAuthState | null {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      return raw ? JSON.parse(raw) as DriverAuthState : null;
    } catch { return null; }
  }

  function setSession(data: DriverAuthState): void {
    localStorage.setItem(AUTH_KEY, JSON.stringify(data));
  }

  function clearSession(): void {
    localStorage.removeItem(AUTH_KEY);
  }

  function getAccessToken(): string | null {
    return getSession()?.token ?? null;
  }

  async function login(identifier: string): Promise<DriverAuthState> {
    const data = await driverLoginApi({ identifier });
    const session: DriverAuthState = {
      driverId: data.driverId,
      driverCode: data.driverCode,
      fullName: data.fullName,
      phone: data.phone,
      token: data.token,
      companyId: data.companyId,
    };
    setSession(session);
    return session;
  }

  function logout(): void {
    clearSession();
  }

  return { getSession, setSession, clearSession, getAccessToken, login, logout };
}
