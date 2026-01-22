// frontend/src/pages/ResetPasswordPage/ResetPasswordPage.tsx
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { PasswordInput } from "@/shared/ui/password-input"; 
import { apiFactory, API_ENDPOINTS } from "@/shared/api";
import { CheckCircle2 } from "lucide-react";

export const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token"); 

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const bgImage = "https://images.unsplash.com/photo-1602756040210-13c501d16e80?q=80&w=1366&auto=format&fit=crop";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (!token) {
            setError("Invalid or missing reset token.");
            return;
        }

        setIsLoading(true);

        try {
            await apiFactory.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
                token,
                password
            });
            setIsSuccess(true);
            setTimeout(() => navigate("/login"), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || "Reset password failed. Try requesting a new link.");
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
                        <CardTitle className="text-2xl font-semibold">Reset Password</CardTitle>
                        <CardDescription className="text-white/80">
                            Enter your new password below
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="py-4 px-6">
                        {!isSuccess ? (
                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="password" className="font-medium text-gray-100">New Password</Label>
                                    <PasswordInput
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Min 6 characters"
                                        disabled={isLoading}
                                        className="p-3 rounded-md border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 bg-transparent"
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="confirmPassword" className="font-medium text-gray-100">Confirm Password</Label>
                                    <PasswordInput
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter password"
                                        disabled={isLoading}
                                        className="p-3 rounded-md border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 bg-transparent"
                                    />
                                </div>

                                {error && (
                                    <div className="text-sm text-red-400 text-center p-2 bg-red-900/30 rounded border border-red-500/30">
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={isLoading || password.length < 6}
                                    className="w-full py-3 mt-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md transition duration-300"
                                >
                                    {isLoading ? "Resetting..." : "Set New Password"}
                                </Button>
                            </form>
                        ) : (
                            <div className="text-center py-6 space-y-4">
                                <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center text-green-400">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold text-white">Password Reset!</h3>
                                <p className="text-gray-200 text-sm">
                                    Your password has been successfully updated. <br />
                                    Redirecting to login...
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};