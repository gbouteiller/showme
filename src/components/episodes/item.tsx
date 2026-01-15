import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import type { VariantProps } from "class-variance-authority";
import { formatDistanceToNow, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { type BADGE, Badge } from "@/components/adapted/badge";
import { Button } from "@/components/adapted/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { api } from "@/convex/_generated/api";
import type { Episodes } from "@/schemas/episodes";

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
            ? `Diffusé ${formatDistanceToNow(airDate, { addSuffix: true, locale: fr })}`
            : `Sera diffusé ${formatDistanceToNow(airDate, { addSuffix: true, locale: fr })}`}
        </ItemDescription>
      </ItemContent>
      <ItemActions>
        <Dialog>
          <Tooltip>
            <TooltipTrigger
              render={
                <DialogTrigger
                  render={
                    <Button
                      aria-label="Tout marquer comme vu (série)"
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      size="icon"
                      variant="outline"
                    />
                  }
                >
                  <span className="icon-[mdi--movie-check] size-5" />
                </DialogTrigger>
              }
            />
            <TooltipContent>Tout marquer comme vu (série)</TooltipContent>
          </Tooltip>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tout marquer comme vu ?</DialogTitle>
              <DialogDescription>
                Voulez-vous vraiment marquer tous les épisodes de la série {episode.show.name} comme vus ?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Annuler</DialogClose>
              <DialogClose
                render={
                  <Button
                    onClick={() =>
                      setShowWatched({
                        isWatched: true,
                        showId: episode.showId,
                      })
                    }
                    variant={variant}
                  />
                }
              >
                Confirmer
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog>
          <Tooltip>
            <TooltipTrigger
              render={
                <DialogTrigger
                  render={
                    <Button
                      aria-label="Tout marquer comme vu (saison)"
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      size="icon"
                      variant="outline"
                    />
                  }
                >
                  <span className="icon-[fluent--text-bullet-list-checkmark-20-filled] size-5" />
                </DialogTrigger>
              }
            />
            <TooltipContent>Tout marquer comme vu (saison)</TooltipContent>
          </Tooltip>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tout marquer comme vu ?</DialogTitle>
              <DialogDescription>
                Voulez-vous vraiment marquer tous les épisodes de la saison {episode.season} comme vus ?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Annuler</DialogClose>
              <DialogClose
                render={
                  <Button
                    onClick={() =>
                      setSeasonWatched({
                        isWatched: true,
                        season: episode.season,
                        showId: episode.showId,
                      })
                    }
                    variant={variant}
                  />
                }
              >
                Confirmer
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {isAired && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  aria-label="Marquer comme vu"
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleWatched({ _id: episode._id });
                  }}
                  size="icon"
                  variant={variant}
                />
              }
            >
              <span className="icon-[mdi--eye-check] size-5" />
            </TooltipTrigger>
            <TooltipContent>Marquer comme vu</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label="Voir les détails"
                className="cursor-pointer"
                nativeButton={false}
                render={<Link params={{ episodeId: episode._id }} to="/episodes/$episodeId" />}
                size="icon"
                variant={variant}
              />
            }
          >
            <span className="icon-[lucide--chevron-right] size-5" />
          </TooltipTrigger>
          <TooltipContent>Voir les détails</TooltipContent>
        </Tooltip>
      </ItemActions>
    </Item>
  );
}
type EpisodeItemProps = {
  episode: Episodes["Entity"];
  variant?: VariantProps<typeof BADGE>["variant"];
};
