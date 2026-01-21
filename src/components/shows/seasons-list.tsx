import { convexQuery, useConvexAction, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Image } from "@unpic/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { format, isPast } from "date-fns";
import { enUS } from "date-fns/locale";
import { useEffect } from "react";
import { toast } from "sonner";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type SeasonsListProps = {
  showId: Id<"shows">;
  apiId: number;
};

type Season = {
  number: number;
  episodes: Array<{
    _id: Id<"episodes">;
    airdate: string;
    airstamp: string;
    airtime: string;
    apiId: number;
    image: string | null;
    isWatched: boolean;
    name: string;
    number: number | null;
    rating: number | null;
    runtime: number | null;
    season: number;
    summary: string | null;
    thumbnail: string | null;
  }>;
};

export function SeasonsList({ apiId, showId }: SeasonsListProps) {
  const { data: episodes, isLoading } = useQuery(convexQuery(api.episodes.readByShowId, { _id: showId }));
  const { mutate: toggleWatched } = useMutation({
    mutationFn: useConvexMutation(api.episodes.toggleWatched),
  });
  const { isPending: isFetching, mutate: fetchEpisodes } = useMutation<any, Error, { _id: Id<"shows">; apiId: number }>({
    mutationFn: useConvexAction(api.episodes.fetchForShow),
  });

  useEffect(() => {
    if (!isLoading && episodes && episodes.length === 0 && !isFetching) {
      fetchEpisodes({ _id: showId, apiId });
    }
  }, [showId, apiId, episodes, isLoading, fetchEpisodes, isFetching]);

  const handleToggleEpisode = (episodeId: Id<"episodes">) => {
    toggleWatched(
      { _id: episodeId },
      {
        onSuccess: () => {
          toast.success("Episode status updated");
        },
        onError: () => {
          toast.error("Unable to update episode status");
        },
      }
    );
  };

  const handleToggleSeason = (seasonEpisodes: Season["episodes"], allWatched: boolean) => {
    // Toggle all episodes in the season
    for (const episode of seasonEpisodes) {
      if (episode.isWatched === allWatched) {
        toggleWatched({ _id: episode._id });
      }
    }

    toast.success(allWatched ? "Season marked as unwatched" : "Season marked as watched");
  };

  if (isLoading || !episodes) {
    return (
      <div className="space-y-4 py-2">
        {new Array(3).fill(0).map((_, i) => (
          <Skeleton className="h-20 w-full" key={i} />
        ))}
      </div>
    );
  }

  // Group episodes by season
  const seasonMap = new Map<number, Season["episodes"]>();
  for (const episode of episodes) {
    const seasonNumber = episode.season;
    const seasonEpisodes = seasonMap.get(seasonNumber);
    if (seasonEpisodes) {
      seasonEpisodes.push(episode);
    } else {
      seasonMap.set(seasonNumber, [episode]);
    }
  }

  // Convert to array and sort by season number
  const seasons: Season[] = Array.from(seasonMap.entries())
    .map(([number, episodes]) => ({
      number,
      episodes: episodes.sort((a, b) => (a.number ?? 0) - (b.number ?? 0)),
    }))
    .sort((a, b) => a.number - b.number);

  if (seasons.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        <p>No episodes available for this show</p>
      </div>
    );
  }

  return (
    <Accordion className="w-full">
      {seasons.map((season) => {
        const allEpisodesWatched = season.episodes.every((ep) => ep.isWatched);

        return (
          <AccordionItem key={season.number} value={`season-${season.number}`}>
            <AccordionTrigger>
              <div className="flex w-full items-center justify-between pr-4">
                <span>Season {season.number}</span>
                <Badge variant="outline">{season.episodes.length} episodes</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 py-2">
                <div className="mb-2 flex justify-end">
                  <Button onClick={() => handleToggleSeason(season.episodes, allEpisodesWatched)} size="sm" variant="outline">
                    {allEpisodesWatched ? (
                      <>
                        <span className="icon-[lucide--eye-off] mr-2 h-4 w-4" />
                        Mark season as unwatched
                      </>
                    ) : (
                      <>
                        <span className="icon-[lucide--eye] mr-2 h-4 w-4" />
                        Mark season as watched
                      </>
                    )}
                  </Button>
                </div>

                {season.episodes.map((episode) => {
                  const airDate = new Date(episode.airstamp);
                  const isAired = isPast(airDate);

                  return (
                    <div
                      className={`flex flex-col gap-4 rounded-lg border p-4 md:flex-row ${
                        episode.isWatched ? "bg-muted/50" : "bg-card"
                      } text-card-foreground shadow-sm`}
                      key={episode._id}
                    >
                      <div className="relative h-36 shrink-0 overflow-hidden rounded-md md:h-24 md:w-40">
                        {episode.image ? (
                          <Image
                            alt={episode.name}
                            className={`object-cover ${episode.isWatched ? "opacity-70" : ""}`}
                            layout="fullWidth"
                            src={episode.image}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted">
                            <span className="icon-[lucide--info] h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`truncate font-medium ${episode.isWatched ? "text-muted-foreground" : ""}`}>
                            {episode.number}. {episode.name}
                          </h4>
                          <Badge className="ml-2" variant="outline">
                            S{season.number} E{episode.number}
                          </Badge>
                        </div>
                        <p className="mt-1 text-muted-foreground text-xs">
                          {format(airDate, "MMMM d, yyyy", { locale: enUS })}
                          {episode.runtime && ` • ${episode.runtime} min`}
                        </p>
                      </div>
                      <Button
                        className="shrink-0"
                        disabled={!isAired}
                        onClick={() => handleToggleEpisode(episode._id)}
                        size="sm"
                        variant={episode.isWatched ? "outline" : "default"}
                      >
                        {episode.isWatched ? (
                          <>
                            <span className="icon-[lucide--eye-off] mr-2 h-4 w-4" />
                            Unwatched
                          </>
                        ) : (
                          <>
                            <span className="icon-[lucide--eye] mr-2 h-4 w-4" />
                            Watched
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
