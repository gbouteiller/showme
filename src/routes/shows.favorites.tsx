import { createFileRoute } from "@tanstack/react-router";
import { ShowsList } from "@/components/shows/list";
import { api } from "@/convex/_generated/api";

// ROUTE -----------------------------------------------------------------------------------------------------------------------------------
export const Route = createFileRoute("/shows/favorites")({
  component: FavoriteShowsPage,
});

// PAGE ------------------------------------------------------------------------------------------------------------------------------------
function FavoriteShowsPage() {
  return (
    <ShowsList
      description="Explore the shows you have marked as favorite"
      empty="No shows found."
      handler={api.shows.readPaginatedFavorites}
      title="Favorite Shows"
      titleIcon="icon-[lucide--heart]"
    />
  );
}
