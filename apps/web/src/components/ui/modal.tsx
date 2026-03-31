"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  full: "max-w-[calc(100vw-2rem)] h-[calc(100vh-2rem)]",
} as const;

type DialogSize = keyof typeof sizeClasses;

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  size?: DialogSize;
}

function Modal({ open, onClose, title, children, className, size = "md" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50 animate-in fade-in-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        className={cn(
          "relative z-50 w-full grid gap-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-xl duration-200 animate-in fade-in-0 zoom-in-95 slide-in-from-top-[48%]",
          sizeClasses[size],
          className,
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-[hsl(var(--muted-foreground))] opacity-70 transition-opacity hover:bg-[hsl(var(--muted))] hover:opacity-100 focus:outline-none"
          aria-label="关闭"
        >
          <X className="h-5 w-5" />
        </button>
        {title && (
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <h2
              id="modal-title"
              className="text-lg font-semibold leading-none tracking-tight text-[hsl(var(--foreground))]"
            >
              {title}
            </h2>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export { Modal };
