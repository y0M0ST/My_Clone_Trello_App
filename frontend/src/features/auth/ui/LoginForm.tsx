// frontend/src/features/auth/ui/LoginForm.tsx
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
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
      console.log("Login result:", result)
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
      setLoginError("Invalid email or password, please try again.")
    }
  }


  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto">
      <Card className="bg-white/10 backdrop-blur-md shadow-lg rounded-xl border border-white/20">
        <CardHeader className="text-center text-white">
          <CardTitle className="text-2xl font-semibold">Login to your account</CardTitle>
          <CardDescription className="text-sm text-white/80">Enter your email and password below to login</CardDescription>
        </CardHeader>
        <CardContent className="py-4 px-6">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel className="font-medium text-gray-100" htmlFor="email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="email"
                      type="email"
                      disabled={isLoading}
                      autoComplete="off"
                      className="p-3 rounded-md border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
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
                    <FieldLabel className="font-medium text-gray-100" htmlFor="password">Password</FieldLabel>
                    <PasswordInput
                      {...field}
                      id="password"
                      type="password"
                      disabled={isLoading}
                      autoComplete="new-password"
                      className="p-3 rounded-md border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    <Link
                      to="/forgot-password"
                      className="text-sm text-blue-600 hover:underline mt-2 block text-center"
                      tabIndex={-1}
                    >
                      Forgot password?
                    </Link>
                  </Field>
                )}
              />
              {loginError && (
                <div className="text-sm text-red-500 text-center p-2 bg-red-50 rounded-md mt-4">
                  {loginError}
                </div>
              )}
              <Field>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 mt-4 text-white bg-blue-500 hover:bg-blue-600 rounded-md transition duration-300"
                >
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
                <FieldDescription className="text-center text-sm mt-3 text-gray-300">
                  Don&apos;t have an account? <a href="/register" className="underline text-blue-500">Sign up</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>


  );
};
