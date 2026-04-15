import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { PasswordInput } from "@/shared/ui/password-input";
import { apiFactory, API_ENDPOINTS } from "@/shared/api";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { passwordFieldSchema } from "@/shared/validation/password";

/**
 * Đặt lại mật khẩu bằng mã 6 số gửi qua email (khớp POST /auth/reset-password: email, code, newPassword).
 * Query ?email= hỗ trợ luồng từ forgot-password / hook gửi mã.
 */
export const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const emailFromQuery = searchParams.get("email")?.trim() ?? "";

    const [email, setEmail] = useState(emailFromQuery);
    const [code, setCode] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (emailFromQuery) setEmail(emailFromQuery);
    }, [emailFromQuery]);

    const bgImage =
        "https://images.unsplash.com/photo-1602756040210-13c501d16e80?q=80&w=1366&auto=format&fit=crop";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Mật khẩu nhập lại không khớp.");
            return;
        }

        const pwdCheck = passwordFieldSchema.safeParse(password);
        if (!pwdCheck.success) {
            setError(pwdCheck.error.issues[0]?.message ?? "Mật khẩu không đủ mạnh.");
            return;
        }

        if (!email.trim()) {
            setError("Vui lòng nhập email.");
            return;
        }

        setIsLoading(true);

        try {
            await apiFactory.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
                email: email.trim(),
                code,
                newPassword: password,
            });
            setIsSuccess(true);
            setTimeout(() => navigate("/login"), 3000);
        } catch (err: unknown) {
            const ax = err as { response?: { data?: { message?: string } } };
            setError(
                ax.response?.data?.message ??
                    "Đặt lại mật khẩu thất bại. Kiểm tra mã hoặc yêu cầu mã mới."
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="relative flex min-h-screen items-center justify-center bg-cover bg-center p-4"
            style={{ backgroundImage: `url('${bgImage}')` }}
        >
            <div className="absolute inset-0 bg-black/50" />

            <div className="relative z-10 w-full max-w-md">
                <Card className="rounded-xl border border-white/20 bg-white/10 shadow-xl backdrop-blur-md">
                    <CardHeader className="text-center text-white">
                        <CardTitle className="text-2xl font-semibold">Đặt lại mật khẩu</CardTitle>
                        <CardDescription className="text-white/80">
                            Nhập email, mã 6 số trong email và mật khẩu mới
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="px-6 py-4">
                        {!isSuccess ? (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="email" className="font-medium text-gray-100">
                                        Email
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@example.com"
                                        required
                                        disabled={isLoading}
                                        className="border-2 border-gray-300 bg-transparent p-3 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="code" className="font-medium text-gray-100">
                                        Mã xác thực (6 số)
                                    </Label>
                                    <Input
                                        id="code"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="123456"
                                        maxLength={6}
                                        required
                                        autoComplete="one-time-code"
                                        className="border-2 border-gray-300 bg-transparent p-3 text-center text-2xl font-bold tracking-widest text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="password" className="font-medium text-gray-100">
                                        Mật khẩu mới
                                    </Label>
                                    <PasswordInput
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Ít nhất 8 ký tự, hoa, thường, số hoặc ký tự đặc biệt"
                                        disabled={isLoading}
                                        className="border-2 border-gray-300 bg-transparent p-3 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="confirmPassword" className="font-medium text-gray-100">
                                        Nhập lại mật khẩu
                                    </Label>
                                    <PasswordInput
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Nhập lại"
                                        disabled={isLoading}
                                        className="border-2 border-gray-300 bg-transparent p-3 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {error && (
                                    <div className="rounded border border-red-500/30 bg-red-900/30 p-2 text-center text-sm text-red-400">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isLoading || code.length < 6}
                                    className="mt-2 w-full rounded-md bg-blue-600 py-3 text-white transition duration-300 hover:bg-blue-700"
                                >
                                    {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
                                </Button>

                                <div className="text-center">
                                    <Link
                                        to="/forgot-password"
                                        className="inline-flex items-center text-sm text-gray-300 hover:text-white"
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Quay lại quên mật khẩu
                                    </Link>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-4 py-6 text-center">
                                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                                    <CheckCircle2 className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold text-white">Đã đổi mật khẩu!</h3>
                                <p className="text-sm text-gray-200">
                                    Đang chuyển về trang đăng nhập...
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
