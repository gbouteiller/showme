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
        <h1 className="font-bold text-3xl tracking-tight">Épisodes non vus</h1>
        <p className="text-muted-foreground">Tous les épisodes de vos séries favorites que vous n&apos;avez pas encore regardés</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Épisodes à regarder</CardTitle>
          <CardDescription>Marquez les épisodes comme vus pour suivre votre progression</CardDescription>
        </CardHeader>
        <CardContent>
          <UnwatchedEpisodesList />
        </CardContent>
      </Card>
    </div>
  );
}
