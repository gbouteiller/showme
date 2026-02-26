import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ShowsList } from "@/components/shows/list";
import { api } from "@/convex/_generated/api";

const searchSchema = z.object({
  pageIndex: z.number().default(0).catch(0),
});

// ROUTE -----------------------------------------------------------------------------------------------------------------------------------
export const Route = createFileRoute("/shows/trending")({
  validateSearch: searchSchema,
  component: TrendingShowsPage,
});

// PAGE ------------------------------------------------------------------------------------------------------------------------------------
function TrendingShowsPage() {
  const { pageIndex } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <ShowsList
      description="Discover the shows everyone is talking about"
      empty="No shows found."
      handler={api.shows.readPaginatedTrending}
      pageIndex={pageIndex}
      setPageIndex={(page) => navigate({ search: (prev) => ({ ...prev, pageIndex: page }) })}
      title="Trending Shows"
      titleIcon="icon-[lucide--trending-up]"
    />
  );
}
