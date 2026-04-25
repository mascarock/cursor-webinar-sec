import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { authApi } from '../api';

interface AuthResult {
  ok: boolean;
  message?: string;
}

interface AuthContextValue {
  currentUser: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<AuthResult>;
  register: (username: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.me().then(({ ok, data }) => {
      const d = data as { username?: string };
      if (ok && d.username) setCurrentUser(d.username);
      setLoading(false);
    });
  }, []);

  const login = useCallback(
    async (username: string, password: string): Promise<AuthResult> => {
      const { ok, data } = await authApi.login(username, password);
      const d = data as {
        ok?: boolean;
        username?: string;
        message?: string;
        error?: string;
      };
      if (ok && d.ok && d.username) {
        setCurrentUser(d.username);
        return { ok: true };
      }
      return { ok: false, message: d.message || d.error || 'Error al iniciar sesión' };
    },
    [],
  );

  const register = useCallback(
    async (username: string, password: string): Promise<AuthResult> => {
      const { ok, data } = await authApi.register(username, password);
      const d = data as {
        ok?: boolean;
        username?: string;
        message?: string;
        error?: string;
      };
      if (ok && d.ok && d.username) {
        setCurrentUser(d.username);
        return { ok: true };
      }
      return { ok: false, message: d.message || d.error || 'Error al registrarse' };
    },
    [],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setCurrentUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
