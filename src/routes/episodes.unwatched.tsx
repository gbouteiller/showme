import { createFileRoute } from "@tanstack/react-router";
import { EpisodesList } from "@/components/episodes/list";
import { api } from "@/convex/_generated/api";

// ROUTE -----------------------------------------------------------------------------------------------------------------------------------
export const Route = createFileRoute("/episodes/unwatched")({
  component: UnwatchedEpisodesPage,
});

// PAGE ------------------------------------------------------------------------------------------------------------------------------------
function UnwatchedEpisodesPage() {
  return (
    <EpisodesList
      description="All episodes from your favorite shows that you haven't watched yet"
      empty="You don't have any unwatched episodes yet."
      handler={api.episodes.readPaginatedUnwatched}
      title="Unwatched Episodes"
      titleIcon="icon-[lucide--eye]"
    />
  );
}
