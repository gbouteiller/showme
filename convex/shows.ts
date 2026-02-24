import { TableAggregate } from "@convex-dev/aggregate";
import { Migrations } from "@convex-dev/migrations";
import type { HttpClientError } from "@effect/platform/HttpClientError";
import { getYear } from "date-fns";
import { Effect as E, HashMap as H, Option as O, Schema as S } from "effect";
import type { ParseError } from "effect/ParseResult";
import { createMissingChannels, getDistinctChannels } from "@/functions/channels";
import { createMissingCountries, getDistinctCountries } from "@/functions/countries";
import { readEpisodesByShow } from "@/functions/episodes";
import { startFetcher } from "@/functions/fetcher";
import { createShows, readMaxApiIdShow, readPaginatedShows, showFromDoc } from "@/functions/shows";
import { sShow, sShowCreate, sShowRef } from "@/schemas/shows";
import { TvMaze } from "@/services/tvmaze";
import { api, components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { action, query } from "./_generated/server";
import { actionHandler, mutationHandler, queryHandler } from "./effex";
import type { DocNotFoundInTable } from "./effex/errors";
import { ActionCtx, type ActionCtxDeps } from "./effex/services/ActionCtx";
import { DatabaseReader } from "./effex/services/DatabaseReader";
import { MutationCtx, type MutationCtxDeps } from "./effex/services/MutationCtx";
import { Scheduler } from "./effex/services/Scheduler";
import { optionMapEffect, sPaginated, sPaginationWith } from "./effex/utils";
import { mutation, triggers } from "./triggers";

// AGGREGATES ------------------------------------------------------------------------------------------------------------------------------
export const favoriteShows = new TableAggregate<AggregateShowsParams<boolean, string>>(components.favoriteShows, {
  namespace: ({ preference }) => {
    if (preference === "favorite") return true;
  },
  sortKey: ({ name }) => name,
});
triggers.register("shows", favoriteShows.trigger());

export const topRatedShows = new TableAggregate<AggregateShowsParams<boolean, number>>(components.topRatedShows, {
  namespace: ({ premiered, rating }) => {
    if (rating > 0 && !!premiered) return true;
  },
  sortKey: ({ rating }) => -rating,
});
triggers.register("shows", topRatedShows.trigger());

export const topRatedShowsByYear = new TableAggregate<AggregateShowsParams<number, number>>(components.topRatedShowsByYear, {
  namespace: ({ premiered, rating }) => {
    if (rating > 0 && !!premiered) return getYear(premiered);
  },
  sortKey: ({ rating }) => -rating,
});
triggers.register("shows", topRatedShowsByYear.trigger());

export const topRatedUnsetShows = new TableAggregate<AggregateShowsParams<boolean, number>>(components.topRatedUnsetShows, {
  namespace: ({ preference, premiered, rating }) => {
    if (rating > 0 && !!premiered && preference === "unset") return true;
  },
  sortKey: ({ rating }) => -rating,
});
triggers.register("shows", topRatedUnsetShows.trigger());

export const topRatedUnsetShowsByYear = new TableAggregate<AggregateShowsParams<number, number>>(components.topRatedUnsetShowsByYear, {
  namespace: ({ preference, premiered, rating }) => {
    if (rating > 0 && !!premiered && preference === "unset") return getYear(premiered);
  },
  sortKey: ({ rating }) => -rating,
});
triggers.register("shows", topRatedUnsetShowsByYear.trigger());

export const trendingShows = new TableAggregate<AggregateShowsParams<boolean, [number, number]>>(components.trendingShows, {
  namespace: ({ premiered, rating }) => {
    if (rating > 0 && !!premiered) return true;
  },
  sortKey: ({ rating, weight }) => [-weight, -rating],
});
triggers.register("shows", trendingShows.trigger());

export const trendingShowsByYear = new TableAggregate<AggregateShowsParams<number, [number, number]>>(components.trendingShowsByYear, {
  namespace: ({ premiered, rating }) => {
    if (rating > 0 && !!premiered) return getYear(premiered);
  },
  sortKey: ({ rating, weight }) => [-weight, -rating],
});
triggers.register("shows", trendingShowsByYear.trigger());

export const trendingUnsetShows = new TableAggregate<AggregateShowsParams<boolean, [number, number]>>(components.trendingUnsetShows, {
  namespace: ({ preference, premiered, rating }) => {
    if (rating > 0 && !!premiered && preference === "unset") return true;
  },
  sortKey: ({ rating, weight }) => [-weight, -rating],
});
triggers.register("shows", trendingUnsetShows.trigger());

export const trendingUnsetShowsByYear = new TableAggregate<AggregateShowsParams<number, [number, number]>>(
  components.trendingUnsetShowsByYear,
  {
    namespace: ({ preference, premiered, rating }) => {
      if (rating > 0 && !!premiered && preference === "unset") return getYear(premiered);
    },
    sortKey: ({ rating, weight }) => [-weight, -rating],
  }
);
triggers.register("shows", trendingUnsetShowsByYear.trigger());

// MIGRATIONS ------------------------------------------------------------------------------------------------------------------------------
export const migrations = new Migrations<DataModel>(components.migrations);
export const run = migrations.runner();

export const backfillAggregatesMigration = migrations.define({
  table: "shows",
  migrateOne: async (ctx, doc) => {
    await favoriteShows.insertIfDoesNotExist(ctx, doc);
    // await trendingShows.insertIfDoesNotExist(ctx, doc);
    // await trendingShowsByYear.insertIfDoesNotExist(ctx, doc);
    // await trendingUnsetShows.insertIfDoesNotExist(ctx, doc);
    // await trendingUnsetShowsByYear.insertIfDoesNotExist(ctx, doc);
    // await topRatedShows.insertIfDoesNotExist(ctx, doc);
    // await topRatedShowsByYear.insertIfDoesNotExist(ctx, doc);
    // await topRatedUnsetShows.insertIfDoesNotExist(ctx, doc);
    // await topRatedUnsetShowsByYear.insertIfDoesNotExist(ctx, doc);
  },
});

export const runAggregateBackfill = migrations.runner(internal.shows.backfillAggregatesMigration);

// QUERIES ---------------------------------------------------------------------------------------------------------------------------------
export const readById = query(
  queryHandler({
    args: sShowRef,
    returns: S.OptionFromNullOr(sShow),
    handler: E.fn(function* ({ _id }) {
      const db = yield* DatabaseReader;
      return yield* optionMapEffect(yield* db.get("shows", _id), showFromDoc);
    }),
  })
);

export const readPaginatedFavorites = query(
  queryHandler({
    args: sPaginationWith({}),
    returns: sPaginated(sShow),
    handler: readPaginatedShows({ aggregate: favoriteShows, opts: { namespace: true } }),
  })
);

export const readPaginatedTopRated = query(
  queryHandler({
    args: sPaginationWith({ year: S.Union(S.NonNegativeInt, S.Literal(Number.POSITIVE_INFINITY)) }),
    returns: sPaginated(sShow),
    handler: ({ year, ...pageArgs }) =>
      Number.isFinite(year)
        ? readPaginatedShows({ aggregate: topRatedShowsByYear, opts: { namespace: year } })(pageArgs)
        : readPaginatedShows({ aggregate: topRatedShows, opts: { namespace: true } })(pageArgs),
  })
);

export const readPaginatedTopRatedUnset = query(
  queryHandler({
    args: sPaginationWith({ year: S.Union(S.NonNegativeInt, S.Literal(Number.POSITIVE_INFINITY)) }),
    returns: sPaginated(sShow),
    handler: ({ year, ...pageArgs }) =>
      Number.isFinite(year)
        ? readPaginatedShows({ aggregate: topRatedUnsetShowsByYear, opts: { namespace: year } })(pageArgs)
        : readPaginatedShows({ aggregate: topRatedUnsetShows, opts: { namespace: true } })(pageArgs),
  })
);

export const readPaginatedTrending = query(
  queryHandler({
    args: sPaginationWith({ year: S.Union(S.NonNegativeInt, S.Literal(Number.POSITIVE_INFINITY)) }),
    returns: sPaginated(sShow),
    handler: ({ year, ...pageArgs }) =>
      Number.isFinite(year)
        ? readPaginatedShows({ aggregate: trendingShowsByYear, opts: { namespace: year } })(pageArgs)
        : readPaginatedShows({ aggregate: trendingShows, opts: { namespace: true } })(pageArgs),
  })
);

export const readPaginatedTrendingUnset = query(
  queryHandler({
    args: sPaginationWith({ year: S.Union(S.NonNegativeInt, S.Literal(Number.POSITIVE_INFINITY)) }),
    returns: sPaginated(sShow),
    handler: ({ year, ...pageArgs }) =>
      Number.isFinite(year)
        ? readPaginatedShows({ aggregate: trendingUnsetShowsByYear, opts: { namespace: year } })(pageArgs)
        : readPaginatedShows({ aggregate: trendingUnsetShows, opts: { namespace: true } })(pageArgs),
  })
);

export const searchByName = query(
  queryHandler({
    args: S.Struct({ search: S.String }),
    returns: S.Array(sShow),
    handler: E.fn(function* ({ search }) {
      const db = yield* DatabaseReader;
      const docs = yield* db
        .query("shows")
        .withSearchIndex("search_name", (q) => q.search("name", search))
        .take(10);
      return yield* E.all(docs.map(showFromDoc));
    }),
  })
);

// MUTATIONS -------------------------------------------------------------------------------------------------------------------------------
export const createManyMissing = mutation(
  mutationHandler({
    args: S.Struct({ dtos: S.mutable(S.Array(sShowCreate)) }),
    returns: S.Number,
    handler: E.fn(function* ({ dtos }) {
      const maxApiIdShow = yield* readMaxApiIdShow();
      const newShows = dtos.filter((dto) => O.isNone(maxApiIdShow) || dto.apiId > maxApiIdShow.value.apiId);
      if (newShows.length === 0) return 0;
      const countryIdsByCode = yield* createMissingCountries(getDistinctCountries(newShows));
      const channelIdsByApiId = yield* createMissingChannels(getDistinctChannels(newShows), countryIdsByCode);
      return yield* createShows(newShows, channelIdsByApiId).pipe(E.map(H.size));
    }),
  })
);

export const fetchManyMissing = mutation(
  mutationHandler({
    args: S.Struct({}),
    returns: S.Null,
    handler: E.fn(function* (): E.fn.Return<null, ParseError | DocNotFoundInTable<"fetcher">, MutationCtxDeps> {
      const scheduler = yield* Scheduler;
      const page = yield* startFetcher();
      yield* scheduler.runAfter(0, api.shows.fetchManyMissingPerPage, { page });
      return null;
    }),
  })
);

export const setPreference = mutation(
  mutationHandler({
    args: S.Struct({ ...sShowRef.fields, preference: S.Literal("favorite", "ignored", "unset") }),
    returns: S.Null,
    handler: E.fn(function* ({ _id, preference }): E.fn.Return<null, ParseError, MutationCtxDeps> {
      const { db, scheduler } = yield* MutationCtx;

      yield* db.patch("shows", _id, { preference });

      const episodes = yield* readEpisodesByShow({ _id });
      for (const episode of episodes) yield* db.patch("episodes", episode._id, { preference });

      if (preference === "favorite") {
        const { apiId } = (yield* db.get("shows", _id)).pipe(O.getOrThrow);
        yield* scheduler.runAfter(0, api.episodes.fetchForShow, { _id, apiId });
      }
      return null;
    }),
  })
);

// ACTIONS ---------------------------------------------------------------------------------------------------------------------------------
export const fetchManyMissingPerPage = action(
  actionHandler({
    args: S.Struct({ page: S.NonNegativeInt }),
    returns: S.Null,
    handler: ({ page }): E.Effect<null, HttpClientError, ActionCtxDeps> =>
      E.gen(function* () {
        const { runMutation, scheduler } = yield* ActionCtx;
        const { fetchShows } = yield* TvMaze;
        const potentialMissingShows = yield* fetchShows(page);
        if (potentialMissingShows.length === 0) return yield* runMutation(api.fetcher.stop);
        const created = yield* runMutation(api.shows.createManyMissing, { dtos: potentialMissingShows });
        yield* runMutation(api.fetcher.update, { created, lastPage: page });
        yield* scheduler.runAfter(0, api.shows.fetchManyMissingPerPage, { page: page + 1 });
        return null;
      }).pipe(E.provide(TvMaze.Default)),
  })
);

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
type AggregateShowsParams<Namespace, Key> = {
  DataModel: DataModel;
  Key: Key;
  Namespace?: Namespace;
  TableName: "shows";
};
