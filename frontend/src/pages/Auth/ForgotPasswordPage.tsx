import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { PasswordInput } from "@/shared/ui/password-input"; 
import { apiFactory, API_ENDPOINTS } from "@/shared/api";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export const ForgotPasswordPage = () => {
    const navigate = useNavigate();

    const [step, setStep] = useState<1 | 2>(1);

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const bgImage = "https://images.unsplash.com/photo-1602756040210-13c501d16e80?q=80&w=1366&auto=format&fit=crop";

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await apiFactory.post(API_ENDPOINTS.AUTH.FORGET_PASSWORD, { email });
            setStep(2);
        } catch (err: any) {
            setError(err.response?.data?.message || "Không tìm thấy email này.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError("Mật khẩu nhập lại không khớp.");
            return;
        }

        setIsLoading(true);

        try {
            await apiFactory.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
                email,
                otp,
                password: newPassword
            });

            setSuccess(true);
            setTimeout(() => navigate("/login"), 2000);

        } catch (err: any) {
            setError(err.response?.data?.message || "Mã OTP không đúng hoặc đã hết hạn.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="relative min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
            style={{ backgroundImage: `url('${bgImage}')` }}
        >
            <div className="absolute inset-0 bg-black/50" />

            <div className="w-full max-w-md z-10 relative">
                <Card className="bg-white/10 backdrop-blur-md shadow-xl rounded-xl border border-white/20">

                    <CardHeader className="text-center text-white">
                        <CardTitle className="text-2xl font-semibold">
                            {success ? "Thành công!" : (step === 1 ? "Quên mật khẩu?" : "Đặt lại mật khẩu")}
                        </CardTitle>
                        <CardDescription className="text-white/80">
                            {success
                                ? "Mật khẩu đã được cập nhật."
                                : (step === 1
                                    ? "Nhập email để nhận mã xác thực 6 số."
                                    : `Nhập mã đã gửi tới ${email}`
                                )
                            }
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="py-4 px-6">

                        {success ? (
                            <div className="text-center space-y-4 py-4">
                                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-green-400">
                                    <CheckCircle2 className="w-8 h-8 animate-bounce" />
                                </div>
                                <p className="text-gray-200 text-sm">Đang chuyển hướng về trang đăng nhập...</p>
                            </div>
                        ) : (
                            <>
                                {step === 1 && (
                                    <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-gray-100">Email đăng ký</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="name@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                disabled={isLoading}
                                                className="p-3 bg-white/5 border-white/20 text-white placeholder-gray-400 focus:ring-blue-500"
                                            />
                                        </div>

                                        {error && <div className="text-sm text-red-400 text-center bg-red-900/30 p-2 rounded">{error}</div>}

                                        <Button type="submit" disabled={isLoading} className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white">
                                            {isLoading ? "Đang gửi..." : "Gửi mã xác nhận"}
                                        </Button>
                                    </form>
                                )}
                                {step === 2 && (
                                    <form onSubmit={handleResetPassword} className="flex flex-col gap-4">

                                        <div className="space-y-2">
                                            <Label className="text-gray-100">Mã xác thực (6 số)</Label>
                                            <Input
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value)}
                                                placeholder="123456"
                                                maxLength={6}
                                                className="text-center text-2xl font-bold tracking-widest bg-white/5 border-white/20 text-white"
                                                required
                                                autoComplete="off"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-gray-100">Mật khẩu mới</Label>
                                            <PasswordInput
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Min 6 characters"
                                                className="bg-white/5 border-white/20 text-white placeholder-gray-400"
                                                    required
                                                    autoComplete="new-password"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-gray-100">Nhập lại mật khẩu</Label>
                                            <PasswordInput
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Re-enter password"
                                                className="bg-white/5 border-white/20 text-white placeholder-gray-400"
                                                    required
                                                    autoComplete="new-password"
                                            />
                                        </div>

                                        {error && <div className="text-sm text-red-400 text-center bg-red-900/30 p-2 rounded">{error}</div>}

                                        <Button type="submit" disabled={isLoading} className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white">
                                            {isLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
                                        </Button>

                                        <div className="text-center">
                                            <Button variant="link" type="button" onClick={() => setStep(1)} className="text-gray-300 text-sm hover:text-white">
                                                Quay lại nhập Email
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </>
                        )}

                        <div className="mt-6 text-center">
                            <Link to="/login" className="inline-flex items-center text-sm text-gray-300 hover:text-white transition-colors">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại đăng nhập
                            </Link>
                        </div>

                    </CardContent>
                </Card>
            </div>
        </div>
    );
};