import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog";
import { cva } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Button } from "@/components/adapted/button";
import { cn } from "@/lib/utils";

// STYLES ----------------------------------------------------------------------------------------------------------------------------------
const ALERT_DIALOG = {
  content: cva(
    "data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 group/alert-dialog-content fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 gap-4 rounded-none bg-background p-4 outline-none ring-1 ring-foreground/10 duration-100 data-[size=default]:max-w-xs data-[size=sm]:max-w-xs data-closed:animate-out data-open:animate-in data-[size=default]:sm:max-w-sm"
  ),
  description: cva(
    "text-balance text-muted-foreground text-xs/relaxed md:text-pretty *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground"
  ),
  footer: cva(
    "flex flex-col-reverse gap-2 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end"
  ),
  header: cva(
    "grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr] has-data-[slot=alert-dialog-media]:gap-x-4 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-left sm:group-data-[size=default]/alert-dialog-content:has-data-[slot=alert-dialog-media]:grid-rows-[auto_1fr]"
  ),
  media: cva(
    "mb-2 inline-flex size-10 items-center justify-center rounded-none bg-muted sm:group-data-[size=default]/alert-dialog-content:row-span-2 *:[svg:not([class*='size-'])]:size-6"
  ),
  overlay: cva(
    "data-closed:fade-out-0 data-open:fade-in-0 fixed inset-0 isolate z-50 bg-black/10 duration-100 data-closed:animate-out data-open:animate-in supports-backdrop-filter:backdrop-blur-xs"
  ),
  title: cva(
    "font-medium text-sm sm:group-data-[size=default]/alert-dialog-content:group-has-data-[slot=alert-dialog-media]/alert-dialog-content:col-start-2"
  ),
};

// ROOT ------------------------------------------------------------------------------------------------------------------------------------
export function AlertDialog({ ...props }: AlertDialogPrimitive.Root.Props) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

// ACTION ----------------------------------------------------------------------------------------------------------------------------------
export function AlertDialogAction({ className, ...props }: ComponentProps<typeof Button>) {
  return <Button className={className} data-slot="alert-dialog-action" {...props} />;
}

// CANCEL ----------------------------------------------------------------------------------------------------------------------------------
export function AlertDialogCancel({
  className,
  variant = "outline",
  size = "default",
  ...props
}: AlertDialogPrimitive.Close.Props & Pick<ComponentProps<typeof Button>, "variant" | "size">) {
  return (
    <AlertDialogPrimitive.Close
      className={className}
      data-slot="alert-dialog-cancel"
      render={<Button size={size} variant={variant} />}
      {...props}
    />
  );
}

// CONTENT ---------------------------------------------------------------------------------------------------------------------------------
export function AlertDialogContent({
  className,
  size = "default",
  ...props
}: AlertDialogPrimitive.Popup.Props & { size?: "default" | "sm" }) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Popup
        className={cn(ALERT_DIALOG.content(), className)}
        data-size={size}
        data-slot="alert-dialog-content"
        {...props}
      />
    </AlertDialogPortal>
  );
}

// DESCRIPTION -----------------------------------------------------------------------------------------------------------------------------
export function AlertDialogDescription({ className, ...props }: ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      className={cn(ALERT_DIALOG.description(), className)}
      data-slot="alert-dialog-description"
      {...props}
    />
  );
}

// FOOTER ----------------------------------------------------------------------------------------------------------------------------------
export function AlertDialogFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn(ALERT_DIALOG.footer(), className)} data-slot="alert-dialog-footer" {...props} />;
}

// HEADER ----------------------------------------------------------------------------------------------------------------------------------
export function AlertDialogHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn(ALERT_DIALOG.header(), className)} data-slot="alert-dialog-header" {...props} />;
}

// MEDIA -----------------------------------------------------------------------------------------------------------------------------------
export function AlertDialogMedia({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn(ALERT_DIALOG.media(), className)} data-slot="alert-dialog-media" {...props} />;
}

// OVERLAY ---------------------------------------------------------------------------------------------------------------------------------
export function AlertDialogOverlay({ className, ...props }: AlertDialogPrimitive.Backdrop.Props) {
  return <AlertDialogPrimitive.Backdrop className={cn(ALERT_DIALOG.overlay(), className)} data-slot="alert-dialog-overlay" {...props} />;
}

// PORTAL ----------------------------------------------------------------------------------------------------------------------------------
export function AlertDialogPortal({ ...props }: AlertDialogPrimitive.Portal.Props) {
  return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />;
}

// TITLE -----------------------------------------------------------------------------------------------------------------------------------
export function AlertDialogTitle({ className, ...props }: ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return <AlertDialogPrimitive.Title className={cn(ALERT_DIALOG.title(), className)} data-slot="alert-dialog-title" {...props} />;
}

// TRIGGER ---------------------------------------------------------------------------------------------------------------------------------
export function AlertDialogTrigger({ ...props }: AlertDialogPrimitive.Trigger.Props) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}
