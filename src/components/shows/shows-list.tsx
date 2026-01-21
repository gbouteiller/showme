import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import type { LinkOptions } from "@tanstack/react-router";
import type { FunctionReference } from "convex/server";
import { useCallback, useEffect, useState } from "react";
import { List } from "@/components/list";
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
import type { Shows } from "@/schemas/shows";
import { ShowItem } from "./item";

type ShowsListQuery = FunctionReference<"query", "public", { limit?: number }, readonly Shows["Entity"][]>;
type ShowsListPaginatedQuery = FunctionReference<
  "query",
  "public",
  { paginationOpts: { numItems: number; cursor: string | null } },
  { page: readonly Shows["Entity"][]; continueCursor: string | null; isDone: boolean }
>;

type ShowsListBaseConfig = {
  title: string;
  icon: string;
  link: LinkOptions;
  variant: "topRated" | "trending";
  queryKey: string[];
  sortFn?: (a: Shows["Entity"], b: Shows["Entity"]) => number;
};

type ShowsListSimpleConfig = ShowsListBaseConfig & {
  query: ShowsListQuery;
};

type ShowsListPaginatedConfig = ShowsListBaseConfig & {
  paginatedQuery: ShowsListPaginatedQuery;
};

// Pagination controls component
function PaginationControls({
  currentPage,
  hasNextPage,
  goToPage,
}: {
  currentPage: number;
  hasNextPage: boolean;
  goToPage: (page: number) => void;
}) {
  const hasPrevPage = currentPage > 1;

  return (
    <div className="mt-4">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              className={hasPrevPage ? "cursor-pointer" : "pointer-events-none opacity-50"}
              onClick={() => goToPage(currentPage - 1)}
            />
          </PaginationItem>

          {currentPage > 2 && (
            <PaginationItem>
              <PaginationLink onClick={() => goToPage(1)}>1</PaginationLink>
            </PaginationItem>
          )}

          {currentPage > 3 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {hasPrevPage && (
            <PaginationItem>
              <PaginationLink onClick={() => goToPage(currentPage - 1)}>{currentPage - 1}</PaginationLink>
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationLink isActive>{currentPage}</PaginationLink>
          </PaginationItem>

          {hasNextPage && (
            <PaginationItem>
              <PaginationLink onClick={() => goToPage(currentPage + 1)}>{currentPage + 1}</PaginationLink>
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationNext
              className={hasNextPage ? "cursor-pointer" : "pointer-events-none opacity-50"}
              onClick={() => goToPage(currentPage + 1)}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

// Show items list component
function ShowItemsList({
  shows,
  variant,
  removingIds,
  onRemoveStart,
  onRemoveEnd,
}: {
  shows: readonly Shows["Entity"][];
  variant: "topRated" | "trending";
  removingIds: Set<string>;
  onRemoveStart: (id: string) => void;
  onRemoveEnd: (id: string) => void;
}) {
  return (
    <div className="space-y-2.5">
      {shows.map((show) => (
        <div
          className={`transition-all duration-300 ease-out ${
            removingIds.has(show._id) ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"
          }`}
          key={show._id}
        >
          <ShowItem onRemoveEnd={() => onRemoveEnd(show._id)} onRemoveStart={() => onRemoveStart(show._id)} show={show} variant={variant} />
        </div>
      ))}
    </div>
  );
}

const SKELETON_KEYS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10"];

function ShowsListSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="space-y-2.5">
      {SKELETON_KEYS.slice(0, count).map((key) => (
        <div className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm" key={key}>
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
    </div>
  );
}

// Hook for remove animation
function useRemoveAnimation() {
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const handleRemoveStart = useCallback((id: string) => {
    setRemovingIds((prev) => new Set(prev).add(id));
  }, []);

  const handleRemoveEnd = useCallback((id: string) => {
    setTimeout(() => {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  }, []);

  return { removingIds, handleRemoveStart, handleRemoveEnd };
}

// Simple (non-paginated) shows list
export function ShowsList({ config, limit }: { config: ShowsListSimpleConfig; limit?: number }) {
  const { removingIds, handleRemoveStart, handleRemoveEnd } = useRemoveAnimation();
  const { data: shows, isLoading } = useQuery(convexQuery(config.query, { limit }));

  if (isLoading || !shows) {
    return (
      <List icon={config.icon} link={config.link} title={config.title} variant={config.variant}>
        <ShowsListSkeleton />
      </List>
    );
  }

  if (shows.length === 0) {
    return (
      <List icon={config.icon} link={config.link} title={config.title} variant={config.variant}>
        <div className="py-4 text-center">
          <span className="icon-[lucide--info] mx-auto mb-2 size-12 text-muted-foreground" />
          <p className="text-muted-foreground">No shows found</p>
        </div>
      </List>
    );
  }

  const displayShows = config.sortFn
    ? [...shows].sort(config.sortFn).slice(0, limit ?? shows.length)
    : shows.slice(0, limit ?? shows.length);

  return (
    <List icon={config.icon} link={config.link} title={config.title} variant={config.variant}>
      <div className="py-2">
        <ShowItemsList
          onRemoveEnd={handleRemoveEnd}
          onRemoveStart={handleRemoveStart}
          removingIds={removingIds}
          shows={displayShows}
          variant={config.variant}
        />
      </div>
    </List>
  );
}

// Paginated shows list
export function ShowsListPaginated({ config, itemsPerPage = 10 }: { config: ShowsListPaginatedConfig; itemsPerPage?: number }) {
  const { removingIds, handleRemoveStart, handleRemoveEnd } = useRemoveAnimation();
  const [currentPage, setCurrentPage] = useState(1);
  const [cursors, setCursors] = useState<(string | null)[]>([null]);

  const currentCursor = cursors[currentPage - 1] ?? null;

  const { data: paginatedData, isLoading } = useQuery(
    convexQuery(config.paginatedQuery, { paginationOpts: { numItems: itemsPerPage, cursor: currentCursor } })
  );

  useEffect(() => {
    if (paginatedData?.continueCursor && !cursors[currentPage]) {
      setCursors((prev) => {
        const updated = [...prev];
        updated[currentPage] = paginatedData.continueCursor;
        return updated;
      });
    }
  }, [paginatedData, currentPage, cursors]);

  const hasNextPage = paginatedData ? !paginatedData.isDone : false;
  const hasPrevPage = currentPage > 1;
  const showPagination = hasPrevPage || hasNextPage;

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && (page <= currentPage || (page === currentPage + 1 && hasNextPage))) {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [currentPage, hasNextPage]
  );

  if (isLoading || !paginatedData) {
    return (
      <List icon={config.icon} link={config.link} title={config.title} variant={config.variant}>
        <ShowsListSkeleton count={itemsPerPage} />
      </List>
    );
  }

  if (paginatedData.page.length === 0) {
    return (
      <List icon={config.icon} link={config.link} title={config.title} variant={config.variant}>
        <div className="py-4 text-center">
          <span className="icon-[lucide--info] mx-auto mb-2 size-12 text-muted-foreground" />
          <p className="text-muted-foreground">Aucune série trouvée</p>
        </div>
      </List>
    );
  }

  const displayShows = config.sortFn ? [...paginatedData.page].sort(config.sortFn) : paginatedData.page;

  return (
    <List icon={config.icon} link={config.link} title={config.title} variant={config.variant}>
      <div className="py-2">
        <ShowItemsList
          onRemoveEnd={handleRemoveEnd}
          onRemoveStart={handleRemoveStart}
          removingIds={removingIds}
          shows={displayShows}
          variant={config.variant}
        />
        {showPagination && <PaginationControls currentPage={currentPage} goToPage={goToPage} hasNextPage={hasNextPage} />}
      </div>
    </List>
  );
}

export type { ShowsListSimpleConfig, ShowsListPaginatedConfig };
