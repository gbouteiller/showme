import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { cva, type VariantProps } from "class-variance-authority";
import { type BADGE, Badge } from "@/components/adapted/badge";
import { Button } from "@/components/adapted/button";
import { Item, ItemActions, ItemContent, ItemTitle } from "@/components/ui/item";
import { api } from "@/convex/_generated/api";
import type { Shows } from "@/schemas/shows";

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
const ITEM = {
  base: cva(`relative h-16 overflow-hidden bg-cover bg-center 
  before:absolute before:inset-0 before:bg-linear-to-r before:from-black/80 before:to-black/30 before:content-['']
  hover:before:from-black/60 hover:before:to-black/10`),
  favorite: cva("size-5", {
    variants: {
      isFavorite: {
        true: "icon-[line-md--heart-filled]",
        false: "icon-[line-md--heart]",
      },
    },
  }),
};

export function ShowItem({ show, variant }: ShowItemProps) {
  const limit = 10;
  const { mutate: setFavorite } = useMutation({
    mutationFn: useConvexMutation(api.shows.setFavorite).withOptimisticUpdate((localStore, { _id, isFavorite }) => {
      const currentShows = localStore.getQuery(api.shows.readManyTopRated, { limit });
      if (!currentShows) return;
      const updatedShows = currentShows.map((show) => (show._id === _id ? { ...show, isFavorite } : show));
      localStore.setQuery(api.shows.readManyTopRated, { limit }, updatedShows);
    }),
  });

  return (
    <div className="flex flex-col gap-2">
      <Item
        className={ITEM.base()}
        render={<Link params={{ showId: show._id }} to="/series/$showId" />}
        role="listitem"
        style={{ backgroundImage: `url(${show.image})` }}
        variant="outline"
      >
        <ItemContent className="relative">
          <ItemTitle>
            <Badge variant={variant}>
              <span className="icon-[line-md--star-filled] size-2.5" />
              {show.rating?.toFixed(1)}
            </Badge>
            {show.name}
          </ItemTitle>
        </ItemContent>
        <ItemActions>
          <Button
            aria-label="Ajouter aux favoris"
            className="cursor-pointer hover:text-rose-500"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setFavorite({ _id: show._id, isFavorite: !show.isFavorite });
            }}
            size="icon"
            variant="link"
          >
            <span className={ITEM.favorite({ isFavorite: show.isFavorite })} />
          </Button>
        </ItemActions>
      </Item>
    </div>
  );
}
type ShowItemProps = { show: Shows["Entity"]; variant: VariantProps<typeof BADGE>["variant"] };
