import type { LinkOptions } from "@tanstack/react-router";
import { startOfHour } from "date-fns";
import type { Simplify } from "effect/Types";
import { useState } from "react";
import { Badge } from "@/components/adapted/badge";
import { CardAction, CardHeader, CardTitle } from "@/components/adapted/card";
import { LIST, List, ListActionViewAll, type ListArgs, type ListProps, type ListQueryProps } from "@/components/list";
import type { Episodes } from "@/schemas/episodes";
import { EpisodeItem, EpisodeItemSkeleton } from "./item";

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export function EpisodesWidget({ empty, handler, title, titleIcon, viewAll }: EpisodesWidgetProps) {
  const [pageIndex, setPageIndex] = useState(0);

  return (
    <List
      className={{ base: "w-full bg-transparent ring-0", content: "px-0", main: "@xl:grid-cols-2" }}
      empty={empty}
      fallback={<EpisodeItemSkeleton />}
      header={(data) => (
        <CardHeader className={LIST.header({ className: "px-0" })}>
          <CardTitle className={LIST.title()}>
            <span className={LIST.titleIcon({ className: titleIcon })} />
            {title}
            <Badge>{data?.total}</Badge>
          </CardTitle>
          <CardAction className={LIST.action()}>
            <ListActionViewAll link={viewAll} />
          </CardAction>
        </CardHeader>
      )}
      query={{ handler, args: { pageIndex, pageSize: 8, timestamp: startOfHour(new Date()).getTime() }, setPageIndex }}
    >
      {(episode) => <EpisodeItem episode={episode} key={episode._id} />}
    </List>
  );
}
export type EpisodesWidgetProps = Simplify<
  Pick<ListProps<Episodes["Entity"], EpisodesWidgetArgs>, "empty"> &
    Pick<ListQueryProps<Episodes["Entity"], EpisodesWidgetArgs>, "handler"> & { title: string; titleIcon: string; viewAll: LinkOptions }
>;

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
type EpisodesWidgetArgs = ListArgs & { timestamp: number };
