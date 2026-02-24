import { convexQuery } from "@convex-dev/react-query";
import { keepPreviousData, type UseQueryResult, useQuery } from "@tanstack/react-query";
import { Link, type LinkOptions } from "@tanstack/react-router";
import { cva } from "class-variance-authority";
import type { FunctionReference } from "convex/server";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/adapted/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { Button } from "./adapted/button";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

// STYLES ----------------------------------------------------------------------------------------------------------------------------------
export const LIST = {
  action: cva(`flex flex-col-reverse 
    @sm:flex-row @sm:items-center @sm:gap-2`),
  base: cva("@container space-y-4"),
  content: cva("space-y-4"),
  fallback: cva("fade-in-0 animate-in fill-mode-backwards"),
  header: cva("flex items-center justify-between"),
  main: cva("relative grid grid-cols-1 gap-4"),
  spinner: cva("size-8 text-primary"),
  spinnerOverlay: cva(
    "absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-sm transition-opacity duration-300"
  ),
  title: cva("flex items-center gap-2 font-bold text-xl"),
  titleIcon: cva("size-5 text-primary"),
};

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export function List<I, A extends ListArgs>({ className: C, header, query, ...rest }: ListProps<I, A>) {
  const { handler, args } = query;

  // biome-ignore lint/suspicious/noExplicitAny: type problem with convexQuery
  const result = useQuery({ ...convexQuery(handler, args as any), placeholderData: keepPreviousData });

  return (
    <Card className={cn(LIST.base(), C?.base)}>
      {header(result.data)}
      <CardContent className={cn(LIST.content(), C?.content)}>
        <main className={cn(LIST.main(), C?.main)}>
          {result.isRefetching && (
            <div className={cn(LIST.spinnerOverlay(), C?.spinnerOverlay)}>
              <Spinner className={cn(LIST.spinner(), C?.spinner)} />
            </div>
          )}
          <ListItems {...rest} query={{ ...query, result }} />
        </main>
        <ListPagination query={{ ...query, result }} />
      </CardContent>
    </Card>
  );
}
export type ListProps<I, A extends ListArgs = ListArgs> = {
  className?: Partial<Record<keyof typeof LIST, string>>;
  children: (item: I) => React.ReactNode;
  empty: React.ReactNode;
  fallback: React.ReactNode;
  header: (data: ListData<I> | undefined) => React.ReactNode;
  query: ListQueryProps<I, A>;
};

// ACTION VIEW ALL -------------------------------------------------------------------------------------------------------------------------
export function ListActionViewAll({ className, link }: ListActionViewAllProps) {
  return (
    <Button className={cn("px-0", className)} nativeButton={false} render={<Link {...link} />} variant="link">
      View all
    </Button>
  );
}
export type ListActionViewAllProps = { className?: string; link: LinkOptions };

// ITEMS -----------------------------------------------------------------------------------------------------------------------------------
function ListItems<I, A extends ListArgs = ListArgs>({ children, empty, fallback, query: { args, result } }: ListItemsProps<I, A>) {
  const { pageSize } = args;
  const { data, error, isError, isLoading } = result;

  if (isLoading)
    return Array.from({ length: pageSize }, (_, i) => i).map((i) => (
      <div className={LIST.fallback()} key={i} style={{ animationDelay: `${i * 30}ms` }}>
        {fallback}
      </div>
    ));

  if (isError)
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );

  if (data?.items.length === 0)
    return (
      <Alert>
        <AlertTitle>No results</AlertTitle>
        <AlertDescription>{empty}</AlertDescription>
      </Alert>
    );

  return (data?.items ?? []).map(children);
}
export type ListItemsProps<I, A extends ListArgs = ListArgs> = Pick<ListProps<I, A>, "children" | "empty" | "fallback"> & {
  query: ListQueryWithResultProps<I, A>;
};

// PAGINATION ------------------------------------------------------------------------------------------------------------------------------
function ListPagination<I, A extends ListArgs = ListArgs>({ query: { args, result, setPageIndex } }: ListPaginationProps<I, A>) {
  const { pageIndex, pageSize } = args;
  const { data, isRefetching } = result;
  const maxPageIndex = useMemo(() => Math.ceil((data?.total ?? 0) / pageSize) - 1, [data, pageSize]);

  const goToPage = (page: number) => {
    if (page < 0 || page > maxPageIndex) return;
    setPageIndex(page);
  };

  return (
    <Pagination>
      <PaginationContent className={cn("transition-opacity duration-200", isRefetching && "opacity-60")}>
        <PaginationItem>
          <PaginationPrevious
            className={cn(
              "transition-all duration-200",
              pageIndex > 0 ? "cursor-pointer hover:scale-105 hover:bg-accent active:scale-95" : "pointer-events-none opacity-50"
            )}
            onClick={() => goToPage(pageIndex - 1)}
          />
        </PaginationItem>
        {pageIndex > 1 && (
          <PaginationItem>
            <PaginationLink className="transition-all duration-200 hover:scale-105 active:scale-95" onClick={() => goToPage(0)}>
              1
            </PaginationLink>
          </PaginationItem>
        )}
        {pageIndex > 2 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        {pageIndex > 0 && (
          <PaginationItem>
            <PaginationLink className="transition-all duration-200 hover:scale-105 active:scale-95" onClick={() => goToPage(pageIndex - 1)}>
              {pageIndex}
            </PaginationLink>
          </PaginationItem>
        )}
        <PaginationItem>
          <PaginationLink isActive>{pageIndex + 1}</PaginationLink>
        </PaginationItem>
        {pageIndex < maxPageIndex && (
          <PaginationItem>
            <PaginationLink className="transition-all duration-200 hover:scale-105 active:scale-95" onClick={() => goToPage(pageIndex + 1)}>
              {pageIndex + 2}
            </PaginationLink>
          </PaginationItem>
        )}
        <PaginationItem>
          <PaginationNext
            className={cn(
              "transition-all duration-200",
              pageIndex < maxPageIndex ? "cursor-pointer hover:scale-105 hover:bg-accent active:scale-95" : "pointer-events-none opacity-50"
            )}
            onClick={() => goToPage(pageIndex + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
export type ListPaginationProps<I, A extends ListArgs = ListArgs> = { query: ListQueryWithResultProps<I, A> };

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
export type ListArgs = { pageIndex: number; pageSize: number };
export type ListData<I> = { items: I[] | readonly I[]; total: number };

export type ListQueryProps<I, A extends ListArgs = ListArgs> = {
  args: A;
  handler: FunctionReference<"query", "public", A, ListData<I>>;
  setPageIndex: (pageIndex: A["pageIndex"]) => void;
};
export type ListQueryWithResultProps<I, A extends ListArgs = ListArgs> = ListQueryProps<I, A> & { result: UseQueryResult<ListData<I>> };
