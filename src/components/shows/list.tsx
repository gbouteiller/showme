import { convexQuery } from "@convex-dev/react-query";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { LinkOptions } from "@tanstack/react-router";
import type { FunctionReference } from "convex/server";
import { useEffect, useState } from "react";
import { List } from "@/components/list";
import { ListPagination } from "@/components/list.pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import type { Shows } from "@/schemas/shows";
import { ShowItem } from "./item";

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export function ShowsList({ query, ...props }: ShowsListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [cursors, setCursors] = useState<(string | null)[]>([null]);

  const currentCursor = cursors[currentPage - 1] ?? null;

  const { data, isLoading, isFetching, isPlaceholderData } = useQuery({
    ...convexQuery(query, { paginationOpts: { numItems: 10, cursor: currentCursor } }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!data?.continueCursor || isPlaceholderData) return;
    setCursors((prev) => {
      if (prev[currentPage] === data.continueCursor) return prev;
      const next = [...prev];
      next[currentPage] = data.continueCursor;
      return next;
    });
  }, [data?.continueCursor, isPlaceholderData, currentPage]);

  const hasNextPage = data ? !data.isDone : false;

  return (
    <List {...props}>
      <div className="relative py-2">
        {isPlaceholderData && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-sm transition-opacity duration-300">
            <Spinner className="size-8 text-primary" />
          </div>
        )}
        {isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 10 }, (_, i) => i).map((index) => (
              <div
                className="fade-in-0 animate-in overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm"
                key={index}
                style={{ animationDelay: `${index * 30}ms`, animationFillMode: "backwards" }}
              >
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {data?.page.map((show) => (
              <ShowItem key={show._id} show={show} variant={props.variant} />
            ))}
          </div>
        )}
        <ListPagination currentPage={currentPage} goToPage={setCurrentPage} hasNextPage={hasNextPage} isLoading={isFetching} />
      </div>
    </List>
  );
}
export type ShowsListProps = {
  icon: string;
  link: LinkOptions;
  query: FunctionReference<
    "query",
    "public",
    { paginationOpts: { numItems: number; cursor: string | null } },
    { page: readonly Shows["Entity"][]; continueCursor: string | null; isDone: boolean }
  >;
  title: string;
  variant: "topRated" | "trending";
};
