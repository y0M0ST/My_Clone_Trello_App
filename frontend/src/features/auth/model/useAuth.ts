import { useCallback, useState } from "react";
import { authService } from "@/shared/api/services/authService";
import { tokenStorage } from "@/shared/utils/tokenStorage";
export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login({ email, password });
      const { accessToken, refreshToken, user } = response.responseObject;

      tokenStorage.setAccessToken(accessToken);
      tokenStorage.setRefreshToken(refreshToken);
      tokenStorage.setUser(user);

      return { accessToken, refreshToken, user };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      tokenStorage.clearTokens();
      setIsLoading(false);
    }
  }, []);

  return {
    isAuthenticated: !!tokenStorage.getAccessToken(),
    isLoading,
    error,
    login,
    logout,
  };
};
