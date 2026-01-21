import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { Link, linkOptions } from "@tanstack/react-router";
import { List } from "@/components/list";
import { Button } from "@/components/ui/button";
import { ItemGroup } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import { EpisodeItem } from "./item";

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export function UnwatchedEpisodesList({ limit }: UnwatchedEpisodesListProps) {
  const { data: episodes, isLoading } = useQuery(convexQuery(api.episodes.readManyUnwatched, { limit }));
  // const [filteredStatuses, setFilteredStatuses] = useState<
  //   Array<{
  //     seriesId: number;
  //     seasonNumber: number;
  //     episodeNumber: number;
  //   }>
  // >([]);
  // const [isFiltering, setIsFiltering] = useState(true);
  // const [currentPage, setCurrentPage] = useState(1);
  // const itemsPerPage = 10; // Nombre d'épisodes par page

  // const favorites = useQuery(api.favorites.getFavorites, {});

  // const watchStatuses = useQuery(api.watchStatus.getUnwatchedEpisodes, {});

  // const markAsWatched = useMutation(api.watchStatus.markEpisodeAsWatched);
  // const getEpisodes = useAction(api.tvmaze.getSeriesEpisodes);

  // Filtrer les épisodes pour ne garder que ceux qui ont déjà été diffusés
  // useEffect(() => {
  //   const filterAiredEpisodes = async () => {
  //     if (!watchStatuses || watchStatuses.length === 0) {
  //       setFilteredStatuses([]);
  //       setIsFiltering(false);
  //       return;
  //     }

  //     setIsFiltering(true);

  //     // Créer un Map pour stocker les épisodes par série
  //     const episodesBySeriesId = new Map<number, Episode[]>();

  //     // Récupérer tous les épisodes pour chaque série
  //     for (const status of watchStatuses) {
  //       if (!episodesBySeriesId.has(status.seriesId)) {
  //         try {
  //           const episodes = await getEpisodes({ seriesId: status.seriesId });
  //           episodesBySeriesId.set(status.seriesId, episodes);
  //         } catch (e) {
  //           console.error(`Erreur lors de la récupération des épisodes pour la série ${status.seriesId}:`, e);
  //           episodesBySeriesId.set(status.seriesId, []);
  //         }
  //       }
  //     }

  //     // Filtrer les statuts pour ne garder que ceux dont les épisodes ont déjà été diffusés
  //     const filtered = watchStatuses.filter((status) => {
  //       const episodes = episodesBySeriesId.get(status.seriesId) || [];
  //       const episode = episodes.find((ep) => ep.season === status.seasonNumber && ep.number === status.episodeNumber);

  //       if (!episode) return false;

  //       const airDate = new Date(episode.airstamp);
  //       return airDate <= new Date();
  //     });

  //     setFilteredStatuses(filtered);
  //     setIsFiltering(false);
  //     // Réinitialiser la page courante lorsque les données changent
  //     setCurrentPage(1);
  //   };

  //   filterAiredEpisodes();
  // }, [watchStatuses, getEpisodes]);

  // Fonction pour changer de page
  // const goToPage = (page: number) => {
  //   if (page >= 1 && page <= totalPages) {
  //     setCurrentPage(page);
  //     window.scrollTo({ top: 0, behavior: "smooth" });
  //   }
  // };

  if (isLoading || !episodes)
    return (
      <List icon="icon-[lucide--eye]" link={linkOptions({ to: "/episodes/non-vus" })} title="Unwatched Episodes" variant="unwatched">
        <UnwatchedEpisodesListSkeleton />
      </List>
    );

  if (episodes.length === 0)
    return (
      <List icon="icon-[lucide--eye]" link={linkOptions({ to: "/episodes/non-vus" })} title="Unwatched Episodes" variant="unwatched">
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="mb-4 text-muted-foreground">You don&apos;t have any unwatched episodes yet</p>
          <Link to="/">
            <Button>Search shows</Button>
          </Link>
        </div>
      </List>
    );

  // Si limit est défini, on affiche seulement le nombre demandé d'épisodes
  // Sinon, on pagine les résultats
  // const totalPages = limit ? 1 : Math.ceil(filteredStatuses.length / itemsPerPage);

  // const paginatedStatuses = limit
  //   ? filteredStatuses.slice(0, limit)
  //   : filteredStatuses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <List icon="icon-[lucide--eye]" link={linkOptions({ to: "/episodes/non-vus" })} title="Unwatched Episodes" variant="unwatched">
      <ItemGroup>
        {episodes.map((episode) => (
          <EpisodeItem
            episode={episode}
            key={episode._id}
            // episodeNumber={status.episodeNumber}
            // key={`${status.seriesId}-${status.seasonNumber}-${status.episodeNumber}`}
            // onMarkAsWatched={handleMarkAsWatched}
            // seasonNumber={status.seasonNumber}
            // seriesId={status.seriesId}
            variant="unwatched"
          />
        ))}

        {/* {limit && filteredStatuses.length > limit ? (
          <div className="pt-2 text-center">
            <Link to="/dashboard/unwatched">
              <Button variant="outline">Voir tous les épisodes non vus</Button>
            </Link>
          </div>
        ) : !limit && totalPages > 1 ? (
          <div className="flex justify-center pt-6">
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
          </div>
        ) : null} */}
      </ItemGroup>
    </List>
  );
}
type UnwatchedEpisodesListProps = {
  limit?: number;
};

// SKELETON --------------------------------------------------------------------------------------------------------------------------------
function UnwatchedEpisodesListSkeleton() {
  return (
    <div className="space-y-4">
      {new Array(10).fill(0).map((_, i) => (
        <Skeleton className="h-20 w-full" key={i} />
      ))}
    </div>
  );
}
