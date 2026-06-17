import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiGetMe, apiLogin, apiRegister } from "../api/client";

interface AuthContextType {
  token: string | null;
  username: string | null;
  loading: boolean;
  login: (u: string, p: string) => Promise<void>;
  register: (u: string, p: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      apiGetMe()
        .then((data) => setUsername(data.username))
        .catch(() => {
          setToken(null);
          localStorage.removeItem("token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (u: string, p: string) => {
    const data = await apiLogin(u, p);
    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
    setUsername(data.username);
  };

  const register = async (u: string, p: string) => {
    const data = await apiRegister(u, p);
    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
    setUsername(data.username);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ token, username, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
