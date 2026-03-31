import { clsx } from "clsx";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  className,
  id,
  ...props
}: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-[hsl(var(--foreground))]"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={clsx(
          "block w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--card))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--ring))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-[hsl(var(--danger))] focus:border-[hsl(var(--danger))] focus:ring-[hsl(var(--danger))]",
          className,
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-[hsl(var(--danger))]">{error}</p>
      )}
    </div>
  );
}
