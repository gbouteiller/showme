import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { cva } from "class-variance-authority";
import type { MouseEvent } from "react";
import { Badge } from "@/components/adapted/badge";
import { IconButton } from "@/components/adapted/icon-button";
import { api } from "@/convex/_generated/api";
import type { Shows } from "@/schemas/shows";

const SEARCH_ITEM = {
  star: cva("icon-[line-md--star-filled] size-2.5"),
};

export function SearchResultItem({ show, onSelect }: SearchResultItemProps) {
  const { mutate: setPreference, isPending } = useMutation({
    mutationFn: useConvexMutation(api.shows.setPreference),
  });

  const handleSetPreference = (preference: "favorite" | "ignored") => (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setPreference({ _id: show._id, preference });
  };

  return (
    <div className="flex items-center gap-3 p-2 hover:bg-muted" role="option" tabIndex={0}>
      <div className="relative h-12 w-8 flex-shrink-0 overflow-hidden rounded-sm">
        {show.image ? (
          <img alt={show.name} className="h-full w-full object-cover" height={48} src={show.thumbnail || show.image} width={32} />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <span className="icon-[lucide--search] h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <Link
            className="font-medium text-foreground text-sm hover:underline"
            onClick={() => onSelect?.(show._id)}
            params={{ showId: show._id }}
            to="/series/$showId"
          >
            {show.name}
          </Link>
          {show.rating !== null && (
            <Badge variant="outline">
              <span className={SEARCH_ITEM.star()} />
              {show.rating.toFixed(1)}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-1">
        <IconButton
          icon="icon-[mdi--heart-broken]"
          label="Ignore show"
          loading={isPending}
          onClick={handleSetPreference("ignored")}
          size="icon-xs"
          variant="outline"
        />
        <IconButton
          icon="icon-[mdi--heart]"
          label="Add to favorites"
          loading={isPending}
          onClick={handleSetPreference("favorite")}
          size="icon-xs"
          variant="ghost"
        />
      </div>
    </div>
  );
}

type SearchResultItemProps = {
  show: Shows["Entity"];
  onSelect?: (showId: string) => void;
};
