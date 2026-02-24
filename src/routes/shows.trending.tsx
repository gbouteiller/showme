import { createFileRoute } from "@tanstack/react-router";
import { ShowsList } from "@/components/shows/list";
import { api } from "@/convex/_generated/api";

// ROUTE -----------------------------------------------------------------------------------------------------------------------------------
export const Route = createFileRoute("/shows/trending")({
  component: TrendingShowsPage,
});

// PAGE ------------------------------------------------------------------------------------------------------------------------------------
function TrendingShowsPage() {
  return (
    <ShowsList
      description="Discover the shows everyone is talking about"
      empty="No shows found."
      handler={api.shows.readPaginatedTrending}
      title="Trending Shows"
      titleIcon="icon-[lucide--trending-up]"
    />
  );
}
