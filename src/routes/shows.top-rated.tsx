import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Separator } from "@/components/adapted/separator";
import { ShowsList } from "@/components/shows/list";
import { ShowsPreferenceToggle } from "@/components/shows/preference";
import { YearSelect } from "@/components/year-select";
import { api } from "@/convex/_generated/api";
import type { Shows } from "@/schemas/shows";

const searchSchema = z.object({
  pageIndex: z.number().default(0).catch(0),
  preference: z.enum(["favorite", "ignored", "unset"]).optional().catch(undefined),
  year: z.number().optional().catch(undefined),
});

// ROUTE -----------------------------------------------------------------------------------------------------------------------------------
export const Route = createFileRoute("/shows/top-rated")({
  validateSearch: searchSchema,
  component: TopRatedShowsPage,
});

// PAGE ------------------------------------------------------------------------------------------------------------------------------------
function TopRatedShowsPage() {
  const { pageIndex, preference, year } = Route.useSearch();
  const navigate = Route.useNavigate();

  const handlePreferenceChange = (value: Shows["Preference"]) =>
    navigate({ search: (prev) => ({ ...prev, pageIndex: 0, preference: prev.preference === value ? undefined : value }) });

  return (
    <ShowsList
      description="Explore the shows most appreciated by critics and the audience"
      empty="No shows found."
      filters={
        <div className="flex flex-col-reverse items-end gap-1 sm:flex-row sm:gap-2">
          <YearSelect onValueChange={(value) => navigate({ search: (prev) => ({ ...prev, pageIndex: 0, year: value }) })} year={year} />
          <Separator orientation="vertical" />
          <ShowsPreferenceToggle onValueChange={handlePreferenceChange} preference={preference} />
        </div>
      }
      handler={api.shows.readPaginatedTopRated}
      pageIndex={pageIndex}
      preference={preference}
      setPageIndex={(page) => navigate({ search: (prev) => ({ ...prev, pageIndex: page }) })}
      title="Top Rated Shows"
      titleIcon="icon-[lucide--star]"
      year={year}
    />
  );
}
