import { useConvexPaginatedQuery } from "@convex-dev/react-query";
import type { LinkOptions } from "@tanstack/react-router";
import type { FunctionReference } from "convex/server";
import { useEffect, useState } from "react";
import { List } from "@/components/list";
import { Skeleton } from "@/components/ui/skeleton";
import type { PaginationArgs, PaginationReturns } from "@/schemas/convex";
import type { Shows } from "@/schemas/shows";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "../ui/pagination";
import { Spinner } from "../ui/spinner";
import { ShowItem } from "./item";

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export function ShowsList({ query, ...props }: ShowsListProps) {
  const [startIndex, setStartIndex] = useState(0);
  const [shouldUpdateIndex, setShouldUpdateIndex] = useState(false);

  const { isLoading, loadMore, results: data, status } = useConvexPaginatedQuery(query, {}, { initialNumItems: 20 });

  useEffect(() => {
    if (data.length > startIndex + 10 && shouldUpdateIndex) {
      setShouldUpdateIndex(false);
      setStartIndex((prev) => prev + 10);
    }
  }, [data.length, shouldUpdateIndex, startIndex]);

  const handleNextPage = () => {
    if (data.length >= startIndex + 20) return setStartIndex((prev) => prev + 10);
    if (status !== "CanLoadMore") return;
    setShouldUpdateIndex(true);
    loadMore(20);
  };

  const handlePreviousPage = () => {
    if (startIndex > 9) setStartIndex((prev) => prev - 10);
  };

  const handleSetPreference = () => {
    if (data.length - 1 < startIndex + 10 && status === "CanLoadMore") loadMore(20);
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
                .slice(startIndex, startIndex + 10)
                .map((show) => <ShowItem key={show._id} onSetPreference={handleSetPreference} show={show} variant={props.variant} />)}
        </div>
        {/* <ListPagination currentPage={currentPage} goToPage={setCurrentPage} hasNextPage={hasNextPage} isLoading={isFetching} /> */}
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={handlePreviousPage} />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext onClick={handleNextPage} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
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
