import { Link } from "@tanstack/react-router";
import { cva } from "class-variance-authority";
import { Item, ItemActions, ItemContent, ItemTitle } from "@/components/ui/item";
import { cn } from "@/lib/utils";
import type { Shows } from "@/schemas/shows";
import { ShowsPreferenceSwitch } from "./preference";
import { ShowsPremiered } from "./premiered";
import { ShowsRating } from "./rating";

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
const ITEM = {
  actions: cva("relative flex flex-col gap-1"),
  base: cva(`relative overflow-hidden bg-cover bg-center p-1 fade-in-0 animate-in fill-mode-backwards duration-1000
  before:absolute before:inset-0 before:bg-linear-to-r before:from-black/80 before:to-black/30 before:content-['']
  hover:before:from-black/60 hover:before:to-black/10`),
  content: cva("relative"),
};

export function ShowsWidgetItem({ className, show }: ShowsWidgetItemProps) {
  return (
    <Item
      className={cn(ITEM.base(), className)}
      render={<Link params={{ showId: show._id }} to="/shows/$showId" />}
      role="listitem"
      style={{ backgroundImage: `url(${show.image})` }}
      variant="outline"
    >
      <ItemContent className={ITEM.content()}>
        <ItemTitle>
          <aside className="flex flex-col items-stretch gap-1">
            <ShowsRating className="h-7" show={show} />
            <ShowsPremiered className="h-7 w-auto" show={show} />
          </aside>
          {show.name}
        </ItemTitle>
      </ItemContent>
      <ItemActions className={ITEM.actions()}>
        <ShowsPreferenceSwitch first={{ variant: "secondary" }} second={{ variant: "default" }} show={show} />
      </ItemActions>
    </Item>
  );
}
type ShowsWidgetItemProps = {
  className?: string;
  show: Shows["Entity"];
};
