import { cva } from "class-variance-authority";
import type { Simplify } from "effect/Types";
import { useState } from "react";
import { Badge } from "@/components/adapted/badge";
import { CardAction, CardDescription, CardHeader, CardTitle } from "@/components/adapted/card";
import { List, type ListArgs, type ListProps, type ListQueryProps } from "@/components/list";
import type { Shows } from "@/schemas/shows";
import { ShowsItem, ShowsItemSkeleton } from "./item";

// STYLES ----------------------------------------------------------------------------------------------------------------------------------
export const LIST = {
  description: cva("text-sm sm:text-base"),
  header: cva("flex items-center justify-between"),
  title: cva("flex items-center gap-2 font-bold text-2xl tracking-tight sm:text-3xl"),
  titleIcon: cva("text-primary"),
  total: cva("hidden sm:block"),
};

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export function ShowsList({
  description,
  empty,
  handler,
  title,
  titleIcon,
  pageIndex: propPageIndex,
  setPageIndex: propSetPageIndex,
  filters,
  preference,
  year,
}: ShowsListProps) {
  const [localPageIndex, setLocalPageIndex] = useState(0);
  const pageIndex = propPageIndex ?? localPageIndex;
  const setPageIndex = propSetPageIndex ?? setLocalPageIndex;

  return (
    <List
      className={{
        base: "bg-transparent p-0 ring-0",
        main: "@2xl:grid-cols-3 @4xl:grid-cols-4 @6xl:grid-cols-5 @lg:grid-cols-2",
      }}
      empty={empty}
      fallback={<ShowsItemSkeleton />}
      header={(data) => (
        <CardHeader className={LIST.header()}>
          <div className="flex flex-1 flex-col gap-1.5">
            <CardTitle className={LIST.title()}>
              <span className={LIST.titleIcon({ className: titleIcon })} />
              {title}
              <Badge className={LIST.total()}>{data?.total}</Badge>
            </CardTitle>
            <CardDescription className={LIST.description()}>{description}</CardDescription>
          </div>
          {filters && <CardAction>{filters}</CardAction>}
        </CardHeader>
      )}
      query={{ handler, args: { pageIndex, pageSize: 30, preference, year }, setPageIndex }}
    >
      {(show) => <ShowsItem key={show._id} show={show} />}
    </List>
  );
}
export type ShowsListProps = Simplify<
  Pick<ListProps<Shows["Entity"], ShowsListArgs>, "empty"> &
    Pick<ListQueryProps<Shows["Entity"], ShowsListArgs>, "handler"> & {
      description: string;
      title: string;
      titleIcon: string;
      pageIndex?: number;
      setPageIndex?: (pageIndex: number) => void;
      filters?: React.ReactNode;
      preference?: "favorite" | "ignored" | "unset";
      year?: number;
    }
>;

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
type ShowsListArgs = ListArgs & { year?: number; preference?: "favorite" | "ignored" | "unset" };
