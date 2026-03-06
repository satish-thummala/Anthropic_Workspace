import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import type { User } from "../types/compliance.types";
import { authAPI, type LoginResponse } from "../services/api-client";

// ─── Config ──────────────────────────────────────────────────────────────────
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 min idle → show warning
const WARNING_SECS = 60; // 60-second countdown in modal
const ACTIVITY_EVENTS = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: (reason?: "user" | "timeout") => void;
  isLoading: boolean;
  // Exposed so App can render the warning modal
  showWarning: boolean;
  warningCountdown: number;
  stayLoggedIn: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("compliance_user") ?? "null");
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningCountdown, setWarningCountdown] = useState(WARNING_SECS);

  // Refs so callbacks always see latest values without re-registering listeners
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isAuthRef = useRef(!!user);
  isAuthRef.current = !!user;

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async (reason: "user" | "timeout" = "user") => {
    clearTimeout(idleTimerRef.current!);
    clearInterval(countdownTimerRef.current!);
    setShowWarning(false);

    if (reason === "user") {
      try {
        await authAPI.logout();
      } catch {
        /* ignore */
      }
    }

    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("compliance_user");
  }, []);

  // ── Show warning modal + start countdown ───────────────────────────────────
  const startCountdown = useCallback(() => {
    setWarningCountdown(WARNING_SECS);
    setShowWarning(true);

    // Tick every second
    countdownTimerRef.current = setInterval(() => {
      setWarningCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current!);
          logout("timeout");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [logout]);

  // ── Reset idle timer on any activity ──────────────────────────────────────
  const resetIdleTimer = useCallback(() => {
    if (!isAuthRef.current) return;

    clearTimeout(idleTimerRef.current!);
    idleTimerRef.current = setTimeout(startCountdown, IDLE_TIMEOUT_MS);
  }, [startCountdown]);

  // ── "Stay logged in" button in warning modal ───────────────────────────────
  const stayLoggedIn = useCallback(async () => {
    clearInterval(countdownTimerRef.current!);
    setShowWarning(false);
    setWarningCountdown(WARNING_SECS);

    // ── Hit the backend refresh endpoint ──────────────────────────────────
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        const response = await authAPI.refreshToken(refreshToken);
        // Store the new tokens so all subsequent API calls use them
        localStorage.setItem("accessToken", response.accessToken);
        localStorage.setItem("refreshToken", response.refreshToken);
      }
    } catch (err) {
      // Refresh token itself has expired — treat as a timeout logout so the
      // user sees the login screen rather than a broken authenticated state.
      console.warn(
        "Token refresh failed on stayLoggedIn — forcing logout",
        err,
      );
      logout("timeout");
      return;
    }

    // Restart the idle timer only after the server round-trip succeeds
    clearTimeout(idleTimerRef.current!);
    idleTimerRef.current = setTimeout(startCountdown, IDLE_TIMEOUT_MS);
  }, [startCountdown, logout]);

  // ── Register / unregister activity listeners ───────────────────────────────
  useEffect(() => {
    if (!user) return; // only track when logged in

    // Start idle timer immediately on login
    idleTimerRef.current = setTimeout(startCountdown, IDLE_TIMEOUT_MS);

    const handler = () => resetIdleTimer();
    ACTIVITY_EVENTS.forEach((e) =>
      window.addEventListener(e, handler, { passive: true }),
    );

    return () => {
      clearTimeout(idleTimerRef.current!);
      clearInterval(countdownTimerRef.current!);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, handler));
    };
  }, [user, resetIdleTimer, startCountdown]);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response: LoginResponse = await authAPI.login({ email, password });

      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("refreshToken", response.refreshToken);

      const userData: User = {
        id: response.user.id.toString(),
        name: response.user.name,
        email: response.user.email,
        role: response.user.role as "admin" | "analyst" | "viewer",
        organization: response.user.organization,
        avatar: response.user.avatar,
      };

      setUser(userData);
      localStorage.setItem("compliance_user", JSON.stringify(userData));
      return true;
    } catch {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("compliance_user");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ── Verify token on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("compliance_user");
    if (token && storedUser) {
      authAPI.getCurrentUser().catch(() => logout("timeout"));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        isLoading,
        showWarning,
        warningCountdown,
        stayLoggedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
