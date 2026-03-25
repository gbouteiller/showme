import type { Value } from "convex/values";
import { Effect as E, HashMap as H, Option as O, Tuple } from "effect";
import { DatabaseReader } from "@/convex/effex/services/DatabaseReader";
import { DatabaseWriter } from "@/convex/effex/services/DatabaseWriter";
import { optionMapEffect, type Pagination } from "@/convex/effex/utils";
import type { Channels } from "@/schemas/channels";
import type { Shows } from "@/schemas/shows";
import { channelFromDoc, getOrCreateChannel, lookupChannelId } from "./channels";
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
export const getOrCreateShow = E.fn(function* ({ channel, ...create }: Shows["Create"], opts: GetOrCreateShowOpts = {}) {
  const db = yield* DatabaseWriter;
  if (opts.checkExisting) {
    const existing = yield* readShowByApiId(create.apiId);
    if (O.isSome(existing)) return existing.value._id;
  }
  const channelId = opts.channelIds ? lookupChannelId(channel, opts.channelIds) : yield* optionMapEffect(channel, getOrCreateChannel);
  return yield* db.insert("shows", { ...create, channelId, preference: "unset", trackEpisodes: false });
});
type GetOrCreateShowOpts = { channelIds?: Channels["Set"]; checkExisting?: boolean };

export const getOrCreateShows = (creates: Shows["Create"][], opts: GetOrCreateShowsOpts = {}) =>
  E.forEach(creates, (create) => getOrCreateShow(create, opts).pipe(E.map((id) => Tuple.make(create.apiId, id)))).pipe(
    E.map(H.fromIterable)
  );
type GetOrCreateShowsOpts = { channelIds?: Channels["Set"]; checkExisting?: boolean };

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
  const channelId = yield* optionMapEffect(channel, getOrCreateChannel);

  if (O.isNone(existing)) return yield* db.insert("shows", { ...showCreate, channelId, preference: "unset", trackEpisodes: false });

  const { _id, preference, trackEpisodes } = existing.value;

  yield* db.patch("shows", _id, { ...showCreate, channelId });

  if ("episodes" in showCreate && trackEpisodes)
    yield* upsertEpisodesForShow({ creates: [...showCreate.episodes], show: { _id, preference } });

  return _id;
});
