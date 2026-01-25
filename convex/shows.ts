import type { NotUniqueError } from "@rjdellecese/confect/server";
import { Effect as E, Option as O, Schema as S } from "effect";
import type { NoSuchElementException } from "effect/Cause";
import type { ParseError } from "effect/ParseResult";
import { readEpisodesByShow } from "@/functions/episodes";
import { startFetcher } from "@/functions/fetcher";
import {
  createMissingChannelsBatch,
  createMissingCountriesBatch,
  deduplicateChannels,
  deduplicateCountries,
  fetchMissingShowsPerPage,
  mapShowToFields,
  readMaxApiIdShow,
  sFetchMissingShowsPerPageArgs,
  sFetchMissingShowsPerPageReturns,
  showFromDoc,
} from "@/functions/shows";
import { sPaginationArgs, sPaginationReturns } from "@/schemas/convex";
import { sShow, sShowCreate, sShowRef } from "@/schemas/shows";
import { TvMaze } from "@/services/tvmaze";
import { api } from "./_generated/api";
import { action, MutationCtx, mutation, QueryCtx, query } from "./confect";

// QUERIES ---------------------------------------------------------------------------------------------------------------------------------
export const readManyFavorites = query({
  args: S.Struct({ limit: S.optional(S.NonNegativeInt) }),
  returns: S.Array(sShow),
  handler: ({ limit = 10 }) =>
    E.gen(function* () {
      const { db } = yield* QueryCtx;
      const docs = yield* db
        .query("shows")
        .withIndex("by_preference_and_name", (q) => q.eq("preference", "favorite"))
        .order("asc")
        .take(limit);
      return yield* E.all(docs.map(showFromDoc(db)));
    }),
});

export const readManyTopRated = query({
  args: S.Struct({ limit: S.optional(S.NonNegativeInt) }),
  returns: S.Array(sShow),
  handler: ({ limit = 10 }) =>
    E.gen(function* () {
      const { db } = yield* QueryCtx;
      const docs = yield* db.query("shows").withIndex("by_rating").order("desc").take(limit);
      return yield* E.all(docs.map(showFromDoc(db)));
    }),
});

export const readPaginatedTopRatedUnset = query({
  args: sPaginationArgs,
  returns: sPaginationReturns(sShow),
  handler: ({ paginationOpts }) =>
    E.gen(function* () {
      const { db } = yield* QueryCtx;
      const pagination = yield* db
        .query("shows")
        .withIndex("by_preference_and_rating", (q) => q.eq("preference", "unset"))
        .order("desc")
        .paginate(paginationOpts);
      return { ...pagination, page: yield* E.all(pagination.page.map(showFromDoc(db))) };
    }),
});

export const readManyTrending = query({
  args: S.Struct({ limit: S.optional(S.NonNegativeInt) }),
  returns: S.Array(sShow),
  handler: ({ limit = 10 }) =>
    E.gen(function* () {
      const { db } = yield* QueryCtx;
      const docs = yield* db.query("shows").withIndex("by_weight").order("desc").take(limit);
      return yield* E.all(docs.map(showFromDoc(db)));
    }),
});

export const readPaginatedTrendingUnset = query({
  args: sPaginationArgs,
  returns: sPaginationReturns(sShow),
  handler: ({ paginationOpts }) =>
    E.gen(function* () {
      const { db } = yield* QueryCtx;
      const pagination = yield* db
        .query("shows")
        .withIndex("by_preference_and_weight", (q) => q.eq("preference", "unset"))
        .order("desc")
        .paginate(paginationOpts);
      return { ...pagination, page: yield* E.all(pagination.page.map(showFromDoc(db))) };
    }),
});

export const readById = query({
  args: sShowRef,
  returns: sShow,
  handler: ({ _id }) =>
    E.gen(function* () {
      const { db } = yield* QueryCtx;
      const doc = (yield* db.get(_id)).pipe(O.getOrThrow);
      return yield* showFromDoc(db)(doc);
    }),
});

export const searchByName = query({
  args: S.Struct({
    search: S.String,
  }),
  returns: S.Array(sShow),
  handler: ({ search }) =>
    E.gen(function* () {
      const { db } = yield* QueryCtx;
      const docs = yield* db
        .query("shows")
        .withSearchIndex("search_name", (q) => q.search("name", search))
        .take(10);
      return yield* E.all(docs.map(showFromDoc(db)));
    }),
});

// MUTATION --------------------------------------------------------------------------------------------------------------------------------
export const createManyMissing = mutation({
  args: S.Struct({ dtos: S.mutable(S.Array(sShowCreate)) }),
  returns: S.Number,
  handler: ({ dtos }) =>
    E.gen(function* () {
      const { db } = yield* MutationCtx;
      const maxApiIdShow = yield* readMaxApiIdShow(db)();
      const newShows = dtos.filter((dto) => O.isNone(maxApiIdShow) || dto.apiId > maxApiIdShow.value.apiId);
      if (newShows.length === 0) return 0;
      const uniqueCountries = deduplicateCountries(newShows);
      const countryIdMap = yield* createMissingCountriesBatch(db)(uniqueCountries);
      const uniqueChannels = deduplicateChannels(newShows, countryIdMap);
      const channelIdMap = yield* createMissingChannelsBatch(db)(uniqueChannels);
      let createdCount = 0;
      for (const dto of newShows) {
        yield* db.insert("shows", mapShowToFields(dto, channelIdMap));
        createdCount++;
      }
      return createdCount;
    }),
});

export const fetchManyMissing = mutation({
  args: S.Struct({}),
  returns: S.Null,
  handler: (): E.Effect<null, NoSuchElementException | NotUniqueError | ParseError, MutationCtx> =>
    E.gen(function* () {
      const { db, scheduler } = yield* MutationCtx;
      const page = yield* startFetcher(db)();
      yield* scheduler.runAfter(0, api.shows.fetchManyMissingPerPage, { page });
      return null;
    }),
});

export const setPreference = mutation({
  args: S.Struct({ ...sShowRef.fields, preference: S.Literal("favorite", "ignored", "unset") }),
  returns: S.Null,
  handler: ({ _id, preference }): E.Effect<null, NoSuchElementException | ParseError, MutationCtx> =>
    E.gen(function* () {
      const { db, scheduler } = yield* MutationCtx;

      yield* db.patch(_id, { preference });

      const episodes = yield* readEpisodesByShow(db)({ _id });
      for (const episode of episodes) yield* db.patch(episode._id, { preference });

      if (preference === "favorite") {
        const { apiId } = (yield* db.get(_id)).pipe(O.getOrThrow);
        yield* scheduler.runAfter(0, api.episodes.fetchForShow, { _id, apiId });
      }
      return null;
    }),
});

// ACTIONS ---------------------------------------------------------------------------------------------------------------------------------
export const fetchManyMissingPerPage = action({
  args: sFetchMissingShowsPerPageArgs,
  returns: sFetchMissingShowsPerPageReturns,
  handler: (args) => fetchMissingShowsPerPage(args).pipe(E.provide(TvMaze.Default)),
});
