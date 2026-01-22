import { LoginForm } from "@/features/auth/ui";
import { useNavigate } from "react-router-dom";
import { tokenStorage } from "@/shared/utils/tokenStorage";
import type { User } from "@/shared/types";

export const LoginPage = () => {
  const navigate = useNavigate();

  const handleSuccess = (result: {
    accessToken: string;
    refreshToken: string;
    user: User;
  }) => {
    tokenStorage.setAccessToken(result.accessToken);
    tokenStorage.setRefreshToken(result.refreshToken);
    tokenStorage.setUser(result.user);
    navigate("/dashboard");
  };

  const bgImage = "https://images.unsplash.com/photo-1602756040210-13c501d16e80?q=80&w=1366&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3Dhttps://images.unsplash.com/photo-1602756040210-13c501d16e80?q=80&w=1366&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{
        backgroundImage: `url('${bgImage}')`,
      }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div className="w-full max-w-md z-10 relative">

        <LoginForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
};