import { useConvexPaginatedQuery } from "@convex-dev/react-query";
import type { LinkOptions } from "@tanstack/react-router";
import type { FunctionReference } from "convex/server";
import { useEffect, useMemo, useState } from "react";
import { List } from "@/components/list";
import { Skeleton } from "@/components/ui/skeleton";
import type { PaginationArgs, PaginationReturns } from "@/schemas/convex";
import type { Shows } from "@/schemas/shows";
import { ListPagination } from "../list.pagination";
import { Spinner } from "../ui/spinner";
import { ShowItem } from "./item";

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export function ShowsList({ query, ...props }: ShowsListProps) {
  const itemsPerPage = 10;
  const itemsPerFetch = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [nextPage, setNextPage] = useState(-1);

  const { isLoading, loadMore, results: data, status } = useConvexPaginatedQuery(query, {}, { initialNumItems: itemsPerFetch });

  const hasEnoughFetchedItems = useMemo(() => data.length > currentPage * itemsPerPage, [data.length, currentPage]);
  const hasNextPage = useMemo(() => status === "CanLoadMore" || hasEnoughFetchedItems, [hasEnoughFetchedItems, status]);

  useEffect(() => {
    if (hasEnoughFetchedItems && nextPage !== -1) {
      setNextPage(-1);
      setCurrentPage(nextPage);
    }
  }, [hasEnoughFetchedItems, nextPage]);

  const handleSetPreference = () => {
    if (data.length - 1 < currentPage * itemsPerPage && status === "CanLoadMore") loadMore(itemsPerFetch);
  };

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
        <div className="space-y-2.5">
          {isLoading && data.length === 0
            ? Array.from({ length: 10 }, (_, i) => i).map((index) => (
                <div
                  className="fade-in-0 animate-in overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm"
                  key={index}
                  style={{ animationDelay: `${index * 30}ms`, animationFillMode: "backwards" }}
                >
                  <Skeleton className="h-16 w-full" />
                </div>
              ))
            : data
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((show) => <ShowItem key={show._id} onSetPreference={handleSetPreference} show={show} variant={props.variant} />)}
        </div>
        <ListPagination className="mt-4" currentPage={currentPage} goToPage={goToPage} hasNextPage={hasNextPage} isLoading={isLoading} />
      </div>
    </List>
  );
}
export type ShowsListProps = {
  icon: string;
  link: LinkOptions;
  query: FunctionReference<"query", "public", PaginationArgs, PaginationReturns<Shows["Entity"], Shows["Entry"]>>;
  title: string;
  variant: "topRated" | "trending";
};
