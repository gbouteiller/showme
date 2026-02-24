import { cva } from "class-variance-authority";
import { startOfHour } from "date-fns";
import type { Simplify } from "effect/Types";
import { useState } from "react";
import { Badge } from "@/components/adapted/badge";
import { CardDescription, CardHeader, CardTitle } from "@/components/adapted/card";
import { List, type ListArgs, type ListProps, type ListQueryProps } from "@/components/list";
import type { Episodes } from "@/schemas/episodes";
import { EpisodeItem, EpisodeItemSkeleton } from "./item";

// STYLES ----------------------------------------------------------------------------------------------------------------------------------
export const LIST = {
  description: cva("text-sm sm:text-base"),
  header: cva("flex items-center justify-between"),
  title: cva("flex items-center gap-2 font-bold text-2xl tracking-tight sm:text-3xl"),
  titleIcon: cva("text-primary"),
  total: cva("hidden sm:block"),
};

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export function EpisodesList({ description, empty, handler, title, titleIcon }: EpisodesListProps) {
  const [pageIndex, setPageIndex] = useState(0);

  return (
    <List
      className={{ base: "bg-transparent p-0 ring-0", main: "@4xl:grid-cols-3 @6xl:grid-cols-4 @xl:grid-cols-2" }}
      empty={empty}
      fallback={<EpisodeItemSkeleton />}
      header={(data) => (
        <CardHeader>
          <CardTitle className={LIST.title()}>
            <span className={LIST.titleIcon({ className: titleIcon })} />
            {title}
            <Badge className={LIST.total()}>{data?.total}</Badge>
          </CardTitle>
          <CardDescription className={LIST.description()}>{description}</CardDescription>
        </CardHeader>
      )}
      query={{ handler, args: { pageIndex, pageSize: 30, timestamp: startOfHour(new Date()).getTime() }, setPageIndex }}
    >
      {(episode) => <EpisodeItem episode={episode} key={episode._id} />}
    </List>
  );
}
export type EpisodesListProps = Simplify<
  Pick<ListProps<Episodes["Entity"], EpisodesListArgs>, "empty"> &
    Pick<ListQueryProps<Episodes["Entity"], EpisodesListArgs>, "handler"> & {
      description: string;
      title: string;
      titleIcon: string;
    }
>;

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
type EpisodesListArgs = ListArgs & { timestamp: number };
