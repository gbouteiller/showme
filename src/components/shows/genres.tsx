import { cva } from "class-variance-authority";
import { Badge } from "@/components/adapted/badge";
import type { Shows } from "@/schemas/shows";

// STYLES ----------------------------------------------------------------------------------------------------------------------------------
export const SHOWS_GENRES = {
  badge: cva("text-xs"),
  base: cva("flex flex-wrap gap-1"),
};

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export function ShowsGenres({ show }: ShowsGenresProps) {
  return (
    <div className={SHOWS_GENRES.base()}>
      {show.genres.map((genre) => (
        <Badge className={SHOWS_GENRES.badge()} key={genre} variant="secondary">
          {genre}
        </Badge>
      ))}
    </div>
  );
}
export type ShowsGenresProps = { show: Shows["Entity"] };
