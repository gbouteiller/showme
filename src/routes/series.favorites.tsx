import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { api } from "convex/_generated/api";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Shows } from "@/schemas/shows";

// ROUTE -----------------------------------------------------------------------------------------------------------------------------------
export const Route = createFileRoute("/series/favorites")({
  component: FavoriteShowsPage,
});

// PAGE ------------------------------------------------------------------------------------------------------------------------------------
function FavoriteShowsPage() {
  const { data: shows, isPending } = useQuery(convexQuery(api.shows.readManyFavorites));

  return (
    <div className="container mx-auto py-8">
      <PageHeader description="Manage your favorite shows" title="My Favorite Shows" />
      {isPending ? <FavoriteShowsLoading /> : <FavoriteShowsLoaded shows={shows} />}
    </div>
  );
}

// LOADING ---------------------------------------------------------------------------------------------------------------------------------
function FavoriteShowsLoading() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {new Array(9).fill(0).map((_, i) => (
        <Skeleton className="h-96 w-full" key={i} />
      ))}
    </div>
  );
}

// LOADED ----------------------------------------------------------------------------------------------------------------------------------
function FavoriteShowsLoaded({ shows = [] }: { shows?: ReadonlyArray<Shows["Entity"]> }) {
  return shows.length === 0 ? <FavoriteShowsNone /> : <FavoriteShowsSome shows={shows} />;
}

// NONE ------------------------------------------------------------------------------------------------------------------------------------
function FavoriteShowsNone() {
  return (
    <div className="py-12 text-center">
      <p className="mb-4 text-muted-foreground">You don&apos;t have any favorite shows yet</p>
      <Link to="/series/a-decouvrir">
        <Button>Search shows</Button>
      </Link>
    </div>
  );
}

// LOADED ----------------------------------------------------------------------------------------------------------------------------------
function FavoriteShowsSome({ shows }: { shows: ReadonlyArray<Shows["Entity"]> }) {
  const { mutate: setPreference } = useMutation({ mutationFn: useConvexMutation(api.shows.setPreference) });
  const cyclePreference = (current: "favorite" | "unset" | "ignored"): "favorite" | "unset" | "ignored" => {
    if (current === "favorite") return "unset";
    return "favorite";
  };
  return (
    <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {shows.map((show) => {
        // const details = findSeriesDetails(favorite.seriesId);
        // const seasons = details?.seasons || [];
        // const lastEpisode = details?.lastEpisode;
        // const series = details?.series;

        return (
          <div className="flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm" key={show._id}>
            <div className="relative h-48 w-full overflow-hidden">
              {show.image ? (
                <Image
                  alt={show.name}
                  className="object-cover"
                  layout="fullWidth"
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  src={show.image}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <span className="icon-[lucide--info] h-8 w-8 text-muted-foreground" />
                </div>
              )}

              {/* Note en haut à droite - Afficher le rating au lieu de "Favori" */}
              <div className="absolute top-2 right-2 flex items-center rounded-full bg-black/70 px-2 py-1 text-white text-xs">
                <span className="icon-[lucide--star] mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
                {show.rating ? show.rating.toFixed(1) : "N/A"}
              </div>

              {/* Titre et année en bas de l'image */}
              <div className="absolute right-0 bottom-0 left-0 bg-linear-to-t from-black/80 to-transparent p-3">
                <div className="flex items-center justify-between">
                  <div className="max-w-[80%] rounded-md bg-black/70 px-2 py-1 text-white">
                    <h3 className="truncate font-semibold text-sm">{show.name}</h3>
                  </div>
                  <Badge className="shrink-0 border-none bg-black/70 text-white" variant="outline">
                    {show.premiered}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-4">
              {/* Description de la série au lieu de "Série en cours de diffusion" */}
              <p className="mb-3 line-clamp-3 text-muted-foreground text-sm">
                {show.summary ? show.summary.replace(/<[^>]*>/g, "") : "No description available"}
              </p>

              <div className="mb-3 space-y-3 text-xs">
                {/* Genres */}
                <div className="flex items-center">
                  <div className="w-full">
                    <div className="flex flex-wrap justify-center gap-1">
                      {show.genres.slice(0, 3).map((genre) => (
                        <Badge className="text-xs" key={genre} variant="secondary">
                          {genre}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Nombre de saisons au lieu de "En cours" */}
                <div className="flex items-center">
                  <span className="icon-[lucide--trending-up] mr-1.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                  <span className="truncate">
                    {/* {show.seasons.length > 0 ? `${show.seasons.length} saison${show.seasons.length > 1 ? "s" : ""}` : "Saisons inconnues"} */}
                    {show.status === "Running" ? " - en cours" : ""}
                  </span>
                </div>

                {/* Dernier épisode diffusé au lieu de "Première diffusion" */}
                <div className="flex items-center">
                  <span className="icon-[lucide--calendar] mr-1.5 h-3.5 w-3.5 shrink-0 text-purple-500" />
                  <span className="truncate">
                    {/* {show.lastEpisode ? (
                      <>
                        S{String(show.lastEpisode.season).padStart(2, "0")}E{String(show.lastEpisode.number).padStart(2, "0")} -{" "}
                        {show.lastEpisode.name}
                      </>
                    ) : ( */}
                    "Episode information not available"
                    {/* )} */}
                  </span>
                </div>
              </div>

              <div className="mt-auto flex gap-3">
                <Link className="flex-1" params={{ showId: show._id }} to={"/series/$showId"}>
                  <Button className="w-full" size="sm" title="View details" variant="default">
                    <span className="icon-[lucide--external-link] mr-2 h-4 w-4" />
                    Details
                  </Button>
                </Link>
                <Button
                  className="flex-none"
                  onClick={() => setPreference({ _id: show._id, preference: cyclePreference(show.preference) })}
                  size="sm"
                  title="Remove from favorites"
                  variant="outline"
                >
                  <span className="icon-[lucide--heart-off] h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
