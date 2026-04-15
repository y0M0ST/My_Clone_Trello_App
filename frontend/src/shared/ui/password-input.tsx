import * as React from "react";
import { Input } from "@/shared/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/shared/utils";

export interface PasswordInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> { }

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ className, type, ...props }, ref) => { 
        const [showPassword, setShowPassword] = React.useState(false);

        return (
            <div className="relative group"> 
                <Input
                    className={cn("pr-10", className)}
                    ref={ref}
                    {...props}
                    type={showPassword ? "text" : "password"}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={props.disabled}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                    tabIndex={-1}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                    {showPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                </button>
            </div>
        );
    }
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };