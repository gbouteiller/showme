import type { HttpClientError } from "@effect/platform/HttpClientError";
import { Effect as E, Option as O, Schema as S } from "effect";
import type { ParseError } from "effect/ParseResult";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ActionCtx, type MutationCtx, type QueryCtx } from "@/convex/confect";
import { optionMapEffect } from "@/lib/effect";
import type { Shows } from "@/schemas/shows";
import { TvMaze } from "@/services/tvmaze";
import { channelFromDoc, createMissingChannel } from "./channels";

// ACTIONS ---------------------------------------------------------------------------------------------------------------------------------
export const fetchMissingShowsPerPage = ({ page }: FetchMissingShowsPerPageArgs): FetchMissingShowsPerPage =>
  E.gen(function* () {
    const { runMutation, scheduler } = yield* ActionCtx;
    const { fetchShows } = yield* TvMaze;
    const potentialMissingShows = yield* fetchShows(page);
    if (potentialMissingShows.length === 0) return yield* runMutation(api.fetcher.stop);
    const created = yield* runMutation(api.shows.createManyMissing, { dtos: potentialMissingShows });
    yield* runMutation(api.fetcher.update, { created, lastPage: page });
    yield* scheduler.runAfter(0, api.shows.fetchManyMissingPerPage, { page: page + 1 });
    return null;
  });
export const sFetchMissingShowsPerPageArgs = S.Struct({ page: S.NonNegativeInt });
export const sFetchMissingShowsPerPageReturns = S.Null;
export type FetchMissingShowsPerPageArgs = typeof sFetchMissingShowsPerPageArgs.Type;
export type FetchMissingShowsPerPageReturns = typeof sFetchMissingShowsPerPageReturns.Type;
export type FetchMissingShowsPerPage = E.Effect<FetchMissingShowsPerPageReturns, HttpClientError, ActionCtx | TvMaze>;

// TRANSFORMS ------------------------------------------------------------------------------------------------------------------------------
export function showFromDoc(db: Pick<QueryCtx["db"], "get">) {
  return (doc: Shows["Doc"]): E.Effect<Shows["Entry"]> =>
    E.gen(function* () {
      const channelDoc = O.flatten(yield* optionMapEffect(doc.channelId, (id) => db.get(id)));
      const channel = yield* optionMapEffect(channelDoc, channelFromDoc(db));
      return { ...doc, channel };
    });
}

// CREATE ----------------------------------------------------------------------------------------------------------------------------------
export function createMissingShow(db: MutationCtx["db"]) {
  return ({ channel, ...rest }: Shows["Create"]): E.Effect<{ _id: Id<"shows">; created: boolean }, ParseError> =>
    E.gen(function* () {
      const show = yield* readShowByApiId(db)(rest);
      if (O.isSome(show)) return { _id: show.value._id, created: false };
      const channelId = yield* optionMapEffect(channel, createMissingChannel(db));
      const _id = yield* db.insert("shows", { ...rest, channelId });
      return { _id, created: true };
    });
}

// READ ------------------------------------------------------------------------------------------------------------------------------------
export function readShowByApiId(db: Pick<QueryCtx["db"], "query">) {
  return ({ apiId }: Shows["ApiRef"]): E.Effect<O.Option<Shows["Doc"]>> =>
    db
      .query("shows")
      .withIndex("by_api", (q) => q.eq("apiId", apiId))
      .first();
}
