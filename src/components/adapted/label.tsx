import { cva } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// STYLES ----------------------------------------------------------------------------------------------------------------------------------
const LABEL = {
  root: cva(
    "flex select-none items-center gap-2 text-xs leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50"
  ),
};

// ROOT ------------------------------------------------------------------------------------------------------------------------------------
export function Label({ className, ...props }: ComponentProps<"label">) {
  // biome-ignore lint/a11y/noLabelWithoutControl: Generic component
  return <label className={cn(LABEL.root(), className)} data-slot="label" {...props} />;
}
