import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFactory, API_ENDPOINTS } from "@/shared/api";
import type { RegisterRequest } from "@/shared/types";
import { toast } from "sonner"; 

export const useRegister = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const registerUser = async (formValues: RegisterRequest) => {
        setError(null);
        setIsLoading(true);

        try {
            await apiFactory.post(
                API_ENDPOINTS.AUTH.REGISTER,
                formValues
            );
            toast.success("Đã gửi mã xác thực! Vui lòng kiểm tra email.");
            navigate(`/verify?email=${encodeURIComponent(formValues.email)}`);

        } catch (err: any) {
            const message = err.response?.data?.message || err.message || "Registration failed";
            setError(message);
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        registerUser,
        isLoading,
        error,
    };
};