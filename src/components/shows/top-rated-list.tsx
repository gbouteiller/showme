import { linkOptions } from "@tanstack/react-router";
import { api } from "@/convex/_generated/api";
import { ShowsList } from "./shows-list";

export function TopRatedShowsList({ limit }: TopRatedShowsListProps) {
  return (
    <ShowsList
      config={{
        title: "Meilleures séries",
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

type TopRatedShowsListProps = { limit?: number };
