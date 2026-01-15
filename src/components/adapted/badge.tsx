import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// STYLES ----------------------------------------------------------------------------------------------------------------------------------
export const BADGE = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-4xl border border-transparent px-2 py-0.5 font-medium text-xs transition-all transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline: "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        unwatched: "bg-unwatched text-unwatched-foreground [a]:hover:bg-unwatched/80",
        upcoming: "bg-upcoming text-upcoming-foreground [a]:hover:bg-upcoming/80",
        topRated: "bg-top-rated text-top-rated-foreground [a]:hover:bg-top-rated/80",
        trending: "bg-trending text-trending-foreground [a]:hover:bg-trending/80",
        favorites: "bg-favorites text-favorites-foreground [a]:hover:bg-favorites/80",
        settings: "bg-settings text-settings-foreground [a]:hover:bg-settings/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export function Badge({ className, variant = "default", render, ...props }: useRender.ComponentProps<"span"> & VariantProps<typeof BADGE>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">({ className: cn(BADGE({ className, variant })) }, props),
    render,
    state: { slot: "badge", variant },
  });
}
