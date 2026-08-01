import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";
import { authSessionService } from "../services/auth-session.service";
import type { AuthUser } from "../api/auth.types";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(() => authSessionService.getSession());

  useEffect(() => {
    const stored = authSessionService.getSession();
    if (stored) setUserState(stored);
  }, []);

  const setUser = useCallback((authUser: AuthUser) => {
    authSessionService.setSession(authUser);
    setUserState(authUser);
  }, []);

  const logout = useCallback(() => {
    authSessionService.clear();
    setUserState(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
