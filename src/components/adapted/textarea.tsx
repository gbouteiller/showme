import { cva } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// STYLES ----------------------------------------------------------------------------------------------------------------------------------
const TEXTAREA = {
  root: cva(
    "field-sizing-content flex min-h-16 w-full rounded-none border border-input bg-transparent px-2.5 py-2 text-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 md:text-xs dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 dark:disabled:bg-input/80"
  ),
};

// ROOT ------------------------------------------------------------------------------------------------------------------------------------
export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(TEXTAREA.root(), className)} data-slot="textarea" {...props} />;
}
