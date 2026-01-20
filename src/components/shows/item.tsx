import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { cva, type VariantProps } from "class-variance-authority";
import type { MouseEvent } from "react";
import { Badge } from "@/components/adapted/badge";
import { IconButton } from "@/components/adapted/icon-button";
import { Item, ItemActions, ItemContent, ItemTitle } from "@/components/ui/item";
import { api } from "@/convex/_generated/api";
import type { Shows } from "@/schemas/shows";

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
const ITEM = {
  actions: cva("relative"),
  base: cva(`relative h-16 overflow-hidden bg-cover bg-center px-2 py-0
  before:absolute before:inset-0 before:bg-linear-to-r before:from-black/80 before:to-black/30 before:content-['']
  hover:before:from-black/60 hover:before:to-black/10`),
  content: cva("relative"),
  star: cva("icon-[line-md--star-filled] size-2.5"),
};

export function ShowItem({ show, variant, onRemoveStart, onRemoveEnd }: ShowItemProps) {
  const { mutate: setPreference, isPending } = useMutation({
    mutationFn: useConvexMutation(api.shows.setPreference),
    onSuccess: () => {
      if (onRemoveEnd) onRemoveEnd();
    },
  });

  const handleSetPreference = (preference: "favorite" | "ignored" | "unset") => (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (onRemoveStart && (preference === "favorite" || preference === "ignored")) {
      onRemoveStart();
    }
    setPreference({ _id: show._id, preference });
  };

  return (
    <Item
      className={ITEM.base()}
      render={<Link params={{ showId: show._id }} to="/series/$showId" />}
      role="listitem"
      style={{ backgroundImage: `url(${show.image})` }}
      variant="outline"
    >
      <ItemContent className={ITEM.content()}>
        <ItemTitle>
          <Badge variant={variant}>
            <span className={ITEM.star()} />
            {show.rating?.toFixed(1)}
          </Badge>
          {show.name}
        </ItemTitle>
      </ItemContent>
      <ItemActions className={ITEM.actions()}>
        <IconButton
          icon="icon-[mdi--heart-broken]"
          label="Ignorer la série"
          loading={isPending}
          onClick={handleSetPreference("ignored")}
          size="icon-sm"
        />
        <IconButton
          icon="icon-[mdi--heart]"
          label="Ajouter aux favoris"
          loading={isPending}
          onClick={handleSetPreference("favorite")}
          size="icon-sm"
          variant={variant}
        />
      </ItemActions>
    </Item>
  );
}
type ShowItemProps = {
  show: Shows["Entity"];
  variant: VariantProps<typeof Badge>["variant"];
  onRemoveStart?: () => void;
  onRemoveEnd?: () => void;
};
