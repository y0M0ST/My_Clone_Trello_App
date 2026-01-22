// frontend/src/hooks/useProfileEdit.ts
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { tokenStorage } from "@/shared/utils/tokenStorage";
import { apiFactory, API_ENDPOINTS } from "@/shared/api";
import type { User } from "@/shared/types";


export const useProfileEdit = () => {
    const navigate = useNavigate();
    const user = tokenStorage.getUser();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const updateProfile = async (data: { name: string; bio: string; avatar?: FileList }) => {
        console.log("🔥 KẾT QUẢ FORM GỬI SANG:", data);
        console.log("🔥 Check Avatar:", data.avatar);
        console.log("🔥 Check Length:", data.avatar?.length);
        setError(null);
        setIsLoading(true);

        try {
            let newAvatarUrl = null;
            if (data.avatar && data.avatar.length > 0) {
                const formData = new FormData();
                formData.append("avatar", data.avatar[0]);

                const uploadRes: any = await apiFactory.patch(
                    API_ENDPOINTS.USERS.UPLOAD_AVATAR,
                    formData,
                    {
                        headers: {
                            "Content-Type": undefined,
                        },
                    }
                );

                const uploadData = uploadRes.responseObject || uploadRes.data;
                if (uploadData && uploadData.avatarUrl) {
                    newAvatarUrl = uploadData.avatarUrl;
                    console.log("✅ Upload thành công:", newAvatarUrl);
                }
            }

            const profileData = { name: data.name, bio: data.bio };
            const response: any = await apiFactory.patch(
                API_ENDPOINTS.USERS.UPDATE_PROFILE,
                profileData
            );

            const updatedUser = response.responseObject || response.data;

            if (newAvatarUrl) {
                updatedUser.avatarUrl = newAvatarUrl;
            }

            tokenStorage.setUser(updatedUser);
            navigate("/profile");

        } catch (err: any) {
            console.error("Lỗi update:", err);
            const message = err.response?.data?.message || err.message || "Update failed";
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return { updateProfile, isLoading, error, user };
};