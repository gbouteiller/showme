import { createFileRoute, linkOptions } from "@tanstack/react-router";
import { EpisodesList } from "@/components/episodes/list";
import { ShowsList } from "@/components/shows/list";
import { api } from "@/convex/_generated/api";

// ROUTE -----------------------------------------------------------------------------------------------------------------------------------
export const Route = createFileRoute("/")({
  component: IndexPage,
});

// STYLES ----------------------------------------------------------------------------------------------------------------------------------

// PAGE ------------------------------------------------------------------------------------------------------------------------------------
function IndexPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <EpisodesList
            emptyMessage="You don't have any unwatched episodes yet"
            icon="icon-[lucide--eye]"
            link={linkOptions({ to: "/episodes/non-vus" })}
            query={api.episodes.readPaginatedUnwatched}
            title="Unwatched Episodes"
            variant="unwatched"
          />
          <EpisodesList
            emptyMessage="No favorite shows currently airing with upcoming episodes"
            icon="icon-[lucide--calendar]"
            link={linkOptions({ to: "/episodes/a-venir" })}
            query={api.episodes.readPaginatedUpcoming}
            title="Upcoming Episodes"
            variant="upcoming"
          />
        </div>
        <div className="space-y-6">
          <ShowsList
            icon="icon-[lucide--star]"
            link={linkOptions({ to: "/series/a-decouvrir" })}
            query={api.shows.readPaginatedTopRatedUnset}
            title="Top Rated Shows"
            variant="topRated"
          />
          <ShowsList
            icon="icon-[lucide--trending-up]"
            link={linkOptions({ to: "/series/tendances" })}
            query={api.shows.readPaginatedTrendingUnset}
            title="Trending Shows"
            variant="trending"
          />
        </div>
      </div>
    </div>
  );
}
