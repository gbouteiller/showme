import { createFileRoute, linkOptions, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { UnwatchedEpisodesList } from "@/components/episodes/unwatched-list";
import { UpcomingEpisodesList } from "@/components/episodes/upcoming-list";
import { ShowsList } from "@/components/shows/list";
import { api } from "@/convex/_generated/api";

// ROUTE -----------------------------------------------------------------------------------------------------------------------------------
export const Route = createFileRoute("/")({
  component: IndexPage,
  validateSearch: z.object({
    topRatedPage: z.number().catch(1),
    topRatedCursor: z.string().optional(),
    trendingPage: z.number().catch(1),
    trendingCursor: z.string().optional(),
  }),
});

// STYLES ----------------------------------------------------------------------------------------------------------------------------------

// PAGE ------------------------------------------------------------------------------------------------------------------------------------
function IndexPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { topRatedPage, topRatedCursor, trendingPage, trendingCursor } = Route.useSearch();

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <UnwatchedEpisodesList limit={10} />
          <UpcomingEpisodesList limit={10} />
        </div>
        <div className="space-y-6">
          <ShowsList
            cursor={topRatedCursor ?? null}
            icon="icon-[lucide--star]"
            link={linkOptions({ to: "/series/a-decouvrir" })}
            page={topRatedPage}
            query={api.shows.readManyTopRatedUnsetPaginated}
            setCursor={(cursor) => navigate({ search: (prev) => ({ ...prev, topRatedCursor: cursor ?? undefined }) })}
            setPage={(page) => navigate({ search: (prev) => ({ ...prev, topRatedPage: page }) })}
            title="Top Rated Shows"
            variant="topRated"
          />
          <ShowsList
            cursor={trendingCursor ?? null}
            icon="icon-[lucide--trending-up]"
            link={linkOptions({ to: "/series/tendances" })}
            page={trendingPage}
            query={api.shows.readManyTrendingUnsetPaginated}
            setCursor={(cursor) => navigate({ search: (prev) => ({ ...prev, trendingCursor: cursor ?? undefined }) })}
            setPage={(page) => navigate({ search: (prev) => ({ ...prev, trendingPage: page }) })}
            title="Trending Shows"
            variant="trending"
          />
        </div>
      </div>
    </div>
  );
}
