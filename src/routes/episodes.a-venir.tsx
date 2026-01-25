import { createFileRoute, linkOptions } from "@tanstack/react-router";
import { EpisodesList } from "@/components/episodes/list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";

// ROUTE -----------------------------------------------------------------------------------------------------------------------------------
export const Route = createFileRoute("/episodes/a-venir")({
  component: UpcomingEpisodesPage,
});

// PAGE ------------------------------------------------------------------------------------------------------------------------------------
function UpcomingEpisodesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Upcoming Episodes</h1>
        <p className="text-muted-foreground">Upcoming episodes from your favorite shows</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Release Calendar</CardTitle>
          <CardDescription>Stay informed about upcoming releases of your favorite shows</CardDescription>
        </CardHeader>
        <CardContent>
          <EpisodesList
            emptyMessage="No favorite shows currently airing with upcoming episodes"
            icon="icon-[lucide--calendar]"
            link={linkOptions({ to: "/episodes/a-venir" })}
            query={api.episodes.readManyUpcomingPaginated}
            title="Upcoming Episodes"
            variant="upcoming"
          />
        </CardContent>
      </Card>
    </div>
  );
}
