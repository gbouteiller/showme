import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { cva } from "class-variance-authority";
import { formatDistanceToNow, isPast } from "date-fns";
import { Badge } from "@/components/adapted/badge";
import { IconButton } from "@/components/adapted/icon-button";
import { IconConfirm } from "@/components/adapted/icon-confirm";
import { Item, ItemActions, ItemContent, ItemDescription, ItemTitle } from "@/components/adapted/item";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/convex/_generated/api";
import type { Episodes } from "@/schemas/episodes";

// STYLES ----------------------------------------------------------------------------------------------------------------------------------
export const EPISODE_ITEM = {
  actions:
    cva(`absolute inset-0 flex items-end justify-center gap-2 bg-background/40 pb-2 opacity-0 backdrop-blur-md transition-opacity duration-300 
    group-hover/episode:opacity-100`),
  airDate: cva("absolute top-2 right-2 z-30"),
  aside: cva("relative aspect-video h-24 overflow-hidden bg-muted"),
  base: cva(`group/episode relative overflow-hidden transition-all duration-300 bg-card p-0 
    hover:-translate-y-1 hover:border-primary`),
  content: cva("p-2"),
  description: cva("line-clamp-1"),
  image: cva("size-full object-cover transition-transform duration-700 group-hover/episode:scale-110"),
  noImage: cva("flex size-full items-center justify-center bg-muted"),
  noImageIcon: cva("icon-[lucide--info] size-6 text-muted-foreground/50"),
  title: cva("line-clamp-1"),
};

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export function EpisodeItem({ episode }: EpisodeItemProps) {
  const airDate = new Date(episode.airstamp);
  const isAired = isPast(airDate);

  return (
    <Item className={EPISODE_ITEM.base()} variant="outline">
      <ItemContent className={EPISODE_ITEM.content()}>
        <Badge>
          S{episode.season} E{episode.number}
        </Badge>
        <ItemTitle className={EPISODE_ITEM.title()}>{episode.show.name}</ItemTitle>
        <ItemDescription className={EPISODE_ITEM.description()}>{episode.name}</ItemDescription>
      </ItemContent>

      <ItemActions className={EPISODE_ITEM.aside()}>
        <EpisodeItemImage episode={episode} />
        <EpisodeItemActions episode={episode} isAired={isAired} />
      </ItemActions>

      <Badge className={EPISODE_ITEM.airDate()} variant="secondary">
        {formatDistanceToNow(airDate, { addSuffix: true })}
      </Badge>
    </Item>
  );
}
type EpisodeItemProps = {
  episode: Episodes["Entity"];
};

// ACTIONS ---------------------------------------------------------------------------------------------------------------------------------
export function EpisodeItemActions({ episode: { _id, season, show, showId }, isAired }: EpisodeItemActionsProps) {
  const { mutate: setWatched } = useMutation({ mutationFn: useConvexMutation(api.episodes.setWatched) });
  const { mutate: setSeasonWatched } = useMutation({ mutationFn: useConvexMutation(api.episodes.setSeasonWatched) });
  const { mutate: setShowWatched } = useMutation({ mutationFn: useConvexMutation(api.episodes.setShowWatched) });

  return (
    <div className={EPISODE_ITEM.actions()}>
      <IconConfirm
        description={`Do you really want to mark all episodes of ${show.name} as watched?`}
        icon="icon-[lucide--eye-off]"
        label="Mark all as watched (show)"
        onClick={() => setShowWatched({ isWatched: true, showId })}
        title="Mark all as watched?"
      />
      <IconConfirm
        description={`Do you really want to mark all episodes of season ${season} as watched?`}
        icon="icon-[fluent--text-bullet-list-checkmark-20-filled]"
        label="Mark all as watched (season)"
        onClick={() => setSeasonWatched({ isWatched: true, season, showId })}
        title="Mark all as watched?"
      />
      {isAired && (
        <IconButton
          icon="icon-[mdi--eye-check]"
          label="Mark as watched"
          onClick={() => setWatched({ _id, isWatched: true })}
          variant="default"
        />
      )}
      <IconButton
        icon="icon-[lucide--chevron-right]"
        label="View details"
        nativeButton={false}
        render={<Link params={{ showId }} to="/shows/$showId" />}
        variant="default"
      />
    </div>
  );
}
type EpisodeItemActionsProps = { episode: Episodes["Entity"]; isAired: boolean };

// IMAGE -----------------------------------------------------------------------------------------------------------------------------------
export function EpisodeItemImage({ episode: { image: img, name, show } }: EpisodeItemImageProps) {
  const image = img ?? show.image;
  if (image) return <Image alt={name} className={EPISODE_ITEM.image()} layout="fullWidth" src={image} />;
  return (
    <div className={EPISODE_ITEM.noImage()}>
      <span className={EPISODE_ITEM.noImageIcon()} />
    </div>
  );
}
type EpisodeItemImageProps = { episode: Episodes["Entity"] };

// SKELETON --------------------------------------------------------------------------------------------------------------------------------
export function EpisodeItemSkeleton() {
  return (
    <div className="relative flex h-24 overflow-hidden border bg-card p-0 transition-all duration-300">
      <div>
        <Skeleton className="mb-2 h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className={EPISODE_ITEM.actions()}>
        <Skeleton className="size-full" />
      </div>
    </div>
  );
}
