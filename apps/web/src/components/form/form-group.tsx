"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";
import { useState } from "react";

interface FormGroupProps {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  completionStatus?: "complete" | "incomplete" | "error";
}

export function FormGroup({
  title,
  description,
  defaultOpen = true,
  children,
  completionStatus,
}: FormGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="overflow-hidden p-0 hover:shadow-sm hover:-translate-y-0">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-[hsl(var(--muted))]/30"
      >
        <div className="flex items-center gap-3">
          {completionStatus === "complete" && (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
          )}
          {completionStatus === "error" && (
            <AlertCircle className="h-5 w-5 shrink-0 text-[hsl(var(--danger))]" />
          )}
          {(!completionStatus || completionStatus === "incomplete") && (
            <div className="h-5 w-5 shrink-0 rounded-full border-2 border-[hsl(var(--border))]" />
          )}
          <div>
            <h3 className="text-base font-semibold text-[hsl(var(--foreground))]">
              {title}
            </h3>
            {description && (
              <p className="mt-0.5 text-sm text-[hsl(var(--muted-foreground))]">
                {description}
              </p>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-[hsl(var(--muted-foreground))] transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-[hsl(var(--border))] px-6 py-5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
