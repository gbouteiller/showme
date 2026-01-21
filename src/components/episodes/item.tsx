import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import type { VariantProps } from "class-variance-authority";
import { formatDistanceToNow, isPast } from "date-fns";
import { type BADGE, Badge } from "@/components/adapted/badge";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { api } from "@/convex/_generated/api";
import type { Episodes } from "@/schemas/episodes";
import { IconButton } from "../adapted/icon-button";
import { IconConfirm } from "../adapted/icon-confirm";

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export function EpisodeItem({ episode, variant }: EpisodeItemProps) {
  const airDate = new Date(episode.airstamp);
  const isAired = isPast(airDate);
  const image = episode.thumbnail ?? episode.show.thumbnail;

  const { mutate: toggleWatched } = useMutation({
    mutationFn: useConvexMutation(api.episodes.toggleWatched),
  });

  const { mutate: setSeasonWatched } = useMutation({
    mutationFn: useConvexMutation(api.episodes.setSeasonWatched),
  });

  const { mutate: setShowWatched } = useMutation({
    mutationFn: useConvexMutation(api.episodes.setShowWatched),
  });

  return (
    <Item role="listitem" variant="outline">
      <ItemMedia className="h-20 w-36" variant="image">
        {image ? (
          <Image alt={episode.name} height={80} src={image} width={144} />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <span className="icon-[lucide--info] h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </ItemMedia>
      <ItemContent className="gap-0">
        <ItemTitle className="gap-2">
          {episode.show.name}
          <Badge variant={variant}>
            S{episode.season} E{episode.number}
          </Badge>
        </ItemTitle>
        <ItemDescription>{episode.name}</ItemDescription>
        <ItemDescription className="mt-2 text-xs">
          {isAired
            ? `Aired ${formatDistanceToNow(airDate, { addSuffix: true })}`
            : `Airing ${formatDistanceToNow(airDate, { addSuffix: true })}`}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <IconConfirm
          confirmVariant={variant}
          description={`Do you really want to mark all episodes of ${episode.show.name} as watched?`}
          icon="icon-[lucide--eye-off]"
          label="Mark all as watched (show)"
          onClick={() =>
            setShowWatched({
              isWatched: true,
              showId: episode.showId,
            })
          }
          title="Mark all as watched?"
        />
        <IconConfirm
          confirmVariant={variant}
          description={`Do you really want to mark all episodes of season ${episode.season} as watched?`}
          icon="icon-[fluent--text-bullet-list-checkmark-20-filled]"
          label="Mark all as watched (season)"
          onClick={() =>
            setSeasonWatched({
              isWatched: true,
              season: episode.season,
              showId: episode.showId,
            })
          }
          title="Mark all as watched?"
        />
        {isAired && (
          <IconButton
            icon="icon-[mdi--eye-check]"
            label="Mark as watched"
            onClick={() => toggleWatched({ _id: episode._id })}
            variant={variant}
          />
        )}
        <IconButton
          icon="icon-[lucide--chevron-right]"
          label="View details"
          nativeButton={false}
          render={<Link params={{ showId: episode.showId }} to="/series/$showId" />}
          variant={variant}
        />
      </ItemActions>
    </Item>
  );
}
type EpisodeItemProps = {
  episode: Episodes["Entity"];
  variant?: VariantProps<typeof BADGE>["variant"];
};
