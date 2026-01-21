import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { Link, linkOptions } from "@tanstack/react-router";
import { List } from "@/components/list";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { ItemGroup } from "../ui/item";
import { EpisodeItem } from "./item";

type UpcomingEpisodesListProps = {
  limit?: number;
};

export function UpcomingEpisodesList({ limit }: UpcomingEpisodesListProps) {
  const { data: episodes, isLoading } = useQuery(convexQuery(api.episodes.readManyUpcoming, { limit }));

  if (isLoading)
    return (
      <List icon="icon-[lucide--calendar]" link={linkOptions({ to: "/episodes/a-venir" })} title="Upcoming Episodes" variant="upcoming">
        <UpcomingEpisodesListSkeleton />
      </List>
    );

  if (episodes?.length === 0)
    return (
      <List icon="icon-[lucide--calendar]" link={linkOptions({ to: "/episodes/a-venir" })} title="Upcoming Episodes" variant="upcoming">
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="mb-4 text-muted-foreground">No favorite shows currently airing with upcoming episodes</p>
          <Link to="/">
            <Button>Search shows</Button>
          </Link>
        </div>
      </List>
    );

  return (
    <List icon="icon-[lucide--calendar]" link={linkOptions({ to: "/episodes/a-venir" })} title="Upcoming Episodes" variant="upcoming">
      <ItemGroup>
        {episodes?.map((episode) => (
          <EpisodeItem episode={episode} key={episode._id} variant="upcoming" />
        ))}
      </ItemGroup>
    </List>
  );
}

function UpcomingEpisodesListSkeleton() {
  return (
    <div className="space-y-4">
      {new Array(3).fill(0).map((_, i) => (
        <div className="flex items-center gap-4 rounded-lg border bg-card p-3 text-card-foreground shadow-sm" key={i}>
          <Skeleton className="h-20 w-36 rounded-md" />
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="mb-2 h-4 w-60" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
