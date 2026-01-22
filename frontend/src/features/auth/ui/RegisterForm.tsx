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

const registerSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
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
                                        className="p-3 rounded-md border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 bg-transparent"
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
                                        className="p-3 rounded-md border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 bg-transparent"
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
                                        className="p-3 rounded-md border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 bg-transparent"
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
                                        className="p-3 rounded-md border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 bg-transparent"
                                    />
                                )}
                            />
                            {errors.confirmPassword && <span className="text-sm text-red-400">{errors.confirmPassword.message}</span>}
                        </div>

                        {error && (
                            <div className="text-sm text-red-400 text-center p-2 bg-red-900/30 rounded-md mt-2">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full mt-4 py-3 text-white bg-blue-500 hover:bg-blue-600 rounded-md transition duration-300"
                        >
                            {isLoading ? "Creating account..." : "Sign up"}
                        </Button>

                        <p className="px-1 text-center text-sm text-gray-300 mt-2">
                            Already have an account?{" "}
                            <Link to="/login" className="underline text-blue-400 hover:text-blue-300 font-medium">
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