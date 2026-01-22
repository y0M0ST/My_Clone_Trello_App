import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { apiFactory, API_ENDPOINTS } from "@/shared/api";
import { Label } from "@/shared/ui/label";

export const VerifyPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const email = searchParams.get("email");

    const [otp, setOtp] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Link ảnh nền
    const bgImage = "https://images.unsplash.com/photo-1602756040210-13c501d16e80?q=80&w=1366&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3Dhttps://images.unsplash.com/photo-1602756040210-13c501d16e80?q=80&w=1366&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

    useEffect(() => {
        if (!email) {
            navigate("/login");
        }
    }, [email, navigate]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await apiFactory.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, {
                email: email,
                otp: otp
            });

            setSuccess(true);
            setTimeout(() => {
                navigate("/login");
            }, 2000);

        } catch (err: any) {
            const msg = err.response?.data?.message || "Verification failed";
            setError(msg);
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
                <Card className="bg-white/10 backdrop-blur-md shadow-lg rounded-xl border border-white/20">
                    <CardHeader className="text-center text-white">
                        <CardTitle className="text-2xl font-semibold">Xác thực tài khoản</CardTitle>
                        <CardDescription className="text-sm text-white/80">
                            Chúng tôi đã gửi mã xác nhận 6 số đến email: <br />
                            <span className="font-bold text-white">{email}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="py-4 px-6">
                        {!success ? (
                            <form onSubmit={handleVerify} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="font-medium text-gray-100">Nhập mã xác thực</Label>
                                    <Input
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="123456"
                                        className="text-center text-2xl tracking-widest font-bold p-3 rounded-md border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 bg-transparent"
                                        maxLength={6}
                                        disabled={isLoading}
                                    />
                                </div>

                                {error && <div className="text-red-400 text-sm text-center bg-red-900/30 p-2 rounded-md">{error}</div>}

                                <Button type="submit" className="w-full mt-4 py-3 bg-blue-500 hover:bg-blue-600 text-white" disabled={isLoading || otp.length < 6}>
                                    {isLoading ? "Đang kiểm tra..." : "Xác nhận"}
                                </Button>

                                <div className="text-center mt-4">
                                    <Button variant="link" type="button" className="text-sm text-gray-300 hover:text-white">
                                        Gửi lại mã?
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="text-center space-y-4 py-4">
                                    <div className="text-5xl animate-bounce">✨</div>
                                <h3 className="text-xl font-bold text-green-400">Kích hoạt thành công!</h3>
                                <p className="text-gray-300">Đang chuyển hướng về trang đăng nhập...</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};