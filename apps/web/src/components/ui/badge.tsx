import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-700",
        primary: "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]",
        secondary: "bg-gray-100 text-gray-500",
        outline: "border border-[hsl(var(--border))] text-[hsl(var(--foreground))]",
        destructive: "bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))]",
        success: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
        warning: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
        danger: "bg-[hsl(var(--danger))]/10 text-[hsl(var(--danger))]",
      },
      pulse: {
        true: "animate-pulse",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      pulse: false,
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, pulse, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant, pulse, className }))}
      {...props}
    />
  )
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
