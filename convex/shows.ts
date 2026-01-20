import type { NotUniqueError } from "@rjdellecese/confect/server";
import { Effect as E, Option as O, Schema as S } from "effect";
import type { NoSuchElementException } from "effect/Cause";
import type { ParseError } from "effect/ParseResult";
import { startFetcher } from "@/functions/fetcher";
import {
  createMissingShow,
  createShow,
  fetchMissingShowsPerPage,
  readMaxApiIdShow,
  sFetchMissingShowsPerPageArgs,
  sFetchMissingShowsPerPageReturns,
  showFromDoc,
} from "@/functions/shows";
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

export const readManyTopRatedUnset = query({
  args: S.Struct({ limit: S.optional(S.NonNegativeInt) }),
  returns: S.Array(sShow),
  handler: ({ limit = 10 }) =>
    E.gen(function* () {
      const { db } = yield* QueryCtx;
      const docs = yield* db
        .query("shows")
        .withIndex("by_preference_and_rating", (q) => q.eq("preference", "unset"))
        .order("desc")
        .take(limit);
      return yield* E.all(docs.map(showFromDoc(db)));
    }),
});

export const readManyTopRatedUnsetPaginated = query({
  args: S.Struct({
    paginationOpts: S.Struct({
      numItems: S.NonNegativeInt,
      cursor: S.Union(S.Null, S.String),
    }),
  }),
  returns: S.Struct({
    page: S.Array(sShow),
    continueCursor: S.Union(S.Null, S.String),
    isDone: S.Boolean,
  }),
  handler: ({ paginationOpts }) =>
    E.gen(function* () {
      const { db } = yield* QueryCtx;
      const results = yield* db
        .query("shows")
        .withIndex("by_preference_and_rating", (q) => q.eq("preference", "unset"))
        .order("desc")
        .paginate(paginationOpts);
      const page = yield* E.all(results.page.map(showFromDoc(db)));
      return {
        page,
        continueCursor: results.continueCursor,
        isDone: results.isDone,
      };
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

export const readManyTrendingUnset = query({
  args: S.Struct({ limit: S.optional(S.NonNegativeInt) }),
  returns: S.Array(sShow),
  handler: ({ limit = 10 }) =>
    E.gen(function* () {
      const { db } = yield* QueryCtx;
      const docs = yield* db
        .query("shows")
        .withIndex("by_preference_and_weight", (q) => q.eq("preference", "unset"))
        .order("desc")
        .take(limit);
      return yield* E.all(docs.map(showFromDoc(db)));
    }),
});

export const readManyTrendingUnsetPaginated = query({
  args: S.Struct({
    paginationOpts: S.Struct({
      numItems: S.NonNegativeInt,
      cursor: S.Union(S.Null, S.String),
    }),
  }),
  returns: S.Struct({
    page: S.Array(sShow),
    continueCursor: S.Union(S.Null, S.String),
    isDone: S.Boolean,
  }),
  handler: ({ paginationOpts }) =>
    E.gen(function* () {
      const { db } = yield* QueryCtx;
      const results = yield* db
        .query("shows")
        .withIndex("by_preference_and_weight", (q) => q.eq("preference", "unset"))
        .order("desc")
        .paginate(paginationOpts);
      const page = yield* E.all(results.page.map(showFromDoc(db)));
      return {
        page,
        continueCursor: results.continueCursor,
        isDone: results.isDone,
      };
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

// MUTATION --------------------------------------------------------------------------------------------------------------------------------
export const createManyMissing = mutation({
  args: S.Struct({ dtos: S.mutable(S.Array(sShowCreate)) }),
  returns: S.Number,
  handler: ({ dtos }) =>
    E.gen(function* () {
      const { db } = yield* MutationCtx;
      const maxApiIdShow = yield* readMaxApiIdShow(db)();
      let createdCount = 0;
      for (const dto of dtos) {
        if (O.isSome(maxApiIdShow) && dto.apiId <= maxApiIdShow.value.apiId) continue;
        yield* createShow(db)(dto);
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
      const { apiId } = (yield* db.get(_id)).pipe(O.getOrThrow);
      yield* db.patch(_id, { preference });
      if (preference === "favorite") yield* scheduler.runAfter(0, api.episodes.fetchForShow, { _id, apiId });
      return null;
    }),
});

// ACTIONS ---------------------------------------------------------------------------------------------------------------------------------
export const fetchManyMissingPerPage = action({
  args: sFetchMissingShowsPerPageArgs,
  returns: sFetchMissingShowsPerPageReturns,
  handler: (args) => fetchMissingShowsPerPage(args).pipe(E.provide(TvMaze.Default)),
});
