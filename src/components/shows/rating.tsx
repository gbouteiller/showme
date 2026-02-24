import { cva } from "class-variance-authority";
import { Badge } from "@/components/adapted/badge";
import { cn } from "@/lib/utils";
import type { Shows } from "@/schemas/shows";

// STYLES ----------------------------------------------------------------------------------------------------------------------------------
const SHOWS_RATING = {
  base: cva("px-1"),
  icon: cva("icon-[line-md--star-filled] size-3"),
};

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export function ShowsRating({ className, show: { rating } }: ShowsRatingProps) {
  return (
    <Badge className={cn(SHOWS_RATING.base(), className)}>
      <span className={SHOWS_RATING.icon()} />
      {rating?.toFixed(1)}
    </Badge>
  );
}
type ShowsRatingProps = { className?: string; show: Shows["Entity"] };
