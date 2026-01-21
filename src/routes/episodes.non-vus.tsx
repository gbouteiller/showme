import { createFileRoute } from "@tanstack/react-router";
import { UnwatchedEpisodesList } from "@/components/episodes/unwatched-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
          <UnwatchedEpisodesList />
        </CardContent>
      </Card>
    </div>
  );
}
