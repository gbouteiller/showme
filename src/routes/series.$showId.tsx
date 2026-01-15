import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import { Badge } from "@/components/adapted/badge";
import { Button } from "@/components/adapted/button";
import { SeasonsList } from "@/components/shows/seasons-list";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ROUTE -----------------------------------------------------------------------------------------------------------------------------------
export const Route = createFileRoute("/series/$showId")({
  component: RouteComponent,
});

// PAGE ------------------------------------------------------------------------------------------------------------------------------------
function RouteComponent() {
  const { showId } = Route.useParams();
  const _id = showId as Id<"shows">;

  const { data: show, isLoading } = useQuery(convexQuery(api.shows.readById, { _id }));
  const { mutate: setFavorite } = useMutation({
    mutationFn: useConvexMutation(api.shows.setFavorite),
  });

  const handleToggleFavorite = () => {
    setFavorite({ _id, isFavorite: !show?.isFavorite });
  };

  if (isLoading || !show) {
    return <SeriesDetailSkeleton />;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <h1 className="font-bold text-2xl">{show.name}</h1>
        <div className="flex gap-2">
          <Link to="/series/favorites">
            <Button className="flex items-center gap-2" variant="outline">
              <span className="icon-[lucide--heart] h-4 w-4" />
              Mes favoris
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline">Rechercher</Button>
          </Link>
        </div>
      </div>
      <div className="mb-8 flex flex-col gap-8 md:flex-row">
        <div className="w-full shrink-0 md:w-1/3 lg:w-1/4">
          <div className="relative aspect-2/3 w-full overflow-hidden rounded-lg shadow-md">
            {show.image ? (
              <Image alt={show.name} className="object-cover" layout="fullWidth" priority src={show.image} />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <span className="icon-[lucide--info] h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="mt-4 space-y-4">
            <Button className="w-full" onClick={handleToggleFavorite}>
              <span className={cn("mr-2 h-4 w-4", show.isFavorite ? "icon-[lucide--heart-off]" : "icon-[lucide--heart]")} />
              {show.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            </Button>

            <div className="space-y-2">
              {show.channel && (
                <div className="flex items-center text-sm">
                  <span className="icon-[lucide--globe] mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{show.channel.name}</span>
                </div>
              )}

              {show.status && (
                <div className="flex items-center text-sm">
                  <span className="icon-[lucide--trending-up] mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{show.status}</span>
                </div>
              )}

              {show.rating && (
                <div className="flex items-center text-sm">
                  <span className="icon-[lucide--star] mr-2 h-4 w-4 text-yellow-500" />
                  <span>{show.rating}/10</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <h3 className="mb-2 font-medium text-sm">Genres</h3>
              <div className="flex flex-wrap gap-1">
                {show.genres.map((genre) => (
                  <Badge key={genre} variant="secondary">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="font-bold text-3xl">{show.name}</h1>
            {show.premiered && (
              <Badge className="text-base" variant="outline">
                {show.premiered.split("-")[0]}
              </Badge>
            )}
          </div>

          {show.summary && <div className="prose dark:prose-invert mb-8 max-w-none" dangerouslySetInnerHTML={{ __html: show.summary }} />}

          <Tabs className="w-full" defaultValue="seasons">
            <TabsList className="mb-4">
              <TabsTrigger value="seasons">Saisons et épisodes</TabsTrigger>
              <TabsTrigger value="cast">Distribution</TabsTrigger>
              <TabsTrigger value="similar">Séries similaires</TabsTrigger>
            </TabsList>

            <TabsContent value="seasons">
              <SeasonsList apiId={show.apiId} showId={_id} />
            </TabsContent>

            <TabsContent value="cast">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">Informations sur la distribution non disponibles</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="similar">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">Suggestions de séries similaires non disponibles</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function SeriesDetailSkeleton() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex flex-col gap-8 md:flex-row">
        <div className="w-full shrink-0 md:w-1/3 lg:w-1/4">
          <Skeleton className="aspect-2/3 w-full rounded-lg" />
          <div className="mt-4 space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-2">
              {new Array(5).fill(0).map((_, i) => (
                <Skeleton className="h-6 w-full" key={i} />
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-6 w-20" />
          </div>

          <div className="mb-8 space-y-4">
            {new Array(4).fill(0).map((_, i) => (
              <Skeleton className="h-4 w-full" key={i} />
            ))}
          </div>

          <Skeleton className="mb-4 h-10 w-full" />

          <div className="space-y-4">
            {new Array(3).fill(0).map((_, i) => (
              <Skeleton className="h-20 w-full" key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
