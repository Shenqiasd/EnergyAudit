import { clsx } from "clsx";
import { Loader2 } from "lucide-react";

interface LoadingProps {
  size?: number;
  className?: string;
  text?: string;
}

export function Loading({ size = 24, className, text }: LoadingProps) {
  return (
    <div className={clsx("flex items-center justify-center gap-2", className)}>
      <Loader2 size={size} className="animate-spin text-[hsl(var(--primary))]" />
      {text && (
        <span className="text-sm text-[hsl(var(--muted-foreground))]">{text}</span>
      )}
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex h-full min-h-[400px] items-center justify-center">
      <Loading size={32} text="加载中..." />
    </div>
  );
}
