import React from "react";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Button } from "@/shared/ui/button";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/ui/card";
import { PasswordInput } from "@/shared/ui/password-input";
import { passwordFieldSchema } from "@/shared/validation/password";

const registerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    password: passwordFieldSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
    onSubmit: (data: { name: string; email: string; password: string }) => void;
    isLoading: boolean;
    error: string | null;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit, isLoading, error }) => {
    const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const handleFormSubmit = (data: RegisterFormValues) => {
        const { confirmPassword, ...apiData } = data;
        onSubmit(apiData);
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-md mx-auto">
            <Card className="bg-white/10 backdrop-blur-md shadow-lg rounded-xl border border-white/20">
                <CardHeader className="text-center text-white">
                    <CardTitle className="text-2xl font-semibold">Create an account</CardTitle>
                    <CardDescription className="text-sm text-white/80">Enter your information below to sign up</CardDescription>
                </CardHeader>

                <CardContent className="py-4 px-6">
                    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="name" className="font-medium text-gray-100">Name</Label>
                            <Controller
                                name="name"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        id="name"
                                        placeholder="Your name"
                                        disabled={isLoading}
                                        autoComplete="new-password"
                                        className="p-3 rounded-md border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 bg-white/5"
                                    />
                                )}
                            />
                            {errors.name && <span className="text-sm text-red-400">{errors.name.message}</span>}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="email" className="font-medium text-gray-100">Email</Label>
                            <Controller
                                name="email"
                                control={control}
                                render={({ field }) => (
                                    <Input
                                        {...field}
                                        id="email"
                                        type="email"
                                        placeholder="your@email.com"
                                        disabled={isLoading}
                                        autoComplete="new-password"
                                        className="p-3 rounded-md border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 bg-white/5"
                                    />
                                )}
                            />
                            {errors.email && <span className="text-sm text-red-400">{errors.email.message}</span>}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="password" className="font-medium text-gray-100">Password</Label>
                            <Controller
                                name="password"
                                control={control}
                                render={({ field }) => (
                                    <PasswordInput
                                        {...field}
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        disabled={isLoading}
                                        autoComplete="new-password"
                                        className="p-3 rounded-md border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 bg-white/5"
                                    />
                                )}
                            />
                            {errors.password && <span className="text-sm text-red-400">{errors.password.message}</span>}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="confirmPassword" className="font-medium text-gray-100">Confirm Password</Label>
                            <Controller
                                name="confirmPassword"
                                control={control}
                                render={({ field }) => (
                                    <PasswordInput
                                        {...field}
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        disabled={isLoading}
                                        className="p-3 rounded-md border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 bg-white/5"
                                    />
                                )}
                            />
                            {errors.confirmPassword && <span className="text-sm text-red-400">{errors.confirmPassword.message}</span>}
                        </div>

                        {error && (
                            <div className="text-sm text-red-400 text-center p-2 bg-red-900/30 rounded-md mt-2 border border-red-500/30">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-3 py-3 text-white bg-blue-500 hover:bg-blue-600 rounded-md transition duration-300 font-medium"
                        >
                            {isLoading ? "Creating account..." : "Sign up"}
                        </Button>

                        <div className="flex items-center gap-4 my-4">
                            <div className="h-px bg-white/20 flex-1" />
                            <span className="text-xs uppercase text-white/50 font-medium">Or continue with</span>
                            <div className="h-px bg-white/20 flex-1" />
                        </div>

                        <a
                            href={`${import.meta.env.VITE_API_URL}/auth/google`}
                            className="w-full flex items-center justify-center gap-3 py-2.5 bg-white hover:bg-gray-100 text-gray-800 rounded-lg transition-all duration-300 font-medium shadow-sm hover:shadow-md active:scale-[0.98]"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    fill="#4285F4"
                                />
                                <path
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    fill="#34A853"
                                />
                                <path
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    fill="#FBBC05"
                                />
                                <path
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    fill="#EA4335"
                                />
                            </svg>
                            <span>Sign in with Google</span>
                        </a>

                        <p className="px-1 text-center text-sm text-gray-300 mt-3">
                            Already have an account?{" "}
                            <Link to="/login" className="text-blue-400 hover:text-blue-300 hover:underline font-medium transition-colors">
                                Login
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default RegisterForm;
