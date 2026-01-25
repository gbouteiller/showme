import { createFileRoute, linkOptions } from "@tanstack/react-router";
import { EpisodesList } from "@/components/episodes/list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";

// ROUTE -----------------------------------------------------------------------------------------------------------------------------------
export const Route = createFileRoute("/episodes/non-vus")({
  component: UnwatchedEpisodesPage,
});

// PAGE ------------------------------------------------------------------------------------------------------------------------------------
function UnwatchedEpisodesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Unwatched Episodes</h1>
        <p className="text-muted-foreground">All episodes from your favorite shows that you haven&apos;t watched yet</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Episodes to watch</CardTitle>
          <CardDescription>Mark episodes as watched to track your progress</CardDescription>
        </CardHeader>
        <CardContent>
          <EpisodesList
            emptyMessage="You don't have any unwatched episodes yet"
            icon="icon-[lucide--eye]"
            link={linkOptions({ to: "/episodes/non-vus" })}
            query={api.episodes.readManyUnwatchedPaginated}
            title="Unwatched Episodes"
            variant="unwatched"
          />
        </CardContent>
      </Card>
    </div>
  );
}
