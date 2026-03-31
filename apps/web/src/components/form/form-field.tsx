import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  suffix?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  required,
  error,
  helperText,
  suffix,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-[hsl(var(--foreground))]">
        {label}
        {required && (
          <span className="ml-1 text-[hsl(var(--danger))]">*</span>
        )}
      </label>
      <div className="flex items-center gap-2">
        <div className="flex-1">{children}</div>
        {suffix && (
          <span className="shrink-0 text-sm text-[hsl(var(--muted-foreground))]">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p className="text-sm text-[hsl(var(--danger))]">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-[hsl(var(--muted-foreground))]">
          {helperText}
        </p>
      )}
    </div>
  );
}
