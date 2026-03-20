import type { Value } from "convex/values";
import { Effect as E, HashMap as H, Option as O } from "effect";
import type { Id } from "@/convex/_generated/dataModel";
import { DatabaseReader } from "@/convex/effex/services/DatabaseReader";
import { DatabaseWriter } from "@/convex/effex/services/DatabaseWriter";
import { optionMapEffect, type Pagination } from "@/convex/effex/utils";
import type { Shows } from "@/schemas/shows";
import { channelFromDoc, createMissingChannel } from "./channels";
import { upsertEpisodesForShow } from "./episodes";
import { type ReadPaginatedProps, readPaginated } from "./utils";

// TRANSFORMS ------------------------------------------------------------------------------------------------------------------------------
export const showFromDoc = E.fn(function* (doc: Shows["Doc"]) {
  const db = yield* DatabaseReader;
  const channelDoc = O.flatten(yield* optionMapEffect(doc.channelId, (id) => db.get("channels", id)));
  const channel = yield* optionMapEffect(channelDoc, channelFromDoc);
  return { ...doc, channel };
});

// CREATE ----------------------------------------------------------------------------------------------------------------------------------
export const createShows = E.fn(function* (creates: Shows["Create"][], channelIdsByApiId: H.HashMap<number, Id<"channels">>) {
  const db = yield* DatabaseWriter;
  return yield* E.forEach(
    creates,
    E.fn(function* ({ channel, ...create }) {
      const channelId = O.andThen(channel, ({ apiId }) => H.get(channelIdsByApiId, apiId));
      return [create.apiId, yield* db.insert("shows", { ...create, channelId })] as const;
    })
  ).pipe(E.map(H.fromIterable));
});

// READ ------------------------------------------------------------------------------------------------------------------------------------
export const isMissingOrStaleShow = E.fn(function* (revision: Shows["Revision"]) {
  const show = yield* readShowByApiId(revision.apiId);
  return O.isNone(show) || show.value.updated < revision.updated;
});

export const readMaxApiIdShow = E.fn(function* () {
  const db = yield* DatabaseReader;
  return yield* db.query("shows").withIndex("by_api").order("desc").first();
});

export const readShowByApiId = E.fn(function* (apiId: number) {
  const db = yield* DatabaseReader;
  return yield* db
    .query("shows")
    .withIndex("by_api", (q) => q.eq("apiId", apiId))
    .first();
});

export const readPaginatedShows = <K extends Value, N extends Value | undefined>(
  props: Pick<ReadPaginatedProps<"shows", K, N>, "aggregate" | "opts">
) =>
  E.fn(function* (pagination: Pagination) {
    const { page, total } = yield* readPaginated({ ...props, ...pagination, table: "shows" });
    return { items: yield* E.all(page.map(showFromDoc)), total };
  });

// UPSERT ----------------------------------------------------------------------------------------------------------------------------------
export const upsertShow = E.fn(function* ({ channel, ...showCreate }: Shows["Create"] | Shows["WithEpisodesCreate"]) {
  const db = yield* DatabaseWriter;
  const existing = yield* readShowByApiId(showCreate.apiId);
  const channelId = yield* optionMapEffect(channel, createMissingChannel);
  const nextTrackEpisodes = showCreate.trackEpisodes === true;

  if (O.isNone(existing)) {
    const showId = yield* db.insert("shows", { ...showCreate, channelId, trackEpisodes: nextTrackEpisodes });
    if ("episodes" in showCreate && nextTrackEpisodes) {
      yield* upsertEpisodesForShow({ creates: [...showCreate.episodes], show: { _id: showId, preference: showCreate.preference } });
    }
    return showId;
  }

  const { _id, preference, trackEpisodes } = existing.value;
  const shouldTrackEpisodes = trackEpisodes === true || nextTrackEpisodes;

  yield* db.patch("shows", _id, { ...showCreate, channelId, preference, trackEpisodes: shouldTrackEpisodes });
  if ("episodes" in showCreate && shouldTrackEpisodes) {
    yield* upsertEpisodesForShow({ creates: [...showCreate.episodes], show: { _id, preference } });
  }
  return _id;
});
