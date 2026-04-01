import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border",
  {
    variants: {
      variant: {
        default: "bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border-transparent",
        primary: "bg-[hsl(226_48%_38%_/_0.1)] text-[hsl(var(--primary))] border-[hsl(226_48%_38%_/_0.15)]",
        secondary: "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] border-transparent",
        outline: "border-[hsl(var(--border))] text-[hsl(var(--foreground))] bg-transparent",
        destructive: "bg-[hsl(0_72%_51%_/_0.1)] text-[hsl(var(--destructive))] border-[hsl(0_72%_51%_/_0.15)]",
        success: "bg-[hsl(142_71%_35%_/_0.1)] text-[hsl(var(--success))] border-[hsl(142_71%_35%_/_0.15)]",
        warning: "bg-[hsl(35_92%_50%_/_0.1)] text-[hsl(35_80%_38%)] border-[hsl(35_92%_50%_/_0.2)]",
        danger: "bg-[hsl(0_72%_51%_/_0.1)] text-[hsl(var(--danger))] border-[hsl(0_72%_51%_/_0.15)]",
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
