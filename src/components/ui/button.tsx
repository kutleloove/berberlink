import * as React from "react"
import { cn } from "@/lib/utils"

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "ghost", size?: "default" | "sm" | "xs" }>(
    ({ className, variant = "default", size = "default", ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50",
                    {
                        "bg-slate-900 text-slate-50 hover:bg-slate-900/90": variant === "default",
                        "border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900": variant === "outline",
                        "hover:bg-slate-100 hover:text-slate-900": variant === "ghost",
                        "h-9 px-4 py-2": size === "default",
                        "h-8 rounded-md px-3 text-xs": size === "sm",
                        "h-6 rounded px-2 text-[10px]": size === "xs",
                    },
                    className
                )}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
