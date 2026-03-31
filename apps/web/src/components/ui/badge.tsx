import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors border",
  {
    variants: {
      variant: {
        default: "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border-transparent",
        primary: "bg-[hsl(var(--primary))/10] text-[hsl(var(--primary))] border-[hsl(var(--primary))/20]",
        secondary: "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] border-transparent",
        outline: "border-[hsl(var(--border))] text-[hsl(var(--foreground))]",
        destructive: "bg-[hsl(var(--destructive))/10] text-[hsl(var(--destructive))] border-[hsl(var(--destructive))/20]",
        success: "bg-[hsl(var(--success))/10] text-[hsl(var(--success))] border-[hsl(var(--success))/20]",
        warning: "bg-[hsl(var(--warning))/10] text-[hsl(var(--warning))] border-[hsl(var(--warning))/20]",
        danger: "bg-[hsl(var(--danger))/10] text-[hsl(var(--danger))] border-[hsl(var(--danger))/20]",
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
