import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { tokenStorage } from "@/shared/utils/tokenStorage";
import { authService } from "@/shared/api/services/authService";
import { ROUTES } from "@/shared/config";
import { toast } from "sonner";
import { PageLoader } from "@/shared/components/Loader";

export const GoogleCallbackPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;

        const handleCallback = async () => {
            const accessToken = searchParams.get("accessToken");
            const refreshToken = searchParams.get("refreshToken");

            if (accessToken && refreshToken) {
                try {
                    tokenStorage.setAccessToken(accessToken);
                    tokenStorage.setRefreshToken(refreshToken);

                    const response = await authService.getMe();
                    if (cancelled) return;

                    if (response.responseObject) {
                        tokenStorage.setUser(response.responseObject);
                    }

                    toast.success("Login successful!");
                    navigate(ROUTES.DASHBOARD);
                } catch (error) {
                    if (cancelled) return;
                    console.error("Error fetching user details:", error);
                    toast.error("Failed to retrieve user details.");
                    navigate(ROUTES.LOGIN);
                }
            } else {
                if (cancelled) return;
                toast.error("Login failed. No tokens received.");
                navigate(ROUTES.LOGIN);
            }
        };

        void handleCallback();
        return () => {
            cancelled = true;
        };
    }, [searchParams, navigate]);

    return <PageLoader />;
};
