import type { Value } from "convex/values";
import { Effect as E, Option as O } from "effect";
import { NoSuchElementException } from "effect/Cause";
import { DatabaseReader } from "@/convex/effex/services/DatabaseReader";
import type { Pagination } from "@/convex/effex/utils";
import type { Episodes } from "@/schemas/episodes";
import type { Shows } from "@/schemas/shows";
import { showFromDoc } from "./shows";
import { type ReadPaginatedProps, readPaginated } from "./utils";

// TRANSFORMS ------------------------------------------------------------------------------------------------------------------------------
export const episodeFromDoc = E.fn(function* (doc: Episodes["Doc"]) {
  const db = yield* DatabaseReader;
  const showDoc = yield* db.get("shows", doc.showId);
  if (O.isNone(showDoc)) return yield* new NoSuchElementException("missing show doc");
  const show = yield* showFromDoc(showDoc.value);
  return { ...doc, show };
});

// READ ------------------------------------------------------------------------------------------------------------------------------------
export const readEpisodeByApiId = E.fn(function* ({ apiId }: Episodes["ApiRef"]) {
  const db = yield* DatabaseReader;
  return yield* db
    .query("episodes")
    .withIndex("by_api", (q) => q.eq("apiId", apiId))
    .first();
});

export const readEpisodesByShow = E.fn(function* ({ _id }: Shows["Ref"]) {
  const db = yield* DatabaseReader;
  return yield* db
    .query("episodes")
    .withIndex("by_show", (q) => q.eq("showId", _id))
    .collect();
});

export const readPaginatedEpisodes = <K extends Value, N extends Value | undefined>(
  props: Pick<ReadPaginatedProps<"episodes", K, N>, "aggregate" | "opts">
) =>
  E.fn(function* (pagination: Pagination) {
    const { page, total } = yield* readPaginated({ ...props, ...pagination, table: "episodes" });
    return { items: yield* E.all(page.map(episodeFromDoc)), total };
  });
