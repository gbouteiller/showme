import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import type { LinkOptions } from "@tanstack/react-router";
import type { FunctionReference } from "convex/server";
import { useCallback, useState } from "react";
import { List } from "@/components/list";
import { Skeleton } from "@/components/ui/skeleton";
import type { Shows } from "@/schemas/shows";
import { ShowItem } from "./item";

type ShowsListQuery = FunctionReference<"query", "public", { limit?: number }, readonly Shows["Entity"][]>;

type ShowsListConfig = {
  title: string;
  icon: string;
  link: LinkOptions;
  variant: "topRated" | "trending";
  query: ShowsListQuery;
  queryKey: string[];
  sortFn?: (a: Shows["Entity"], b: Shows["Entity"]) => number;
};

export function ShowsList({ config, limit }: ShowsListProps) {
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const { data: shows, isLoading } = useQuery(convexQuery(config.query, { limit }));

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
          <p className="text-muted-foreground">Aucune série trouvée</p>
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
        <div className="space-y-2.5">
          {displayShows.map((show) => (
            <div
              className={`transition-all duration-300 ease-out ${
                removingIds.has(show._id) ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"
              }`}
              key={show._id}
            >
              <ShowItem
                onRemoveEnd={() => handleRemoveEnd(show._id)}
                onRemoveStart={() => handleRemoveStart(show._id)}
                show={show}
                variant={config.variant}
              />
            </div>
          ))}
        </div>
      </div>
    </List>
  );
}

type ShowsListProps = {
  config: ShowsListConfig;
  limit?: number;
};

function ShowsListSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 10 }).map((_, index) => (
        <div className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm" key={`shows-skeleton-${index}`}>
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
    </div>
  );
}
