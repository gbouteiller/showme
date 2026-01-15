import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { useState } from "react";
import { Badge } from "@/components/adapted/badge";
import { Button } from "@/components/adapted/button";
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
import type { Shows } from "@/schemas/shows";

// ROUTE -----------------------------------------------------------------------------------------------------------------------------------
export const Route = createFileRoute("/series/a-decouvrir")({
  component: TopRatedShowsPage,
});

// PAGE ------------------------------------------------------------------------------------------------------------------------------------
function TopRatedShowsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const { data: shows, isLoading, error } = useQuery(convexQuery(api.shows.readManyTopRated, { limit: itemsPerPage }));
  const setFavorite = useMutation({ mutationFn: useConvexMutation(api.shows.setFavorite) });

  const handleAddToFavorites = async ({ _id }: Shows["Entity"]) => setFavorite.mutate({ _id, isFavorite: true });
  const handleRemoveFavorite = async ({ _id }: Shows["Entity"]) => setFavorite.mutate({ _id, isFavorite: false });

  const totalPages = shows ? Math.ceil(shows.length / itemsPerPage) : 0;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSeries = shows ? shows.slice(startIndex, endIndex) : [];

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Découvrir</h1>
        <p className="text-muted-foreground">Les séries les mieux notées des 3 dernières années</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Meilleures séries</CardTitle>
          <CardDescription>Explorez les séries les plus appréciées par la critique et le public</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SeriesGridSkeleton />
          ) : error ? (
            <div className="py-4 text-center">
              <span className="icon-[lucide--info] mx-auto mb-2 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Une erreur est survenue lors du chargement des séries</p>
            </div>
          ) : shows && shows.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {currentSeries.map((show) => (
                <div
                  className="flex h-full flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm"
                  key={show._id}
                >
                  <div className="relative h-48 w-full overflow-hidden">
                    {show.image ? (
                      <Image alt={show.name} className="object-cover" layout="fullWidth" src={show.image} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <span className="icon-[lucide--info] h-8 w-8 text-muted-foreground" />
                      </div>
                    )}

                    {show.rating && (
                      <div className="absolute top-2 right-2 flex items-center rounded-full bg-black/70 px-2 py-1 text-white text-xs">
                        <span className="icon-[lucide--star] mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {show.rating.toFixed(1)}
                      </div>
                    )}

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

                      {show.status && (
                        <div className="flex items-center">
                          <span className="icon-[lucide--trending-up] mr-1.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                          <span className="truncate">{show.status === "Running" ? "En cours" : show.status}</span>
                        </div>
                      )}

                      {show.premiered && (
                        <div className="flex items-center">
                          <span className="icon-[lucide--calendar] mr-1.5 h-3.5 w-3.5 shrink-0 text-purple-500" />
                          <span className="truncate">Première diffusion: {show.premiered.split("-")[0]}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto flex gap-3">
                      {show.isFavorite ? (
                        <Button
                          className="flex-1 border-red-300 text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleRemoveFavorite(show)}
                          size="sm"
                          title="Retirer des favoris"
                          variant="outline"
                        >
                          <span className="icon-[lucide--heart] h-5 w-5" />
                        </Button>
                      ) : (
                        <Button
                          className="flex-1 bg-red-500 text-white hover:bg-red-600"
                          onClick={() => handleAddToFavorites(show)}
                          size="sm"
                          title="Ajouter aux favoris"
                          variant="default"
                        >
                          <span className="icon-[lucide--heart] h-5 w-5" />
                        </Button>
                      )}
                      <Link className="flex-none" params={{ showId: show._id }} to={"/series/$showId"}>
                        <Button size="sm" title="Voir les détails" variant="outline">
                          <span className="icon-[lucide--external-link] h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center">
              <span className="icon-[lucide--info] mx-auto mb-2 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Aucune série trouvée</p>
            </div>
          )}
        </CardContent>
        {shows && shows.length > 0 && (
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

function SeriesGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array(12)
        .fill(0)
        .map((_, i) => (
          <Skeleton className="h-80 w-full" key={i} />
        ))}
    </div>
  );
}
