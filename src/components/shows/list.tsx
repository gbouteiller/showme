import { cva } from "class-variance-authority";
import type { Simplify } from "effect/Types";
import { useState } from "react";
import { Badge } from "@/components/adapted/badge";
import { CardDescription, CardHeader, CardTitle } from "@/components/adapted/card";
import { List, type ListArgs, type ListProps, type ListQueryProps } from "@/components/list";
import type { Shows } from "@/schemas/shows";
import { ShowsItem } from "./item";

// STYLES ----------------------------------------------------------------------------------------------------------------------------------
export const LIST = {
  description: cva("text-sm sm:text-base"),
  header: cva("flex items-center justify-between"),
  title: cva("flex items-center gap-2 font-bold text-2xl tracking-tight sm:text-3xl"),
  titleIcon: cva("text-primary"),
  total: cva("hidden sm:block"),
};

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export function ShowsList({ description, empty, handler, title, titleIcon }: ShowsListProps) {
  const [pageIndex, setPageIndex] = useState(0);

  return (
    <List
      className={{
        base: "bg-transparent p-0 ring-0",
        main: "@2xl:grid-cols-3 @4xl:grid-cols-4 @6xl:grid-cols-5 @lg:grid-cols-2",
      }}
      empty={empty}
      fallback={<div />}
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
      query={{ handler, args: { pageIndex, pageSize: 30, year: Number.POSITIVE_INFINITY }, setPageIndex }}
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
    }
>;

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
type ShowsListArgs = ListArgs & { year: number };
