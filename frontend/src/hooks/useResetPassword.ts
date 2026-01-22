import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFactory, API_ENDPOINTS } from "@/shared/api";
import { toast } from "sonner"; // Hoặc dùng state error nếu chưa có sonner

export const useResetPassword = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const requestResetCode = async (email: string) => {
        setIsLoading(true);
        try {
            await apiFactory.post(API_ENDPOINTS.AUTH.FORGET_PASSWORD, { email });
            toast.success("Mã xác thực đã được gửi đến email của bạn!");
            // Chuyển sang trang Reset, mang theo email
            navigate(`/reset-password?email=${encodeURIComponent(email)}`);
        } catch (error: any) {
            toast.error(error.message || "Không thể gửi yêu cầu.");
        } finally {
            setIsLoading(false);
        }
    };

    const confirmResetPassword = async (data: { email: string; code: string; newPassword: string }) => {
        setIsLoading(true);
        try {
            await apiFactory.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, data);
            toast.success("Đổi mật khẩu thành công!");
            return true; 
        } catch (error: any) {
            toast.error(error.message || "Đổi mật khẩu thất bại.");
            return false; 
        } finally {
            setIsLoading(false);
        }
    };

    return { requestResetCode, confirmResetPassword, isLoading };
};