import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "ring0" | "ring1" | "ring2" | "ring3" | "research" | "outline"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-white/10 text-white hover:bg-white/20": variant === "default",
          "border-transparent bg-ring0 text-white shadow-[0_0_10px_var(--ring-0-glow)]": variant === "ring0",
          "border-transparent bg-ring1 text-white shadow-[0_0_10px_var(--ring-1-glow)]": variant === "ring1",
          "border-transparent bg-ring2 text-white shadow-[0_0_10px_var(--ring-2-glow)]": variant === "ring2",
          "border-transparent bg-ring3 text-white shadow-[0_0_10px_var(--ring-3-glow)]": variant === "ring3",
          "border-transparent bg-research text-white shadow-[0_0_10px_var(--ring-research-glow)]": variant === "research",
          "text-foreground": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
