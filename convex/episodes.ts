import { TableAggregate } from "@convex-dev/aggregate";
import type { HttpClientError } from "@effect/platform/HttpClientError";
import { formatISO, parseISO } from "date-fns";
import { Effect as E, Option as O, Schema as S } from "effect";
import type { ParseError } from "effect/ParseResult";
import { episodeFromDoc, readEpisodeByApiId, readEpisodesByShow, readPaginatedEpisodes } from "@/functions/episodes";
import { type Episodes, sEpisode, sEpisodeCreate, sEpisodeRef } from "@/schemas/episodes";
import { sShowDoc, sShowRef } from "@/schemas/shows";
import { TvMaze } from "@/services/tvmaze";
import { api, components } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";
import { action, query } from "./_generated/server";
import { actionHandler, mutationHandler, queryHandler } from "./effex";
import { sId } from "./effex/schemas/genericId";
import { ActionCtx, type ActionCtxDeps } from "./effex/services/ActionCtx";
import { DatabaseWriter } from "./effex/services/DatabaseWriter";
import { MutationCtx } from "./effex/services/MutationCtx";
import { sPaginated, sPaginationWith } from "./effex/utils";
import { mutation, triggers } from "./triggers";

// AGGREGATES ------------------------------------------------------------------------------------------------------------------------------
export const unwatchedEpisodes = new TableAggregate<AggregateEpisodesParams>(components.unwatchedEpisodes, {
  namespace: ({ isWatched, preference }) => [preference, isWatched],
  sortKey: ({ airstamp }) => -parseISO(airstamp).getTime(),
});
triggers.register("episodes", unwatchedEpisodes.trigger());

export const upcomingEpisodes = new TableAggregate<AggregateEpisodesParams>(components.upcomingEpisodes, {
  namespace: ({ isWatched, preference }) => [preference, isWatched],
  sortKey: ({ airstamp }) => parseISO(airstamp).getTime(),
});
triggers.register("episodes", upcomingEpisodes.trigger());

// QUERIES ---------------------------------------------------------------------------------------------------------------------------------
export const readByShow = query(
  queryHandler({
    args: sShowRef,
    returns: S.Array(sEpisode),
    handler: E.fn(function* ({ _id }) {
      const docs = yield* readEpisodesByShow({ _id });
      return yield* E.all(docs.map(episodeFromDoc));
    }),
  })
);

export const readPaginatedUnwatched = query(
  queryHandler({
    args: sPaginationWith({ timestamp: S.NonNegativeInt }),
    returns: sPaginated(sEpisode),
    handler: ({ timestamp, ...pageArgs }) =>
      readPaginatedEpisodes({
        aggregate: unwatchedEpisodes,
        opts: { namespace: ["favorite", false], bounds: { lower: { inclusive: true, key: -timestamp } } },
      })(pageArgs),
  })
);

export const readPaginatedUpcoming = query(
  queryHandler({
    args: sPaginationWith({ timestamp: S.NonNegativeInt }),
    returns: sPaginated(sEpisode),
    handler: ({ timestamp, ...pageArgs }) =>
      readPaginatedEpisodes({
        aggregate: upcomingEpisodes,
        opts: { namespace: ["favorite", false], bounds: { lower: { inclusive: false, key: timestamp } } },
      })(pageArgs),
  })
);

// MUTATION --------------------------------------------------------------------------------------------------------------------------------
export const createManyMissingForShow = mutation(
  mutationHandler({
    args: S.Struct({ showId: sId("shows"), dtos: S.Array(sEpisodeCreate) }),
    returns: S.Array(sId("episodes")),
    handler: E.fn(function* ({ dtos, showId }) {
      const { db } = yield* MutationCtx;
      const { preference } = (yield* db.get("shows", showId)).pipe(O.getOrThrow);
      const ids: Id<"episodes">[] = [];
      for (const dto of dtos)
        if ((yield* readEpisodeByApiId({ apiId: dto.apiId })).pipe(O.isNone))
          ids.push(yield* db.insert("episodes", { ...dto, preference, showId }));
      return ids;
    }),
  })
);

export const setWatched = mutation(
  mutationHandler({
    args: S.Struct({ isWatched: S.Boolean, ...sEpisodeRef.fields }),
    returns: S.Null,
    handler: E.fn(function* ({ _id, isWatched }) {
      const db = yield* DatabaseWriter;
      yield* db.patch("episodes", _id, { isWatched });
      return null;
    }),
  })
);

export const setSeasonWatched = mutation(
  mutationHandler({
    args: S.Struct({ isWatched: S.Boolean, season: S.Int, showId: sId("shows") }),
    returns: S.Null,
    handler: E.fn(function* ({ isWatched, season, showId }) {
      const db = yield* DatabaseWriter;
      const episodes = yield* db
        .query("episodes")
        .withIndex("by_show_and_season", (q) => q.eq("showId", showId).eq("season", season).lt("airstamp", formatISO(Date.now())))
        .collect();
      for (const episode of episodes) yield* db.patch("episodes", episode._id, { isWatched });
      return null;
    }),
  })
);

export const setShowWatched = mutation(
  mutationHandler({
    args: S.Struct({ isWatched: S.Boolean, showId: sId("shows") }),
    returns: S.Null,
    handler: E.fn(function* ({ isWatched, showId }) {
      const db = yield* DatabaseWriter;
      const episodes = yield* db
        .query("episodes")
        .withIndex("by_show", (q) => q.eq("showId", showId).lt("airstamp", formatISO(Date.now())))
        .collect();
      for (const episode of episodes) yield* db.patch("episodes", episode._id, { isWatched });
      return null;
    }),
  })
);

// ACTIONS ---------------------------------------------------------------------------------------------------------------------------------
export const fetchForShow = action(
  actionHandler({
    args: sShowDoc.pick("_id", "apiId"),
    returns: S.Array(sId("episodes")),
    handler: ({ _id, apiId }): E.Effect<readonly Id<"episodes">[], HttpClientError | ParseError, ActionCtxDeps> =>
      E.gen(function* () {
        const { runMutation } = yield* ActionCtx;
        const { fetchShowEpisodes } = yield* TvMaze;
        const dtos = yield* fetchShowEpisodes(apiId);
        return yield* runMutation(api.episodes.createManyMissingForShow, { dtos, showId: _id });
      }).pipe(E.provide(TvMaze.Default)),
  })
);

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
type AggregateEpisodesParams = {
  DataModel: DataModel;
  Key: number;
  Namespace?: [Episodes["Entity"]["preference"], Episodes["Entity"]["isWatched"]];
  TableName: "episodes";
};
