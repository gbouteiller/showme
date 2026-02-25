import { Image } from "@unpic/react";
import { cva } from "class-variance-authority";
import { Skeleton } from "@/components/ui/skeleton";
import type { Shows } from "@/schemas/shows";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../adapted/card";
import { ShowsLink } from "./link";
import { ShowsPreferenceBadge, ShowsPreferenceSwitch } from "./preference";
import { ShowsPremiered } from "./premiered";
import { ShowsRating } from "./rating";

// STYLES ----------------------------------------------------------------------------------------------------------------------------------
export const SHOWS_ITEM = {
  actions: cva("flex items-center justify-center gap-2"),
  base: cva("group/show relative overflow-hidden border p-0 ring-0 transition-all duration-300 hover:-translate-y-1 hover:border-primary"),
  content:
    cva(`absolute inset-0 z-20 bg-background/60 py-10 px-6 flex flex-col gap-4 items-center justify-center opacity-0 backdrop-blur-md transition-opacity duration-300 
        group-hover/show:opacity-100`),
  description: cva("line-clamp-5 text-center text-foreground"),
  header: cva("absolute inset-x-2 bottom-2 z-30 bg-secondary/90 p-2"),
  image: cva("size-full object-cover transition-transform duration-700 group-hover/show:scale-110"),
  infos: cva("absolute inset-x-2 top-2 z-30 flex items-stretch justify-between"),
  infosRight: cva("flex items-stretch gap-1"),
  title: cva("line-clamp-1 text-center font-light tracking-tight"),
  wrapper: cva("relative aspect-2/3 w-full overflow-hidden"),
};

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export function ShowsItem({ show }: ShowsItemProps) {
  return (
    <Card className={SHOWS_ITEM.base()} key={show._id}>
      <div className={SHOWS_ITEM.wrapper()}>
        {show.image ? (
          <Image alt={show.name} className={SHOWS_ITEM.image()} layout="fullWidth" src={show.image} />
        ) : (
          <div className="flex size-full items-center justify-center bg-muted">
            <span className="icon-[lucide--tv] size-12 text-muted-foreground/50" />
          </div>
        )}
        <aside className={SHOWS_ITEM.infos()}>
          <ShowsPremiered show={show} />
          <div className={SHOWS_ITEM.infosRight()}>
            <ShowsRating show={show} />
            <ShowsPreferenceBadge show={show} />
          </div>
        </aside>
        <CardContent className={SHOWS_ITEM.content()}>
          <CardDescription className={SHOWS_ITEM.description()}>
            {show.summary?.replace(/<[^>]*>/g, "") || "No description available"}
          </CardDescription>
          <div className={SHOWS_ITEM.actions()}>
            <ShowsPreferenceSwitch show={show} />
            <ShowsLink show={show} />
          </div>
        </CardContent>
      </div>
      <CardHeader className={SHOWS_ITEM.header()}>
        <CardTitle className={SHOWS_ITEM.title()}>{show.name}</CardTitle>
      </CardHeader>
    </Card>
  );
}
type ShowsItemProps = {
  className?: string;
  onSetPreference?: () => void;
  show: Shows["Entity"];
};

// SKELETON --------------------------------------------------------------------------------------------------------------------------------
export function ShowsItemSkeleton() {
  return (
    <Card className={SHOWS_ITEM.wrapper()}>
      <div className={SHOWS_ITEM.infos()}>
        <Skeleton className="h-5.5 w-11.5" />
        <div className={SHOWS_ITEM.infosRight()}>
          <Skeleton className="h-5.5 w-12" />
          <Skeleton className="size-5.5" />
        </div>
      </div>
      <CardHeader className={SHOWS_ITEM.header()}>
        <Skeleton className={SHOWS_ITEM.title({ className: "h-5" })} />
      </CardHeader>
    </Card>
  );
}
