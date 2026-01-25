import { useConvexPaginatedQuery } from "@convex-dev/react-query";
import type { LinkOptions } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import type { FunctionReference } from "convex/server";
import { format } from "date-fns";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { List } from "@/components/list";
import { ListPagination } from "@/components/list.pagination";
import { Button } from "@/components/ui/button";
import { ItemGroup } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import type { PaginationArgs, PaginationReturns } from "@/schemas/convex";
import type { Episodes } from "@/schemas/episodes";
import { EpisodeItem } from "./item";

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export function EpisodesList({ emptyMessage, query, ...props }: EpisodesListProps) {
  const itemsPerPage = 10;
  const itemsPerFetch = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [nextPage, setNextPage] = useState(-1);

  const today = useMemo(() => format(Date.now(), "yyyy-MM-dd'T'HH:00:00.000"), []);

  const { isLoading, loadMore, results: data, status } = useConvexPaginatedQuery(query, { today }, { initialNumItems: itemsPerFetch });

  const hasEnoughFetchedItems = useMemo(() => data.length > currentPage * itemsPerPage, [data.length, currentPage]);
  const hasNextPage = useMemo(() => status === "CanLoadMore" || hasEnoughFetchedItems, [hasEnoughFetchedItems, status]);

  useEffect(() => {
    if (hasEnoughFetchedItems && nextPage !== -1) {
      setNextPage(-1);
      setCurrentPage(nextPage);
    }
  }, [hasEnoughFetchedItems, nextPage]);

  const goToPage = (page: number) => {
    if (page < 1 || (status === "Exhausted" && page * itemsPerPage - data.length >= itemsPerPage)) return;
    if (data.length >= page * itemsPerPage) return setCurrentPage(page);
    setNextPage(page);
    loadMore(page * itemsPerPage - data.length);
  };

  return (
    <List {...props}>
      <div className="relative py-2">
        {isLoading && data.length > 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-sm transition-opacity duration-300">
            <Spinner className="size-8 text-primary" />
          </div>
        )}

        <EpisodesListContent
          currentPage={currentPage}
          data={data}
          emptyMessage={emptyMessage}
          isLoading={isLoading}
          itemsPerPage={itemsPerPage}
          variant={props.variant}
        />

        <ListPagination className="mt-4" currentPage={currentPage} goToPage={goToPage} hasNextPage={hasNextPage} isLoading={isLoading} />
      </div>
    </List>
  );
}
export type EpisodesListProps = {
  emptyMessage: ReactNode;
  icon: string;
  link: LinkOptions;
  query: FunctionReference<"query", "public", PaginationArgs & { today: string }, PaginationReturns<Episodes["Entity"]>>;
  title: string;
  variant: "upcoming" | "unwatched";
};

// CONTENT ---------------------------------------------------------------------------------------------------------------------------------
function EpisodesListContent({ currentPage, data, emptyMessage, isLoading, itemsPerPage, variant }: EpisodesListContentProps) {
  if (isLoading && data.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 10 }, (_, i) => i).map((i) => (
          <div
            className="fade-in-0 flex animate-in items-center gap-4 rounded-lg border bg-card p-3 text-card-foreground shadow-sm"
            key={i}
            style={{ animationDelay: `${i * 30}ms`, animationFillMode: "backwards" }}
          >
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

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="mb-4 text-muted-foreground">{emptyMessage}</p>
        <Link to="/">
          <Button>Search shows</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      {isLoading && data.length > 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-sm transition-opacity duration-300">
          <Spinner className="size-8 text-primary" />
        </div>
      )}
      <ItemGroup>
        {data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((episode) => (
          <EpisodeItem episode={episode} key={episode._id} variant={variant} />
        ))}
      </ItemGroup>
    </>
  );
}

type EpisodesListContentProps = {
  currentPage: number;
  data: readonly Episodes["Entity"][];
  emptyMessage: ReactNode;
  isLoading: boolean;
  itemsPerPage: number;
  variant: "upcoming" | "unwatched";
};
