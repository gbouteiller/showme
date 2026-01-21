import { linkOptions } from "@tanstack/react-router";
import { api } from "@/convex/_generated/api";
import { ShowsList, ShowsListPaginated } from "./shows-list";

export function TopRatedShowsList({ limit, paginated = false, itemsPerPage = 10 }: TopRatedShowsListProps) {
  if (paginated) {
    return (
      <ShowsListPaginated
        config={{
          title: "Top Rated Shows",
          icon: "icon-[lucide--star]",
          link: linkOptions({ to: "/series/a-decouvrir" }),
          variant: "topRated",
          paginatedQuery: api.shows.readManyTopRatedUnsetPaginated,
          queryKey: ["shows", "topRated", "unset", "paginated"],
        }}
        itemsPerPage={itemsPerPage}
      />
    );
  }

  return (
    <ShowsList
      config={{
        title: "Top Rated Shows",
        icon: "icon-[lucide--star]",
        link: linkOptions({ to: "/series/a-decouvrir" }),
        variant: "topRated",
        query: api.shows.readManyTopRatedUnset,
        queryKey: ["shows", "topRated", "unset"],
      }}
      limit={limit}
    />
  );
}

type TopRatedShowsListProps = {
  limit?: number;
  paginated?: boolean;
  itemsPerPage?: number;
};
