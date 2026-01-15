// import { api } from "@/convex/_generated/api";
import { Image } from "@unpic/react";
// import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// MAIN ************************************************************************************************************************************
export function SearchBar() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Array<any>>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // const runSearch = useAction(api.tvmaze.searchSeries);
  // const addFavorite = useMutation(api.favorites.addFavorite);
  // const removeFavorite = useMutation(api.favorites.removeFavorite);
  // const favoritesQuery = useQuery(api.favorites.getFavorites, {
  // 	userId: typeof window !== "undefined" ? window.localStorage.getItem("userId") || "_no_user_" : "_no_user_",
  // });
  // const favorites = favoritesQuery?.data;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    // e?.preventDefault();
    // if (query.trim().length < 2) return;
    // setIsSearching(true);
    // setIsOpen(true);
    // try {
    // 	const searchResults = await runSearch({ query });
    // 	setResults(searchResults as Series[]);
    // } catch {
    // 	toast("Impossible de rechercher des séries");
    // } finally {
    // 	setIsSearching(false);
    // }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const toggleSearch = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const goToSeriesDetail = (id: number) => {
    // router.push(`/series/${id}`);
    clearSearch();
  };

  const isFavorite = (seriesId: number): boolean => {
    // if (!favorites || !Array.isArray(favorites)) return false;
    // return favorites.some((fav: any) => fav.seriesId === seriesId);
  };

  const handleAddToFavorites = async (
    e: React.MouseEvent,
    seriesId: number,
    name: string,
    image: string | null,
    year: string,
    genres: Array<string>,
    status: string
  ) => {
    // e.stopPropagation();
    // try {
    // 	// Get userId from localStorage and ensure it's not empty
    // 	const userId = typeof window !== "undefined" ? window.localStorage.getItem("userId") : "";
    // 	// If userId is empty, show an error message
    // 	if (!userId) {
    // 		toast("Vous devez être connecté pour ajouter des favoris");
    // 		return;
    // 	}
    // 	await addFavorite({
    // 		userId,
    // 		seriesId,
    // 		seriesData: {
    // 			name,
    // 			posterUrl: image || "",
    // 			year: parseInt(year.split("-")[0]),
    // 			genres,
    // 			status,
    // 		},
    // 	});
    // 	toast(`${name} a été ajouté à vos favoris`);
    // } catch {
    // 	toast("Cette série est déjà dans vos favoris ou une erreur s'est produite");
    // }
  };

  const handleRemoveFavorite = async (e: React.MouseEvent, seriesId: number, name: string) => {
    // e.stopPropagation();
    // try {
    // 	// Get userId from localStorage and ensure it's not empty
    // 	const userId = typeof window !== "undefined" ? window.localStorage.getItem("userId") : "";
    // 	// If userId is empty, show an error message
    // 	if (!userId) {
    // 		toast("Vous devez être connecté pour retirer des favoris");
    // 		return;
    // 	}
    // 	await removeFavorite({
    // 		userId,
    // 		seriesId,
    // 	});
    // 	toast(`${name} a été retiré de vos favoris`);
    // } catch {
    // 	toast("Impossible de retirer cette série de vos favoris");
    // }
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="flex w-full items-center">
        <div className="flex w-full items-center rounded-full border-0 bg-muted/50 ring-1 ring-primary/30 transition-all">
          <Input
            autoFocus
            className="h-9 w-full border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher une série..."
            ref={inputRef}
            type="text"
            value={query}
          />
          {query && (
            <Button className="mr-1 h-9 w-9 flex-shrink-0 rounded-full p-0" onClick={clearSearch} size="icon" type="button" variant="ghost">
              <span className="icon-[lucide--x] h-4 w-4 text-muted-foreground" />
            </Button>
          )}
          <Button className="h-9 w-9 flex-shrink-0 rounded-full p-0" onClick={toggleSearch} size="icon" type="button" variant="ghost">
            <span className="icon-[lucide--search] h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute right-0 left-0 z-50 mt-2 max-h-[70vh] w-full overflow-y-auto rounded-lg border bg-background shadow-lg">
          <div className="p-3">
            <h3 className="mb-3 px-2 font-medium text-sm">Résultats ({results.length})</h3>
            <div className="space-y-1">
              {results.slice(0, 5).map((show) => (
                <div className="flex items-center gap-3 rounded-md p-2 hover:bg-muted" key={show.id}>
                  <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-sm">
                    {show.image ? (
                      <Image alt={show.name} className="object-cover" src={show.image.medium} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <span className="icon-[lucide--search] h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">{show.name}</p>
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      {show.premiered && <span>{show.premiered.split("-")[0]}</span>}
                      {show.rating.average && (
                        <span className="flex items-center">
                          • <span className="mx-0.5 text-yellow-500">★</span>
                          {show.rating.average.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isFavorite(show.id) ? (
                      <Button
                        aria-label="Retirer des favoris"
                        className="h-7 w-7 text-red-500 hover:bg-muted hover:text-red-600"
                        onClick={(e) => handleRemoveFavorite(e, show.id, show.name)}
                        size="icon"
                        variant="ghost"
                      >
                        <span className="icon-[lucide--heart-off] h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        aria-label="Ajouter aux favoris"
                        className="h-7 w-7 hover:bg-muted hover:text-red-500"
                        onClick={(e) =>
                          handleAddToFavorites(
                            e,
                            show.id,
                            show.name,
                            show.image?.medium || null,
                            show.premiered || "2023",
                            show.genres,
                            show.status
                          )
                        }
                        size="icon"
                        variant="ghost"
                      >
                        <span className="icon-[lucide--heart] h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      aria-label="Voir les détails"
                      className="h-7 w-7 hover:bg-muted hover:text-blue-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        goToSeriesDetail(show.id);
                      }}
                      size="icon"
                      variant="ghost"
                    >
                      <span className="icon-[lucide--external-link] h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {results.length > 5 && (
                <Button
                  className="w-full font-medium text-xs"
                  onClick={() => {
                    // router.push(`/search-results?q=${encodeURIComponent(query)}`);
                    clearSearch();
                  }}
                  variant="ghost"
                >
                  Voir tous les résultats ({results.length})
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {isOpen && isSearching && (
        <div className="absolute right-0 left-0 z-50 mt-2 flex w-full justify-center rounded-lg border bg-background p-4 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Recherche en cours...</span>
          </div>
        </div>
      )}
    </div>
  );
}
