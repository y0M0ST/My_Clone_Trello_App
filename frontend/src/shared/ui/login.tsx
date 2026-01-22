import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { useState } from "react";

export function Login({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    // câu hỏi 1: vì sao khi submit thì email và password lần 1 không thay đổi?
    // câu hỏi 2: strict mode là gì? tại sao sử dụng strict mode
    const submit = () => {
        setEmail("eheh");
        setPassword("eheh");
        console.log(email, password);
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle>Login to your account</CardTitle>
                    <CardDescription>Enter your email below to login to your account</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action="post" className="flex flex-col gap-4">
                        <div className="flex flex-col gap-3">
                            <Label htmlFor="email">Email</Label>
                            <Input onChange={(e) => setEmail(e.target.value)} id="email" type="email" required placeholder="m@gmail.com"></Input>
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <a href="#" className="text-sm underline hover:underline">Forgot a password?</a>
                            </div>
                            <Input onChange={(e) => setPassword(e.target.value)} id="email" type="email" required placeholder="m@gmail.com"></Input>
                        </div>
                        <div className="flex flex-col gap-3">
                            <Button onClick={submit} type="submit" className="w-full">Login</Button>
                            <Button variant="outline" className="w-full">Login with Google</Button>
                        </div>
                        <div>
                            <p className="px-1 text-center text-sm text-muted-foreground">
                                Don't have an account? <a href="#" className="underline hover:underline">Sign up</a>
                            </p>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}