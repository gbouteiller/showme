import { createFileRoute, linkOptions } from "@tanstack/react-router";
import { Separator } from "@/components/adapted/separator";
import { EpisodesWidget } from "@/components/episodes/widget";
import { ShowsWidget } from "@/components/shows/widget";
import { api } from "@/convex/_generated/api";

// ROUTE -----------------------------------------------------------------------------------------------------------------------------------
export const Route = createFileRoute("/")({
  component: IndexPage,
});

// PAGE ------------------------------------------------------------------------------------------------------------------------------------
function IndexPage() {
  return (
    <div className="space-y-6 px-4">
      <div className="flex flex-col gap-6 sm:flex-row">
        <EpisodesWidget
          empty="You don't have any upcoming episodes yet."
          handler={api.episodes.readPaginatedUpcoming}
          title="Upcoming Episodes"
          titleIcon="icon-[lucide--calendar]"
          viewAll={linkOptions({ to: "/episodes/upcoming" })}
        />
        <Separator orientation="vertical" />
        <EpisodesWidget
          empty="You don't have any unwatched episodes yet."
          handler={api.episodes.readPaginatedUnwatched}
          title="Unwatched Episodes"
          titleIcon="icon-[lucide--eye]"
          viewAll={linkOptions({ to: "/episodes/unwatched" })}
        />
      </div>
      <ShowsWidget
        empty="You don't have any trending shows yet."
        handler={api.shows.readPaginatedTrendingUnset}
        title="Trending Shows"
        titleIcon="icon-[lucide--trending-up]"
        viewAll={linkOptions({ to: "/shows/trending" })}
      />
      <ShowsWidget
        empty="You don't have any top rated shows yet."
        handler={api.shows.readPaginatedTopRatedUnset}
        title="Top Rated Shows"
        titleIcon="icon-[lucide--star]"
        viewAll={linkOptions({ to: "/shows/top-rated" })}
      />
    </div>
  );
}
