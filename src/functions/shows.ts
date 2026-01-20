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
  return E.fn(function* (doc: Shows["Doc"]) {
    const channelDoc = O.flatten(yield* optionMapEffect(doc.channelId, (id) => db.get(id)));
    const channel = yield* optionMapEffect(channelDoc, channelFromDoc(db));
    return { ...doc, channel };
  });
}

// CREATE ----------------------------------------------------------------------------------------------------------------------------------
export function createMissingShow(db: MutationCtx["db"]) {
  return E.fn(function* (create: Shows["Create"]): E.fn.Return<{ _id: Id<"shows">; created: boolean }, ParseError> {
    const show = yield* readShowByApiId(db)(create);
    if (O.isSome(show)) return { _id: show.value._id, created: false };
    const _id = yield* createShow(db)(create);
    return { _id, created: true };
  });
}

export function createShow(db: MutationCtx["db"]) {
  return E.fn(function* ({ channel, ...rest }: Shows["Create"]): E.fn.Return<Id<"shows">, ParseError> {
    const channelId = yield* optionMapEffect(channel, createMissingChannel(db));
    return yield* db.insert("shows", { ...rest, channelId });
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

export function readMaxApiIdShow(db: Pick<QueryCtx["db"], "query">) {
  return (): E.Effect<O.Option<Shows["Doc"]>> => db.query("shows").withIndex("by_api").order("desc").first();
}
