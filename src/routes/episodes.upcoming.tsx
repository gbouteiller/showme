import { createFileRoute } from "@tanstack/react-router";
import { EpisodesList } from "@/components/episodes/list";
import { api } from "@/convex/_generated/api";

// ROUTE -----------------------------------------------------------------------------------------------------------------------------------
export const Route = createFileRoute("/episodes/upcoming")({
  component: UnwatchedEpisodesPage,
});

// PAGE ------------------------------------------------------------------------------------------------------------------------------------
function UnwatchedEpisodesPage() {
  return (
    <EpisodesList
      description="Upcoming episodes from your favorite shows"
      empty="You don't have any upcoming episodes yet."
      handler={api.episodes.readPaginatedUpcoming}
      title="Upcoming Episodes"
      titleIcon="icon-[lucide--calendar]"
    />
  );
}
