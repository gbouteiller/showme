import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { Image } from "@unpic/react";
import { api } from "convex/_generated/api";
import type { Favorite } from "convex/model/favorites";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

export function FavoriteItems({ items, kind }: { items: Array<Favorite>; kind: "unwatched" | "upcoming" }) {
  const { mutate: markAsWatched } = useMutation({
    mutationFn: useConvexMutation(api.favorites.markAsWatched),
    onSuccess: () => toast.success("Episode marqué comme vu avec succès"),
    onError: () => toast.error("Une erreur s'est produite"),
  });

  if (items.length === 0)
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="text-muted-foreground">Vous n&apos;avez pas d&apos;épisodes non vus qui ont déjà été diffusés.</p>
      </div>
    );

  return (
    <div className="space-y-4">
      {items.map(({ _id, episode, show }) => (
        <div className="flex items-center gap-4 rounded-lg border bg-card p-3 text-card-foreground shadow-sm" key={episode._id}>
          <div className="relative h-20 w-36 flex-shrink-0 overflow-hidden rounded-md">
            {episode.image ? (
              <Image
                alt={episode.name}
                className="object-cover"
                layout="fullWidth"
                sizes="(max-width: 768px) 100vw, 33vw"
                src={episode.image.medium}
              />
            ) : show.image ? (
              <Image
                alt={show.name}
                className="object-cover"
                layout="fullWidth"
                sizes="(max-width: 768px) 100vw, 33vw"
                src={show.image.medium}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <span className="icon-[lucide--info] h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="truncate font-medium">{show.name}</h4>
              <Badge className="ml-2" variant="outline">
                S{episode.season} E{episode.number}
              </Badge>
            </div>
            <p className="truncate text-muted-foreground text-sm">{episode.name}</p>
            <p className="mt-1 text-muted-foreground text-xs">
              Diffusé {formatDistanceToNow(episode.airstamp!, { addSuffix: true, locale: fr })}
            </p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="h-9 w-9 flex-shrink-0 bg-blue-500 text-white hover:bg-blue-600"
                  onClick={() => markAsWatched({ id: _id })}
                  size="icon"
                >
                  <span className="icon-[lucide--eye] size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Marquer comme vu</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ))}
    </div>
  );
}

// SKELETON ********************************************************************************************************************************
export function EpisodeItemsSkeleton() {
  return (
    <div className="space-y-4">
      {Array(3)
        .fill(0)
        .map((_, i) => (
          <Skeleton className="h-20 w-full" key={i} />
        ))}
    </div>
  );
}
