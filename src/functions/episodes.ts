import type { Value } from "convex/values";
import { Array as Arr, Cause, Effect as E, Option as O } from "effect";
import type { Simplify } from "effect/Types";
import { DatabaseReader } from "@/convex/effex/services/DatabaseReader";
import { DatabaseWriter } from "@/convex/effex/services/DatabaseWriter";
import type { Pagination } from "@/convex/effex/utils";
import type { ApiId } from "@/schemas/api";
import type { Episodes } from "@/schemas/episodes";
import type { Shows } from "@/schemas/shows";
import { showFromDoc } from "./shows";
import { type ReadPaginatedProps, readPaginated } from "./utils";

// TRANSFORMS ------------------------------------------------------------------------------------------------------------------------------
export const episodeFromDoc = E.fn(function* (doc: Episodes["Doc"]) {
  const db = yield* DatabaseReader;
  const showDoc = yield* db.get("shows", doc.showId);
  if (O.isNone(showDoc)) return yield* new Cause.NoSuchElementError("missing show doc");
  const show = yield* showFromDoc(showDoc.value);
  return { ...doc, show };
});

export const hasAirstamp = (
  episode: Episodes["Dto"]
): episode is Simplify<Omit<Episodes["Dto"], "airstamp"> & { readonly airstamp: string }> => episode.airstamp !== null;

export const filterValidEpisodes = (episodes: readonly Episodes["Dto"][]) => Arr.filter(episodes, hasAirstamp);

// READ ------------------------------------------------------------------------------------------------------------------------------------
export const hasEpisodesByShow = E.fn(function* (showId: Shows["Id"]) {
  const db = yield* DatabaseReader;
  return (yield* db
    .query("episodes")
    .withIndex("by_show", (q) => q.eq("showId", showId))
    .first()).pipe(O.isSome);
});

export const readEpisodeByApiId = E.fn(function* (apiId: ApiId) {
  const db = yield* DatabaseReader;
  return yield* db
    .query("episodes")
    .withIndex("by_api", (q) => q.eq("apiId", apiId))
    .first();
});

export const readEpisodesByShow = E.fn(function* (showId: Shows["Id"]) {
  const db = yield* DatabaseReader;
  return yield* db
    .query("episodes")
    .withIndex("by_show", (q) => q.eq("showId", showId))
    .collect();
});

export const readPaginatedEpisodes = <K extends Value, N extends Value | undefined>(
  props: Pick<ReadPaginatedProps<"episodes", K, N>, "aggregate" | "opts">
) =>
  E.fn(function* (pagination: Pagination) {
    const { page, total } = yield* readPaginated({ ...props, ...pagination, table: "episodes" });
    return { items: yield* E.all(page.map(episodeFromDoc)), total };
  });

// UPSERT ----------------------------------------------------------------------------------------------------------------------------------
export const upsertEpisodesForShow = E.fn(function* ({ creates, show: { _id: showId, preference } }: UpsertEpisodesForShowArgs) {
  const db = yield* DatabaseWriter;
  for (const create of creates) {
    const existing = yield* readEpisodeByApiId(create.apiId);
    const episodeData = { ...create, preference, showId };
    if (O.isNone(existing)) yield* db.insert("episodes", episodeData);
    else yield* db.patch("episodes", existing.value._id, { ...episodeData, isWatched: existing.value.isWatched });
  }
  return null;
});
type UpsertEpisodesForShowArgs = { creates: Episodes["Create"][]; show: Pick<Shows["Doc"], "_id" | "preference"> };
