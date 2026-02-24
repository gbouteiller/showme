import { cva } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// STYLES ----------------------------------------------------------------------------------------------------------------------------------
const CARD = {
  action: cva("col-start-2 row-span-2 row-start-1 self-start justify-self-end"),
  content: cva("px-4 group-data-[size=sm]/card:px-3"),
  description: cva("text-muted-foreground text-xs/relaxed"),
  footer: cva("flex items-center rounded-none border-t p-4 group-data-[size=sm]/card:p-3"),
  header: cva(
    "group/card-header @container/card-header grid auto-rows-min items-start gap-1 rounded-none px-4 has-data-[slot=card-action]:grid-cols-[1fr_auto] has-data-[slot=card-description]:grid-rows-[auto_auto] group-data-[size=sm]/card:px-3 [.border-b]:pb-4 group-data-[size=sm]/card:[.border-b]:pb-3"
  ),
  root: cva(
    "group/card flex flex-col gap-4 overflow-hidden rounded-none bg-card py-4 text-card-foreground text-xs/relaxed ring-1 ring-foreground/10 has-[>img:first-child]:pt-0 has-data-[slot=card-footer]:pb-0 data-[size=sm]:gap-2 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-none *:[img:last-child]:rounded-none"
  ),
  title: cva("font-medium text-sm group-data-[size=sm]/card:text-sm"),
};

// ROOT ------------------------------------------------------------------------------------------------------------------------------------
export function Card({ className, size = "default", ...props }: ComponentProps<"div"> & { size?: "default" | "sm" }) {
  return <div className={cn(CARD.root(), className)} data-size={size} data-slot="card" {...props} />;
}

// ACTION ----------------------------------------------------------------------------------------------------------------------------------
export function CardAction({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn(CARD.action(), className)} data-slot="card-action" {...props} />;
}

// CONTENT ---------------------------------------------------------------------------------------------------------------------------------
export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn(CARD.content(), className)} data-slot="card-content" {...props} />;
}

// DESCRIPTION -----------------------------------------------------------------------------------------------------------------------------
export function CardDescription({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn(CARD.description(), className)} data-slot="card-description" {...props} />;
}

// FOOTER ----------------------------------------------------------------------------------------------------------------------------------
export function CardFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn(CARD.footer(), className)} data-slot="card-footer" {...props} />;
}

// HEADER ----------------------------------------------------------------------------------------------------------------------------------
export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn(CARD.header(), className)} data-slot="card-header" {...props} />;
}

// TITLE -----------------------------------------------------------------------------------------------------------------------------------
export function CardTitle({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn(CARD.title(), className)} data-slot="card-title" {...props} />;
}
