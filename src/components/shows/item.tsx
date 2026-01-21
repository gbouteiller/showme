import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { cva, type VariantProps } from "class-variance-authority";
import { getYear } from "date-fns";
import type { MouseEvent } from "react";
import { Badge } from "@/components/adapted/badge";
import { IconButton } from "@/components/adapted/icon-button";
import { Item, ItemActions, ItemContent, ItemTitle } from "@/components/ui/item";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import type { Shows } from "@/schemas/shows";

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
const ITEM = {
  actions: cva("relative gap-1"),
  base: cva(`relative h-16 overflow-hidden bg-cover bg-center px-2 py-0
  before:absolute before:inset-0 before:bg-linear-to-r before:from-black/80 before:to-black/30 before:content-['']
  hover:before:from-black/60 hover:before:to-black/10`),
  content: cva("relative"),
  star: cva("icon-[line-md--star-filled] size-2.5"),
};

export function ShowItem({ className, show, variant }: ShowItemProps) {
  const { mutate: setPreference, isPending } = useMutation({
    mutationFn: useConvexMutation(api.shows.setPreference),
  });

  const handleSetPreference = (preference: "favorite" | "ignored" | "unset") => (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setPreference({ _id: show._id, preference });
  };

  return (
    <Item
      className={cn(ITEM.base(), className)}
      render={<Link params={{ showId: show._id }} to="/series/$showId" />}
      role="listitem"
      style={{ backgroundImage: `url(${show.image})` }}
      variant="outline"
    >
      <ItemContent className={ITEM.content()}>
        <ItemTitle>
          <aside className="flex flex-col gap-2">
            <Badge className="w-full" variant={variant}>
              <span className={ITEM.star()} />
              {show.rating?.toFixed(1)}
            </Badge>
            {show.premiered && (
              <Badge className="w-full" variant="secondary">
                {getYear(show.premiered)}
              </Badge>
            )}
          </aside>
          {show.name}
        </ItemTitle>
      </ItemContent>
      <ItemActions className={ITEM.actions()}>
        <IconButton
          icon={show.preference !== "ignored" ? "icon-[mdi--heart-broken]" : "icon-[mdi--heart-outline]"}
          label={show.preference !== "ignored" ? "Ignore show" : "Stop ignoring show"}
          loading={isPending}
          onClick={handleSetPreference(show.preference !== "ignored" ? "ignored" : "unset")}
          size="icon-sm"
          variant="secondary"
        />
        <IconButton
          icon={show.preference !== "favorite" ? "icon-[mdi--heart]" : "icon-[mdi--heart-outline]"}
          label={show.preference !== "favorite" ? "Add to favorites" : "Remove from favorites"}
          loading={isPending}
          onClick={handleSetPreference(show.preference !== "favorite" ? "favorite" : "unset")}
          size="icon-sm"
          variant={variant}
        />
      </ItemActions>
    </Item>
  );
}
type ShowItemProps = {
  className?: string;
  show: Shows["Entity"];
  variant: VariantProps<typeof Badge>["variant"];
};
