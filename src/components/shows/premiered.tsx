import { cva } from "class-variance-authority";
import { getYear } from "date-fns";
import { Badge } from "@/components/adapted/badge";
import { cn } from "@/lib/utils";
import type { Shows } from "@/schemas/shows";

// STYLES ----------------------------------------------------------------------------------------------------------------------------------
const SHOWS_PREMIERED = {
  base: cva("h-auto gap-1.5"),
  icon: cva("-mt-0.5 size-5 text-primary", {
    variants: {
      status: {
        "In Development": "icon-[ic--baseline-connected-tv]",
        Running: "icon-[ic--baseline-live-tv]",
        Ended: "icon-[ic--baseline-tv-off]",
        "To Be Determined": "icon-[ic--baseline-reset-tv]",
      },
    },
  }),
};

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export function ShowsPremiered({ className, icon = false, show: { premiered, status } }: ShowsPremieredProps) {
  return (
    <Badge className={cn(SHOWS_PREMIERED.base(), className)} variant="secondary">
      {icon && <span className={SHOWS_PREMIERED.icon({ status })} />}
      {premiered ? getYear(premiered) : "????"}
    </Badge>
  );
}
type ShowsPremieredProps = { className?: string; icon?: boolean; show: Shows["Entity"] };
