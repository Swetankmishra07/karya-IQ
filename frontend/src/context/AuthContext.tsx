import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '@/api/auth';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  parseJwt,
  setTokens,
  USER_KEY,
} from '@/api/client';
import { LoginRequest, RegisterRequest, UserResponse } from '@/types';

interface AuthContextType {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<UserResponse>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(() => {
    const saved = localStorage.getItem(USER_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authApi.getMyProfile();
      setUser(profile);
      localStorage.setItem(USER_KEY, JSON.stringify(profile));
    } catch (err: any) {
      // If 401, session is truly invalid
      if (err.response?.status === 401) {
        clearTokens();
        setUser(null);
      }
      // If network error or other, preserve cached user
    }
  }, []);

  // Initialize session on mount
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();

      if (!accessToken && !refreshToken) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      if (accessToken) {
        await refreshProfile();
      } else if (refreshToken) {
        try {
          const tokenRes = await authApi.refresh(refreshToken);
          setTokens(tokenRes.access_token, tokenRes.refresh_token);
          await refreshProfile();
        } catch {
          clearTokens();
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();

    // Listen to 401 expiry events dispatched by axios interceptor
    const handleExpired = () => {
      setUser(null);
    };
    window.addEventListener('auth:expired', handleExpired);

    return () => {
      window.removeEventListener('auth:expired', handleExpired);
    };
  }, [refreshProfile]);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const tokenRes = await authApi.login(credentials);
      setTokens(tokenRes.access_token, tokenRes.refresh_token);

      // Attempt to load profile from backend
      try {
        const profile = await authApi.getMyProfile();
        setUser(profile);
        localStorage.setItem(USER_KEY, JSON.stringify(profile));
      } catch {
        // Fallback: build minimal user from token payload if endpoint is delayed
        const payload = parseJwt(tokenRes.access_token);
        const fallbackUser: UserResponse = {
          id: payload?.sub ? parseInt(payload.sub, 10) : 0,
          username: credentials.email.split('@')[0],
          email: credentials.email,
          role: 'member',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setUser(fallbackUser);
        localStorage.setItem(USER_KEY, JSON.stringify(fallbackUser));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest): Promise<UserResponse> => {
    setIsLoading(true);
    try {
      return await authApi.register(data);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch (err) {
        // Idempotent logout - ignore failure
      }
    }
    clearTokens();
    setUser(null);
  };

  const isAuthenticated = !!user || !!getAccessToken();

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
