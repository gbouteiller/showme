import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { Shows } from "@/schemas/shows";

// ROUTE -----------------------------------------------------------------------------------------------------------------------------------
export const Route = createFileRoute("/series/tendances")({
  component: TrendingShowsPage,
});

// PAGE ------------------------------------------------------------------------------------------------------------------------------------
function TrendingShowsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const { data: trendingSeries, isLoading: isLoadingTrending } = useQuery(convexQuery(api.shows.readManyTrending));
  const [paginatedSeries, setPaginatedSeries] = useState<Shows["Entity"][]>([]);
  const [seriesIds, setSeriesIds] = useState<Id<"shows">[]>([]);
  const setFavorite = useMutation({ mutationFn: useConvexMutation(api.shows.setFavorite) });

  // Mettre à jour les IDs des séries à afficher lorsque la page change
  useEffect(() => {
    if (trendingSeries) {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentPageSeries = trendingSeries.slice(startIndex, endIndex);
      setPaginatedSeries(currentPageSeries);
      setSeriesIds(currentPageSeries.map((series) => series._id));
    }
  }, [trendingSeries, currentPage, itemsPerPage]);

  const handleAddToFavorites = async ({ _id }: Shows["Entity"]) => setFavorite.mutate({ _id, isFavorite: true });
  const handleRemoveFavorite = async ({ _id }: Shows["Entity"]) => setFavorite.mutate({ _id, isFavorite: false });

  // Pagination
  const totalPages = trendingSeries ? Math.ceil(trendingSeries.length / itemsPerPage) : 0;

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Fonction pour formater la date au format court
  const formatShortDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yy", { locale: fr });
    } catch {
      return "Date inconnue";
    }
  };

  const isLoading = isLoadingTrending;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-bold font-heading text-3xl tracking-tight">Tendances</h1>
        <p className="text-muted-foreground">Les séries en cours les plus populaires du moment</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Séries tendances</CardTitle>
          <CardDescription>Découvrez les séries qui font parler d&apos;elles en ce moment</CardDescription>
        </CardHeader>
        <CardContent>
          {paginatedSeries.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginatedSeries.map((show) => {
                // const details = findSeriesDetails(show.id);
                // const seasons = details?.seasons || [];
                // const lastEpisode = details?.lastEpisode;
                // const isFavorite = checkSeriesIsFavorite(show.id);

                return (
                  <div className="flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm" key={show._id}>
                    <div className="relative h-48 w-full overflow-hidden">
                      {show.image ? (
                        <Image
                          alt={show.name}
                          className="object-cover"
                          layout="fullWidth"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          src={show.image}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <span className="icon-[lucide--info] h-8 w-8 text-muted-foreground" />
                        </div>
                      )}

                      {/* Note en haut à droite */}
                      {show.rating && (
                        <div className="absolute top-2 right-2 flex items-center rounded-full bg-black/70 px-2 py-1 text-white text-xs">
                          <span className="icon-[lucide--star] mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
                          {show.rating.toFixed(1)}
                        </div>
                      )}

                      {/* Titre et année en bas de l'image */}
                      <div className="absolute right-0 bottom-0 left-0 bg-linear-to-t from-black/80 to-transparent p-3">
                        <div className="flex items-center justify-between">
                          <div className="max-w-[80%] rounded-md bg-black/70 px-2 py-1 text-white">
                            <h3 className="truncate font-semibold text-sm">{show.name}</h3>
                          </div>
                          <Badge className="shrink-0 border-none bg-black/70 text-white" variant="outline">
                            {show.premiered?.split("-")[0] || "N/A"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <p className="mb-3 line-clamp-3 text-muted-foreground text-sm">
                        {show.summary?.replace(/<[^>]*>/g, "") || "Aucune description disponible"}
                      </p>

                      <div className="mb-3 space-y-3 text-xs">
                        {/* Genres */}
                        <div className="flex items-center">
                          <div className="w-full">
                            <div className="flex flex-wrap justify-center gap-1">
                              {show.genres.slice(0, 3).map((genre: string) => (
                                <Badge className="text-xs" key={genre} variant="secondary">
                                  {genre}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Saisons */}
                        {/* {seasons.length > 0 && (
                          <div className="flex items-center">
                            <TrendingUp className="h-3.5 w-3.5 mr-1.5 text-blue-500 shrink-0" />
                            <span className="truncate">
                              {seasons.length} saison
                              {seasons.length > 1 ? "s" : ""}
                              {show.status === "Running" ? " - en cours" : ""}
                            </span>
                          </div>
                        )} */}

                        {/* Dernier épisode */}
                        {/* {lastEpisode && ( */}
                        <div className="flex items-center">
                          <span className="icon-[lucide--calendar] mr-1.5 h-3.5 w-3.5 shrink-0 text-purple-500" />
                          <span className="truncate">
                            {/* S{String(lastEpisode.season).padStart(2, "0")}E{String(lastEpisode.number).padStart(2, "0")} -{" "} */}
                            {/* {lastEpisode.name} */}
                            {/* {lastEpisode.airdate && ` - ${formatShortDate(lastEpisode.airdate)}`} */}
                          </span>
                        </div>
                        {/* )} */}
                      </div>

                      <div className="mt-auto flex gap-3">
                        {/* {isFavorite ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-red-300 text-red-500 hover:bg-red-50 hover:text-red-600"
                            onClick={
                              () => {} // handleRemoveFavorite(show.id, show.name)}
                            }
                            title="Retirer des favoris"
                          >
                            <HeartOff className="h-5 w-5" />
                          </Button>
                        ) : ( */}
                        <Button
                          className="flex-1 bg-red-500 text-white hover:bg-red-600"
                          onClick={
                            () => {}
                            // handleAddToFavorites(
                            //   show.id,
                            //   show.name,
                            //   show.image?.medium || null,
                            //   show.premiered || "2023",
                            //   show.genres,
                            //   show.status,
                            // )
                          }
                          size="sm"
                          title="Ajouter aux favoris"
                          variant="default"
                        >
                          <span className="icon-[lucide--heart] h-5 w-5" />
                        </Button>
                        {/* )} */}
                        <Link className="flex-none" params={{ showId: show._id }} to="/series/$showId">
                          <Button size="sm" title="Voir les détails" variant="outline">
                            <span className="icon-[lucide--external-link] h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-4 text-center">
              <span className="icon-[lucide--info] mx-auto mb-2 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Aucune série trouvée</p>
            </div>
          )}
        </CardContent>

        {trendingSeries && trendingSeries.length > 0 && (
          <CardFooter className="flex justify-center pt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    onClick={() => goToPage(currentPage - 1)}
                  />
                </PaginationItem>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;

                  // Logique pour afficher les bonnes pages selon la position actuelle
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                    if (i === 4)
                      return (
                        <PaginationItem key={i}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                    if (i === 0)
                      return (
                        <PaginationItem key={i}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                  } else {
                    if (i === 0)
                      return (
                        <PaginationItem key={i}>
                          <PaginationLink onClick={() => goToPage(1)}>1</PaginationLink>
                        </PaginationItem>
                      );
                    if (i === 1)
                      return (
                        <PaginationItem key={i}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    if (i === 3)
                      return (
                        <PaginationItem key={i}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    if (i === 4)
                      return (
                        <PaginationItem key={i}>
                          <PaginationLink onClick={() => goToPage(totalPages)}>{totalPages}</PaginationLink>
                        </PaginationItem>
                      );
                    pageNumber = currentPage + i - 2;
                  }

                  return (
                    <PaginationItem key={i}>
                      <PaginationLink isActive={currentPage === pageNumber} onClick={() => goToPage(pageNumber)}>
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    onClick={() => goToPage(currentPage + 1)}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

// SKELETON --------------------------------------------------------------------------------------------------------------------------------
function SeriesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {new Array(9).fill(0).map((_, i) => (
        <Skeleton className="h-96 w-full" key={i} />
      ))}
    </div>
  );
}
