import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ShowsList } from "@/components/shows/list";
import { api } from "@/convex/_generated/api";

const searchSchema = z.object({
  pageIndex: z.number().catch(0),
});

// ROUTE -----------------------------------------------------------------------------------------------------------------------------------
export const Route = createFileRoute("/shows/favorites")({
  validateSearch: searchSchema,
  component: FavoriteShowsPage,
});

// PAGE ------------------------------------------------------------------------------------------------------------------------------------
function FavoriteShowsPage() {
  const { pageIndex } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <ShowsList
      description="Explore the shows you have marked as favorite"
      empty="No shows found."
      handler={api.shows.readPaginatedFavorites}
      pageIndex={pageIndex}
      setPageIndex={(page) => navigate({ search: (prev) => ({ ...prev, pageIndex: page }) })}
      title="Favorite Shows"
      titleIcon="icon-[lucide--heart]"
    />
  );
}
