import { clsx } from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

type BadgeVariant = "default" | "primary" | "secondary" | "success" | "warning" | "danger";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  primary: "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]",
  secondary: "bg-gray-100 text-gray-500",
  success: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
  warning: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
  danger: "bg-[hsl(var(--danger))]/10 text-[hsl(var(--danger))]",
};

export function Badge({
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
