import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { linkOptions } from "@tanstack/react-router";
import { List } from "@/components/list";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { ShowItem } from "./item";

export function TrendingShowsList({ limit }: TrendingSeriesListProps) {
  const { data: shows, isLoading } = useQuery(convexQuery(api.shows.readManyTrendingUnset, { limit }));

  if (isLoading || !shows) {
    return (
      <List icon="icon-[lucide--trending-up]" link={linkOptions({ to: "/series/tendances" })} title="Séries tendances" variant="trending">
        <TrendingSeriesListSkeleton />
      </List>
    );
  }

  if (shows.length === 0) {
    return (
      <List icon="icon-[lucide--trending-up]" link={linkOptions({ to: "/series/tendances" })} title="Séries tendances" variant="trending">
        <div className="py-4 text-center">
          <span className="icon-[lucide--info] mx-auto mb-2 size-12 text-muted-foreground" />
          <p className="text-muted-foreground">Aucune série trouvée</p>
        </div>
      </List>
    );
  }

  // Trier les séries par ordre décroissant de ranking
  const sortedShows = [...shows].sort((a, b) => {
    const ratingA = a.rating ?? 0;
    const ratingB = b.rating ?? 0;
    return ratingB - ratingA;
  });

  const limitedShows = limit ? sortedShows.slice(0, limit) : sortedShows;

  return (
    <List icon="icon-[lucide--trending-up]" link={linkOptions({ to: "/series/tendances" })} title="Séries tendances" variant="trending">
      <div className="py-2">
        <div className="space-y-2.5">
          {limitedShows.map((show) => (
            <ShowItem key={show._id} show={show} variant="trending" />
          ))}
        </div>
      </div>
    </List>
  );
}
type TrendingSeriesListProps = {
  limit?: number;
};

function TrendingSeriesListSkeleton() {
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
