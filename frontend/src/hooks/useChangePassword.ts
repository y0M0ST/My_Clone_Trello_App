import { useState } from "react";
import { apiFactory, API_ENDPOINTS } from "@/shared/api";
import { toast } from "sonner"

export const useChangePassword = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const changePassword = async (data: any) => {
        setIsLoading(true);
        setError(null);
        setSuccess(false);
        try {
            await apiFactory.patch(API_ENDPOINTS.USERS.CHANGE_PASSWORD, {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
                confirmPassword: data.confirmPassword
            });

            setSuccess(true);
            toast.success("Đổi mật khẩu thành công!");

        } catch (err: any) {
            const msg = err.response?.data?.message || "Đổi mật khẩu thất bại";
            setError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    return { changePassword, isLoading, error, success };
};