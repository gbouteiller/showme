import { createFileRoute } from "@tanstack/react-router";
import { UnwatchedEpisodesList } from "@/components/episodes/unwatched-list";
import { UpcomingEpisodesList } from "@/components/episodes/upcoming-list";
import { TopRatedShowsList } from "@/components/shows/top-rated-list";
import { TrendingShowsList } from "@/components/shows/trending-list";

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
          <TopRatedShowsList limit={10} />
          <TrendingShowsList limit={10} />
        </div>
      </div>
    </div>
  );
}
