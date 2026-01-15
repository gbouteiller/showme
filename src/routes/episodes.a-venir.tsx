import { createFileRoute } from "@tanstack/react-router";
import { UpcomingEpisodesList } from "@/components/episodes/upcoming-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// ROUTE -----------------------------------------------------------------------------------------------------------------------------------
export const Route = createFileRoute("/episodes/a-venir")({
  component: UpcomingEpisodesPage,
});

// PAGE ------------------------------------------------------------------------------------------------------------------------------------
function UpcomingEpisodesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Prochains épisodes</h1>
        <p className="text-muted-foreground">Les épisodes à venir de vos séries favorites</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calendrier de diffusion</CardTitle>
          <CardDescription>Restez informé des prochaines sorties de vos séries préférées</CardDescription>
        </CardHeader>
        <CardContent>
          <UpcomingEpisodesList />
        </CardContent>
      </Card>
    </div>
  );
}
