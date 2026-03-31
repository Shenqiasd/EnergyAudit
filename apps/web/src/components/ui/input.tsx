import { cn } from "@/lib/utils";
import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, startIcon, endIcon, className, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-semibold text-[hsl(var(--foreground))]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {startIcon && (
            <div className="pointer-events-none absolute left-3 flex items-center text-[hsl(var(--muted-foreground))]">
              {startIcon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              "flex w-full rounded-md border border-[hsl(var(--input))] bg-transparent px-3 py-2 text-sm text-[hsl(var(--foreground))] shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[hsl(var(--muted-foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-[hsl(var(--danger))] focus-visible:ring-[hsl(var(--danger))]",
              startIcon && "pl-10",
              endIcon && "pr-10",
              className,
            )}
            {...props}
          />
          {endIcon && (
            <div className="pointer-events-none absolute right-3 flex items-center text-[hsl(var(--muted-foreground))]">
              {endIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs font-medium text-[hsl(var(--danger))]">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-xs text-[hsl(var(--muted-foreground))]">{helperText}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
