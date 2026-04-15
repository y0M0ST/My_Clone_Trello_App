import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { PasswordInput } from "@/shared/ui/password-input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/shared/ui/field";

import { tokenStorage } from "@/shared/utils/tokenStorage"
import type { OAuthResult } from "@/shared/types";
import { Link } from "react-router-dom";
import { useAuth } from "../model";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ROUTES } from "@/shared/config";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormSchema = z.infer<typeof formSchema>;

interface OAuthFormProps {
  onSuccess: (result: OAuthResult) => void;
}

export const LoginForm = ({ onSuccess }: OAuthFormProps) => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState<string | null>(null);

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: FormSchema) => {
    try {
      setLoginError(null)
      const result = await login(data.email, data.password)
      // console.log("Login result:", result)
      const { user, accessToken, refreshToken } = result
      tokenStorage.setUser(user)
      tokenStorage.setAccessToken(accessToken)
      tokenStorage.setRefreshToken(refreshToken)

      if (onSuccess) {
        onSuccess(result);
      } else {
        navigate(ROUTES.DASHBOARD)
      }
    } catch (error) {
      setLoginError("Incorrect email or password, please try again.")
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto">
      <Card className="bg-white/10 backdrop-blur-xs shadow-lg rounded-xl border border-white/20">
        <CardHeader className="text-center text-white pb-2"> {/* Giảm padding bottom header */}
          <CardTitle className="text-2xl font-semibold">TaskFlow Welcome</CardTitle>
          <CardDescription className="text-sm text-white/80">Enter your email and password below to login</CardDescription>
        </CardHeader>
        <CardContent className="py-4 px-6">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* Thêm space-y-3 để các field gần nhau hơn */}
            <FieldGroup className="space-y-1">
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className="font-medium text-gray-100 text-sm mb-1.5" htmlFor="email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="email"
                      type="email"
                      disabled={isLoading}
                      autoComplete="off"
                      // Giảm padding p-3 -> p-2.5 cho gọn
                      className="p-2.5 rounded-md border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 bg-white/5 text-sm"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <div className="flex items-center justify-between mb-1.5">
                      <FieldLabel className="font-medium text-gray-100 text-sm" htmlFor="password">Password</FieldLabel>
                      {/* Đưa Forgot Password lên ngang hàng Label cho gọn */}
                      <Link
                        to="/forgot-password"
                        className="text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                        tabIndex={-1}
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <PasswordInput
                      {...field}
                      id="password"
                      disabled={isLoading}
                      autoComplete="current-password"
                      // Giảm padding p-3 -> p-2.5
                      className="p-2.5 rounded-md border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400 bg-white/5 text-sm"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              {loginError && (
                // Giảm margin top mt-4 -> mt-2
                <div className="text-sm text-red-400 text-center p-2 bg-red-900/30 rounded-md mt-2 border border-red-500/30">
                  {loginError}
                </div>
              )}

              <Field>
                <Button
                  type="submit"
                  disabled={isLoading}
                  // Giảm margin top mt-4 -> mt-3 và padding y py-3 -> py-2.5
                  className="w-full py-2.5 mt-3 text-white bg-blue-500 hover:bg-blue-600 rounded-md transition duration-300 font-medium text-sm"
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>

                {/* Giảm margin y my-6 -> my-4 */}
                <div className="flex items-center gap-4 my-4">
                  <div className="h-px bg-white/20 flex-1" />
                  <span className="text-[10px] uppercase text-white/50 font-medium tracking-wide">Or continue with</span>
                  <div className="h-px bg-white/20 flex-1" />
                </div>

                <a
                  href={`${import.meta.env.VITE_API_URL}/auth/google`}
                  // Giảm padding một xíu
                  className="w-full flex items-center justify-center gap-3 py-2 bg-white hover:bg-gray-100 text-gray-800 rounded-lg transition-all duration-300 font-medium shadow-sm hover:shadow-md active:scale-[0.98] text-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
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

                {/* Giảm margin top mt-6 -> mt-4 */}
                <FieldDescription className="text-center text-sm mt-4 text-gray-300">
                  Don&apos;t have an account? <a href="/register" className="text-blue-400 hover:text-blue-300 hover:underline font-medium transition-colors">Sign up</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};