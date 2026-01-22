import { createFileRoute, linkOptions, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { EpisodesList } from "@/components/episodes/list";
import { ShowsList } from "@/components/shows/list";
import { api } from "@/convex/_generated/api";

// ROUTE -----------------------------------------------------------------------------------------------------------------------------------
export const Route = createFileRoute("/")({
  component: IndexPage,
  validateSearch: z.object({
    topRatedPage: z.number().default(1).catch(1),
    topRatedCursor: z.string().optional(),
    trendingPage: z.number().default(1).catch(1),
    trendingCursor: z.string().optional(),
    unwatchedPage: z.number().default(1).catch(1),
    unwatchedCursor: z.string().optional(),
    upcomingPage: z.number().default(1).catch(1),
    upcomingCursor: z.string().optional(),
  }),
});

// STYLES ----------------------------------------------------------------------------------------------------------------------------------

// PAGE ------------------------------------------------------------------------------------------------------------------------------------
function IndexPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { topRatedPage, topRatedCursor, trendingPage, trendingCursor, unwatchedPage, unwatchedCursor, upcomingPage, upcomingCursor } =
    Route.useSearch();

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <EpisodesList
            cursor={unwatchedCursor ?? null}
            emptyMessage="You don't have any unwatched episodes yet"
            icon="icon-[lucide--eye]"
            link={linkOptions({ to: "/episodes/non-vus" })}
            page={unwatchedPage}
            query={api.episodes.readManyUnwatchedPaginated}
            setCursor={(cursor) => navigate({ search: (prev) => ({ ...prev, unwatchedCursor: cursor ?? undefined }) })}
            setPage={(page) => navigate({ search: (prev) => ({ ...prev, unwatchedPage: page }) })}
            title="Unwatched Episodes"
            variant="unwatched"
          />
          <EpisodesList
            cursor={upcomingCursor ?? null}
            emptyMessage="No favorite shows currently airing with upcoming episodes"
            icon="icon-[lucide--calendar]"
            link={linkOptions({ to: "/episodes/a-venir" })}
            page={upcomingPage}
            query={api.episodes.readManyUpcomingPaginated}
            setCursor={(cursor) => navigate({ search: (prev) => ({ ...prev, upcomingCursor: cursor ?? undefined }) })}
            setPage={(page) => navigate({ search: (prev) => ({ ...prev, upcomingPage: page }) })}
            title="Upcoming Episodes"
            variant="upcoming"
          />
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
