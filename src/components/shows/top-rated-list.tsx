import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { linkOptions } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import { List } from "@/components/list";
import { Skeleton } from "@/components/ui/skeleton";
import { ShowItem } from "./item";

export function TopRatedShowsList({ limit }: TopRatedShowsListProps) {
  const { data: shows, isLoading } = useQuery(convexQuery(api.shows.readManyTopRatedButNotFavorites, { limit }));

  if (isLoading || !shows)
    return (
      <List icon="icon-[lucide--star]" link={linkOptions({ to: "/series/a-decouvrir" })} title="Meilleures séries" variant="topRated">
        <SeriesGridSkeleton />
      </List>
    );

  if (shows.length === 0) {
    return (
      <List icon="icon-[lucide--star]" link={linkOptions({ to: "/series/a-decouvrir" })} title="Meilleures séries" variant="topRated">
        <div className="py-4 text-center">
          <span className="icon-[lucide--info] mx-auto mb-2 h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Aucune série trouvée</p>
        </div>
      </List>
    );
  }

  return (
    <List icon="icon-[lucide--star]" link={linkOptions({ to: "/series/a-decouvrir" })} title="Meilleures séries" variant="topRated">
      <div className="py-2">
        <div className="space-y-2.5">
          {shows.map((show) => (
            <ShowItem key={show._id} show={show} variant="topRated" />
          ))}
        </div>
      </div>
    </List>
  );
}
type TopRatedShowsListProps = { limit?: number };

function SeriesGridSkeleton() {
  return (
    <div className="space-y-2.5">
      {new Array(10).fill(0).map((_, i) => (
        <div className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm" key={i}>
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
    </div>
  );
}
