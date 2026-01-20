import { linkOptions } from "@tanstack/react-router";
import { api } from "@/convex/_generated/api";
import { ShowsList } from "./shows-list";

export function TrendingShowsList({ limit }: TrendingSeriesListProps) {
  return (
    <ShowsList
      config={{
        title: "Séries tendances",
        icon: "icon-[lucide--trending-up]",
        link: linkOptions({ to: "/series/tendances" }),
        variant: "trending",
        query: api.shows.readManyTrendingUnset,
        queryKey: ["shows", "trending", "unset"],
        sortFn: (a, b) => {
          const ratingA = a.rating ?? 0;
          const ratingB = b.rating ?? 0;
          return ratingB - ratingA;
        },
      }}
      limit={limit}
    />
  );
}

type TrendingSeriesListProps = {
  limit?: number;
};
