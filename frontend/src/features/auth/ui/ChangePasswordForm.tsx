import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/shared/ui/label";
import { useEffect } from "react";

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z.string().min(6, "Mật khẩu mới tối thiểu 6 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

interface Props {
    onSubmit: (data: PasswordFormValues) => void;
    isLoading: boolean;
    error: string | null;
    success: boolean;
}

export const ChangePasswordForm = ({ onSubmit, isLoading, error, success }: Props) => {
    const { control, handleSubmit, reset, formState: { errors } } = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        }
    });

    if (success && !isLoading) {
    }

    useEffect(() => {
        if (success) {
            reset();
        }
    }, [success, reset]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div className="space-y-2">
                <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                <Controller
                    name="currentPassword"
                    control={control}
                    render={({ field }) => (
                        <Input {...field} id="currentPassword" type="password" disabled={isLoading} />
                    )}
                />
                {errors.currentPassword && <span className="text-xs text-red-500">{errors.currentPassword.message}</span>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <Controller
                    name="newPassword"
                    control={control}
                    render={({ field }) => (
                        <Input {...field} id="newPassword" type="password" disabled={isLoading} />
                    )}
                />
                {errors.newPassword && <span className="text-xs text-red-500">{errors.newPassword.message}</span>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Nhập lại mật khẩu mới</Label>
                <Controller
                    name="confirmPassword"
                    control={control}
                    render={({ field }) => (
                        <Input {...field} id="confirmPassword" type="password" disabled={isLoading} />
                    )}
                />
                {errors.confirmPassword && <span className="text-xs text-red-500">{errors.confirmPassword.message}</span>}
            </div>

            {error && <div className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</div>}
            {success && <div className="text-sm text-green-600 bg-green-50 p-2 rounded">Đổi mật khẩu thành công!</div>}

            <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
            </Button>
        </form>
    );
};