import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentProps, useMemo } from "react";
// Note: Assuming Label and Separator are available in adapted.
// Wait, I created Label and Separator in adapted/ already. I should use them.
import { Label } from "@/components/adapted/label";
import { Separator } from "@/components/adapted/separator";
import { cn } from "@/lib/utils";

// STYLES ----------------------------------------------------------------------------------------------------------------------------------
const FIELD = {
  content: cva("group/field-content flex flex-1 flex-col gap-0.5 leading-snug"),
  description: cva(
    "nth-last-2:-mt-1 text-left font-normal text-muted-foreground text-xs/relaxed leading-normal last:mt-0 group-has-data-[orientation=horizontal]/field:text-balance [&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4 [[data-variant=legend]+&]:-mt-1.5"
  ),
  error: cva("font-normal text-destructive text-xs"),
  group: cva(
    "group/field-group @container/field-group flex w-full flex-col gap-5 data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4"
  ),
  label: cva(
    "group/field-label peer/field-label flex w-fit gap-2 leading-snug has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-none has-[>[data-slot=field]]:border has-data-checked:border-primary/30 has-data-checked:bg-primary/5 *:data-[slot=field]:p-2 group-data-[disabled=true]/field:opacity-50 dark:has-data-checked:border-primary/20 dark:has-data-checked:bg-primary/10"
  ),
  legend: cva("mb-2.5 font-medium data-[variant=label]:text-xs data-[variant=legend]:text-sm"),
  root: cva("group/field flex w-full gap-2 data-[invalid=true]:text-destructive", {
    variants: {
      orientation: {
        vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
        horizontal:
          "flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        responsive:
          "@md/field-group:flex-row flex-col @md/field-group:items-center *:w-full @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }),
  separator: cva("relative -my-2 h-5 text-xs group-data-[variant=outline]/field-group:-mb-2"),
  separatorContent: cva("relative mx-auto block w-fit bg-background px-2 text-muted-foreground"),
  set: cva("flex flex-col gap-4 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3"),
  title: cva("flex w-fit items-center gap-2 text-xs/relaxed leading-snug group-data-[disabled=true]/field:opacity-50"),
};

// ROOT ------------------------------------------------------------------------------------------------------------------------------------
export function Field({ className, orientation = "vertical", ...props }: ComponentProps<"fieldset"> & VariantProps<typeof FIELD.root>) {
  return <fieldset className={cn(FIELD.root({ orientation }), className)} data-orientation={orientation} data-slot="field" {...props} />;
}

// CONTENT ---------------------------------------------------------------------------------------------------------------------------------
export function FieldContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn(FIELD.content(), className)} data-slot="field-content" {...props} />;
}

// DESCRIPTION -----------------------------------------------------------------------------------------------------------------------------
export function FieldDescription({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn(FIELD.description(), className)} data-slot="field-description" {...props} />;
}

// ERROR -----------------------------------------------------------------------------------------------------------------------------------
export function FieldError({
  className,
  children,
  errors,
  ...props
}: ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>;
}) {
  const content = useMemo(() => {
    if (children) {
      return children;
    }

    if (!errors?.length) {
      return null;
    }

    const uniqueErrors = [...new Map(errors.map((error) => [error?.message, error])).values()];

    if (uniqueErrors?.length === 1) {
      return uniqueErrors[0]?.message;
    }

    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map((error) => error?.message && <li key={error.message}>{error.message}</li>)}
      </ul>
    );
  }, [children, errors]);

  if (!content) {
    return null;
  }

  return (
    <div className={cn(FIELD.error(), className)} data-slot="field-error" role="alert" {...props}>
      {content}
    </div>
  );
}

// GROUP -----------------------------------------------------------------------------------------------------------------------------------
export function FieldGroup({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn(FIELD.group(), className)} data-slot="field-group" {...props} />;
}

// LABEL -----------------------------------------------------------------------------------------------------------------------------------
export function FieldLabel({ className, ...props }: ComponentProps<typeof Label>) {
  return <Label className={cn(FIELD.label(), className)} data-slot="field-label" {...props} />;
}

// LEGEND ----------------------------------------------------------------------------------------------------------------------------------
export function FieldLegend({ className, variant = "legend", ...props }: ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return <legend className={cn(FIELD.legend(), className)} data-slot="field-legend" data-variant={variant} {...props} />;
}

// SEPARATOR -------------------------------------------------------------------------------------------------------------------------------
export function FieldSeparator({ children, className, ...props }: ComponentProps<"div"> & { children?: React.ReactNode }) {
  return (
    <div className={cn(FIELD.separator(), className)} data-content={!!children} data-slot="field-separator" {...props}>
      <Separator className="absolute inset-0 top-1/2" />
      {children && (
        <span className={FIELD.separatorContent()} data-slot="field-separator-content">
          {children}
        </span>
      )}
    </div>
  );
}

// SET -------------------------------------------------------------------------------------------------------------------------------------
export function FieldSet({ className, ...props }: ComponentProps<"fieldset">) {
  return <fieldset className={cn(FIELD.set(), className)} data-slot="field-set" {...props} />;
}

// TITLE -----------------------------------------------------------------------------------------------------------------------------------
export function FieldTitle({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn(FIELD.title(), className)} data-slot="field-label" {...props} />;
}
