import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ShowsList } from "@/components/shows/list";
import { api } from "@/convex/_generated/api";

const searchSchema = z.object({
  pageIndex: z.number().default(0).catch(0),
});

// ROUTE -----------------------------------------------------------------------------------------------------------------------------------
export const Route = createFileRoute("/shows/top-rated")({
  validateSearch: searchSchema,
  component: TopRatedShowsPage,
});

// PAGE ------------------------------------------------------------------------------------------------------------------------------------
function TopRatedShowsPage() {
  const { pageIndex } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <ShowsList
      description="Explore the shows most appreciated by critics and the audience"
      empty="No shows found."
      handler={api.shows.readPaginatedTopRated}
      pageIndex={pageIndex}
      setPageIndex={(page) => navigate({ search: (prev) => ({ ...prev, pageIndex: page }) })}
      title="Top Rated Shows"
      titleIcon="icon-[lucide--star]"
    />
  );
}
