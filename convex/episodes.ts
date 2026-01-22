import { formatISO } from "date-fns";
import { Effect as E, Option as O, Schema as S } from "effect";
import {
  episodeFromDoc,
  fetchShowEpisodes,
  readEpisodeByApiId,
  readEpisodesByShow,
  sFetchShowEpisodesArgs,
  sFetchShowEpisodesReturns,
} from "@/functions/episodes";
import { sId } from "@/schemas/convex";
import { sEpisode, sEpisodeCreate, sEpisodeRef } from "@/schemas/episodes";
import { sShowRef } from "@/schemas/shows";
import { TvMaze } from "@/services/tvmaze";
import type { Id } from "./_generated/dataModel";
import { action, MutationCtx, mutation, QueryCtx, query } from "./confect";

// QUERY -----------------------------------------------------------------------------------------------------------------------------------
export const readByShow = query({
  args: sShowRef,
  returns: S.Array(sEpisode),
  handler: ({ _id }) =>
    E.gen(function* () {
      const { db } = yield* QueryCtx;
      const docs = yield* readEpisodesByShow(db)({ _id });
      return yield* E.all(docs.map(episodeFromDoc(db)));
    }),
});

export const readManyUnwatched = query({
  args: S.Struct({ limit: S.optional(S.NonNegativeInt) }),
  returns: S.Array(sEpisode),
  handler: ({ limit = 10 }) =>
    E.gen(function* () {
      const { db } = yield* QueryCtx;

      const docs = yield* db
        .query("episodes")
        .withIndex("by_preference_and_unwatched", (q) =>
          q.eq("preference", "favorite").eq("isWatched", false).lt("airstamp", formatISO(Date.now()))
        )
        .order("desc")
        .take(limit);

      return yield* E.all(docs.map(episodeFromDoc(db)));
    }),
});

export const readManyUnwatchedPaginated = query({
  args: S.Struct({
    today: S.String,
    paginationOpts: S.Struct({
      numItems: S.NonNegativeInt,
      cursor: S.Union(S.Null, S.String),
    }),
  }),
  returns: S.Struct({
    page: S.Array(sEpisode),
    continueCursor: S.Union(S.Null, S.String),
    isDone: S.Boolean,
  }),
  handler: ({ paginationOpts, today }) =>
    E.gen(function* () {
      const { db } = yield* QueryCtx;
      const results = yield* db
        .query("episodes")
        .withIndex("by_preference_and_unwatched", (q) => q.eq("preference", "favorite").eq("isWatched", false).lt("airstamp", today))
        .order("desc")
        .paginate(paginationOpts);
      const page = yield* E.all(results.page.map(episodeFromDoc(db)));
      return {
        page,
        continueCursor: results.continueCursor,
        isDone: results.isDone,
      };
    }),
});

export const readManyUpcoming = query({
  args: S.Struct({ limit: S.optional(S.NonNegativeInt) }),
  returns: S.Array(sEpisode),
  handler: ({ limit = 10 }) =>
    E.gen(function* () {
      const { db } = yield* QueryCtx;

      const docs = yield* db
        .query("episodes")
        .withIndex("by_preference_and_unwatched", (q) =>
          q.eq("preference", "favorite").eq("isWatched", false).gt("airstamp", formatISO(Date.now()))
        )
        .take(limit);

      return yield* E.all(docs.map(episodeFromDoc(db)));
    }),
});

export const readManyUpcomingPaginated = query({
  args: S.Struct({
    today: S.String,
    paginationOpts: S.Struct({
      numItems: S.NonNegativeInt,
      cursor: S.Union(S.Null, S.String),
    }),
  }),
  returns: S.Struct({
    page: S.Array(sEpisode),
    continueCursor: S.Union(S.Null, S.String),
    isDone: S.Boolean,
  }),
  handler: ({ paginationOpts, today }) =>
    E.gen(function* () {
      const { db } = yield* QueryCtx;
      const results = yield* db
        .query("episodes")
        .withIndex("by_preference_and_unwatched", (q) => q.eq("preference", "favorite").eq("isWatched", false).gt("airstamp", today))
        .paginate(paginationOpts);
      const page = yield* E.all(results.page.map(episodeFromDoc(db)));
      return {
        page,
        continueCursor: results.continueCursor,
        isDone: results.isDone,
      };
    }),
});

// MUTATION --------------------------------------------------------------------------------------------------------------------------------
export const createManyMissingForShow = mutation({
  args: S.Struct({ showId: sId("shows"), dtos: S.Array(sEpisodeCreate) }),
  returns: S.Array(sId("episodes")),
  handler: ({ dtos, showId }) =>
    E.gen(function* () {
      const { db } = yield* MutationCtx;
      const { preference } = (yield* db.get(showId)).pipe(O.getOrThrow);
      const ids: Id<"episodes">[] = [];
      for (const dto of dtos)
        if ((yield* readEpisodeByApiId(db)({ apiId: dto.apiId })).pipe(O.isNone))
          ids.push(yield* db.insert("episodes", { ...dto, preference, showId }));
      return ids;
    }),
});

export const toggleWatched = mutation({
  args: sEpisodeRef,
  returns: S.Null,
  handler: ({ _id }) =>
    E.gen(function* () {
      const { db } = yield* MutationCtx;
      const { isWatched } = (yield* db.get(_id)).pipe(O.getOrThrow);
      yield* db.patch(_id, { isWatched: !isWatched });
      return null;
    }),
});

export const setSeasonWatched = mutation({
  args: S.Struct({
    showId: sId("shows"),
    season: S.Int,
    isWatched: S.Boolean,
  }),
  returns: S.Null,
  handler: ({ isWatched, season, showId }) =>
    E.gen(function* () {
      const { db } = yield* MutationCtx;
      const episodes = yield* db
        .query("episodes")
        .withIndex("by_show_and_season", (q) => q.eq("showId", showId).eq("season", season).lt("airstamp", formatISO(Date.now())))
        .collect();
      for (const episode of episodes) yield* db.patch(episode._id, { isWatched });
      return null;
    }),
});

export const setShowWatched = mutation({
  args: S.Struct({
    showId: sId("shows"),
    isWatched: S.Boolean,
  }),
  returns: S.Null,
  handler: ({ isWatched, showId }) =>
    E.gen(function* () {
      const { db } = yield* MutationCtx;
      const episodes = yield* db
        .query("episodes")
        .withIndex("by_show", (q) => q.eq("showId", showId).lt("airstamp", formatISO(Date.now())))
        .collect();
      for (const episode of episodes) yield* db.patch(episode._id, { isWatched });
      return null;
    }),
});

// ACTIONS ---------------------------------------------------------------------------------------------------------------------------------
export const fetchForShow = action({
  args: sFetchShowEpisodesArgs,
  returns: sFetchShowEpisodesReturns,
  handler: (show) => fetchShowEpisodes(show).pipe(E.provide(TvMaze.Default)),
});
