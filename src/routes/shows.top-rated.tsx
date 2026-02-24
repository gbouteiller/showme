import { createFileRoute } from "@tanstack/react-router";
import { ShowsList } from "@/components/shows/list";
import { api } from "@/convex/_generated/api";

// ROUTE -----------------------------------------------------------------------------------------------------------------------------------
export const Route = createFileRoute("/shows/top-rated")({
  component: TopRatedShowsPage,
});

// PAGE ------------------------------------------------------------------------------------------------------------------------------------
function TopRatedShowsPage() {
  return (
    <ShowsList
      description="Explore the shows most appreciated by critics and the audience"
      empty="No shows found."
      handler={api.shows.readPaginatedTopRated}
      title="Top Rated Shows"
      titleIcon="icon-[lucide--star]"
    />
  );
}
