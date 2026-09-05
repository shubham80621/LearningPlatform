import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '../types';
import { logoutRequest, meRequest } from '../api/auth';
import {
  clearSession,
  getStoredUser,
  setStoredUser,
} from '../auth/authStorage';
import { refreshAccessToken } from '../auth/tokenRefresh';
import { store } from '../store';
import { api } from '../store/api';
import { setLearnerLearnStatus } from '../store/uiSlice';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  authReady: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const me = await meRequest();
        if (cancelled) return;
        setStoredUser(me);
        setUser(me);
      } catch {
        try {
          await refreshAccessToken();
          const me = await meRequest();
          if (cancelled) return;
          setStoredUser(me);
          setUser(me);
        } catch {
          if (cancelled) return;
          clearSession();
          setUser(null);
        }
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((nextUser: User) => {
    setStoredUser(nextUser);
    setUser(nextUser);
    setAuthReady(true);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    store.dispatch(api.util.resetApiState());
    store.dispatch(setLearnerLearnStatus('all'));
    void logoutRequest().catch(() => {
      /* best-effort revoke + clear cookies */
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      authReady,
      login,
      logout,
    }),
    [user, authReady, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
