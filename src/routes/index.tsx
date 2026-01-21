import { createFileRoute, linkOptions } from "@tanstack/react-router";
import { UnwatchedEpisodesList } from "@/components/episodes/unwatched-list";
import { UpcomingEpisodesList } from "@/components/episodes/upcoming-list";
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
          <UnwatchedEpisodesList limit={10} />
          <UpcomingEpisodesList limit={10} />
        </div>
        <div className="space-y-6">
          <ShowsList
            icon="icon-[lucide--star]"
            link={linkOptions({ to: "/series/a-decouvrir" })}
            query={api.shows.readManyTopRatedUnsetPaginated}
            title="Top Rated Shows"
            variant="topRated"
          />
          {/* <ShowsList
            icon="icon-[lucide--trending-up]"
            link={linkOptions({ to: "/series/tendances" })}
            query={api.shows.readManyTrendingUnsetPaginated}
            title="Trending Shows"
            variant="trending"
          /> */}
        </div>
      </div>
    </div>
  );
}
