import { linkOptions } from "@tanstack/react-router";
import { api } from "@/convex/_generated/api";
import { ShowsList, ShowsListPaginated } from "./shows-list";

const sortByRating = (a: { rating?: number | null }, b: { rating?: number | null }) => {
  const ratingA = a.rating ?? 0;
  const ratingB = b.rating ?? 0;
  return ratingB - ratingA;
};

export function TrendingShowsList({ limit, paginated = false, itemsPerPage = 10 }: TrendingSeriesListProps) {
  if (paginated) {
    return (
      <ShowsListPaginated
        config={{
          title: "Trending Shows",
          icon: "icon-[lucide--trending-up]",
          link: linkOptions({ to: "/series/tendances" }),
          variant: "trending",
          paginatedQuery: api.shows.readManyTrendingUnsetPaginated,
          queryKey: ["shows", "trending", "unset", "paginated"],
          sortFn: sortByRating,
        }}
        itemsPerPage={itemsPerPage}
      />
    );
  }

  return (
    <ShowsList
      config={{
        title: "Trending Shows",
        icon: "icon-[lucide--trending-up]",
        link: linkOptions({ to: "/series/tendances" }),
        variant: "trending",
        query: api.shows.readManyTrendingUnset,
        queryKey: ["shows", "trending", "unset"],
        sortFn: sortByRating,
      }}
      limit={limit}
    />
  );
}

type TrendingSeriesListProps = {
  limit?: number;
  paginated?: boolean;
  itemsPerPage?: number;
};
