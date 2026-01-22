import { convexQuery } from "@convex-dev/react-query";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { LinkOptions } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import type { FunctionReference } from "convex/server";
import { format } from "date-fns";
import { type ReactNode, useEffect, useState } from "react";
import { List } from "@/components/list";
import { Button } from "@/components/ui/button";
import { ItemGroup } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import type { Episodes } from "@/schemas/episodes";
import { ShowsListPagination } from "../shows/list.pagination";
import { EpisodeItem } from "./item";

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export function EpisodesList({ cursor, emptyMessage, page, query, setCursor, setPage, ...props }: EpisodesListProps) {
  const [cursors, setCursors] = useState<Record<number, string | null>>({ 1: null });

  const currentCursor = cursor ?? cursors[page] ?? null;

  const { data, isLoading, isFetching, isPlaceholderData } = useQuery({
    ...convexQuery(query, {
      paginationOpts: { numItems: 10, cursor: currentCursor },
      today: format(Date.now(), "yyyy-MM-dd'T'HH:00:00.000"),
    }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (!data?.continueCursor || isPlaceholderData) return;
    setCursors((prev) => ({ ...prev, [page + 1]: data.continueCursor }));
  }, [data?.continueCursor, isPlaceholderData, page]);

  const hasNextPage = data ? !data.isDone : false;

  const handlePageChange = (newPage: number) => {
    const newCursor = cursors[newPage] ?? null;
    setCursor(newCursor);
    setPage(newPage);
  };

  return (
    <List {...props}>
      <Content emptyMessage={emptyMessage} episodes={data?.page ?? []} isLoading={isLoading} variant={props.variant} />
      <ShowsListPagination currentPage={page} goToPage={handlePageChange} hasNextPage={hasNextPage} isLoading={isFetching} />
    </List>
  );
}
export type EpisodesListProps = {
  cursor: string | null;
  emptyMessage: ReactNode;
  icon: string;
  link: LinkOptions;
  page: number;
  query: FunctionReference<
    "query",
    "public",
    { paginationOpts: { numItems: number; cursor: string | null }; today: string },
    { page: readonly Episodes["Entity"][]; continueCursor: string | null; isDone: boolean }
  >;
  setCursor: (cursor: string | null) => void;
  setPage: (page: number) => void;
  title: string;
  variant: "upcoming" | "unwatched";
};

// CONTENT ---------------------------------------------------------------------------------------------------------------------------------
function Content({ episodes, isLoading, emptyMessage, variant }: ContentProps) {
  if (isLoading)
    return (
      <div className="space-y-4">
        {Array.from({ length: 10 }, (_, i) => i).map((i) => (
          <div className="flex items-center gap-4 rounded-lg border bg-card p-3 text-card-foreground shadow-sm" key={i}>
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
  if (episodes.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="mb-4 text-muted-foreground">{emptyMessage}</p>
        <Link to="/">
          <Button>Search shows</Button>
        </Link>
      </div>
    );
  return (
    <ItemGroup>
      {episodes.map((episode) => (
        <EpisodeItem episode={episode} key={episode._id} variant={variant} />
      ))}
    </ItemGroup>
  );
}
type ContentProps = {
  episodes: readonly Episodes["Entity"][];
  emptyMessage: ReactNode;
  isLoading: boolean;
  variant: "upcoming" | "unwatched";
};
