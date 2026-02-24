import { convexQuery } from "@convex-dev/react-query";
import { keepPreviousData, type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { LinkOptions } from "@tanstack/react-router";
import Autoplay from "embla-carousel-autoplay";
import { useState } from "react";
import { Carousel, type CarouselApi, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/adapted/carousel";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/adapted/select";
import type { ListArgs, ListData, ListProps, ListQueryProps } from "@/components/list";
import { LIST, ListActionViewAll } from "@/components/list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Shows } from "@/schemas/shows";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "../adapted/card";
import { ShowsItem, ShowsItemSkeleton } from "./item";

// CONSTS ----------------------------------------------------------------------------------------------------------------------------------
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1960 + 1 }, (_, i) => 1960 + i).reverse();

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export function ShowsWidget({ empty, handler, title, titleIcon, viewAll }: ShowsWidgetProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [year, setYear] = useState<number | undefined>(undefined);

  const result = useQuery({ ...convexQuery(handler, { pageIndex, pageSize: 20, year }), placeholderData: keepPreviousData });

  return (
    <Card>
      <CardHeader className={LIST.header()}>
        <CardTitle className={LIST.title()}>
          <span className={LIST.titleIcon({ className: titleIcon })} />
          {title}
        </CardTitle>
        <CardAction className={LIST.action()}>
          <YearSelect setPageIndex={setPageIndex} setYear={setYear} year={year} />
          <ListActionViewAll link={viewAll} />
        </CardAction>
      </CardHeader>
      <CardContent>
        <WidgetItems empty={empty} query={{ result }} />
      </CardContent>
    </Card>
  );
}
export type ShowsWidgetProps = Pick<ListProps<Shows["Entity"], ShowsWidgetArgs>, "empty"> &
  Pick<ListQueryProps<Shows["Entity"], ShowsWidgetArgs>, "handler"> & { title: string; titleIcon: string; viewAll: LinkOptions };

// ITEMS -----------------------------------------------------------------------------------------------------------------------------------
function WidgetItems({ empty, query: { result } }: WidgetItemsProps) {
  const [api, setApi] = useState<CarouselApi>(); // TODO: use api to reset carousel when year is changed
  const { data, error, isError, isLoading } = result;

  if (isLoading)
    return (
      <Carousel className="@container mx-12" opts={{ loop: true }}>
        <CarouselContent>
          {Array.from({ length: 20 }, (_, i) => i).map((i) => (
            <CarouselItem className="@2xl:basis-1/3 @4xl:basis-1/4 @5xl:basis-1/5 @7xl:basis-1/6 @sm:basis-1/2" key={i}>
              <ShowsItemSkeleton />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    );

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

  return (
    <Carousel className="@container mx-12" opts={{ loop: true }} plugins={[Autoplay({ delay: 5000 })]} setApi={setApi}>
      <CarouselContent className="py-1">
        {result.data?.items.map((show) => (
          <CarouselItem className="@2xl:basis-1/3 @4xl:basis-1/4 @5xl:basis-1/5 @7xl:basis-1/6 @sm:basis-1/2" key={show._id}>
            <ShowsItem show={show} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}
export type WidgetItemsProps = {
  empty: string;
  query: { result: UseQueryResult<ListData<Shows["Entity"]>> };
};

// YEAR SELECT -----------------------------------------------------------------------------------------------------------------------------
function YearSelect({ setPageIndex, setYear, year }: YearSelectProps) {
  const handleYearChange = (value: number | null) => {
    setPageIndex(0);
    setYear(value ?? undefined);
  };

  return (
    <Select onValueChange={handleYearChange} value={year}>
      <SelectTrigger size="sm">
        <SelectValue placeholder="All years" render={() => <span>{year === undefined ? "All" : year}</span>} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={undefined}>All years</SelectItem>
        {YEARS.map((year) => (
          <SelectItem key={year} value={year}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
type YearSelectProps = { setPageIndex: (pageIndex: number) => void; setYear: (year: number | undefined) => void; year: number | undefined };

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
type ShowsWidgetArgs = ListArgs & { year: number | undefined };
