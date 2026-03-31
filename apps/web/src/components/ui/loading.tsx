import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { forwardRef, type HTMLAttributes } from "react";

/* ────────── Spinner ────────── */

const spinnerVariants = cva("animate-spin text-[hsl(var(--primary))]", {
  variants: {
    size: {
      sm: "h-4 w-4",
      default: "h-6 w-6",
      lg: "h-8 w-8",
      xl: "h-12 w-12",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export interface SpinnerProps
  extends HTMLAttributes<SVGSVGElement>,
    VariantProps<typeof spinnerVariants> {}

const Spinner = forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size, ...props }, ref) => (
    <Loader2
      ref={ref}
      className={cn(spinnerVariants({ size, className }))}
      {...props}
    />
  )
);
Spinner.displayName = "Spinner";

/* ────────── Loading (backward-compatible) ────────── */

interface LoadingProps {
  size?: number;
  className?: string;
  text?: string;
}

function Loading({ size = 24, className, text }: LoadingProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Loader2 size={size} className="animate-spin text-[hsl(var(--primary))]" />
      {text && (
        <span className="text-sm text-[hsl(var(--muted-foreground))]">{text}</span>
      )}
    </div>
  );
}

function PageLoading() {
  return (
    <div className="flex h-full min-h-[400px] items-center justify-center">
      <Loading size={32} text="加载中..." />
    </div>
  );
}

export { Spinner, Loading, PageLoading };
