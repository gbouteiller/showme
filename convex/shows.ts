import { TableAggregate } from "@convex-dev/aggregate";
import { Migrations } from "@convex-dev/migrations";
import type { HttpClientError } from "@effect/platform/HttpClientError";
import { getYear } from "date-fns";
import { Array as Arr, Effect as E, HashMap as H, Option as O, Schema as S } from "effect";
import type { ParseError } from "effect/ParseResult";
import { createMissingChannels, getDistinctChannels } from "@/functions/channels";
import { createMissingCountries, getDistinctCountries } from "@/functions/countries";
import { readEpisodesByShow } from "@/functions/episodes";
import { startFetcher } from "@/functions/fetcher";
import { createShows, isMissingOrStaleShow, readMaxApiIdShow, readPaginatedShows, showFromDoc, upsertShow } from "@/functions/shows";
import { sShowCreate, sShowWithEpisodesCreate } from "@/schemas/creates";
import { sShow, sShowRef, sShowRevision } from "@/schemas/shows";
import { TvMaze } from "@/services/tvmaze";
import { api, components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { action, query } from "./_generated/server";
import { actionHandler, mutationHandler, queryHandler } from "./effex";
import type { DocNotFoundInTable } from "./effex/errors";
import { FIELDS } from "./effex/fields";
import { sId } from "./effex/schemas/genericId";
import { ActionCtx, type ActionCtxDeps } from "./effex/services/ActionCtx";
import { DatabaseReader } from "./effex/services/DatabaseReader";
import { MutationCtx, type MutationCtxDeps } from "./effex/services/MutationCtx";
import { Scheduler } from "./effex/services/Scheduler";
import { optionMapEffect, sPaginated, sPaginationWith } from "./effex/utils";
import { mutation, triggers } from "./triggers";

const SHOW_UPDATE_BATCH_DELAY_MS = 10_000;
const SHOW_UPDATE_BATCH_SIZE = 100;

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

export const topRatedShowsByPreference = new TableAggregate<AggregateShowsParams<string, [number, string]>>(
  components.topRatedShowsByPreference,
  {
    namespace: ({ preference, premiered, rating }) => {
      if (rating > 0 && !!premiered && preference) return preference;
    },
    sortKey: ({ rating, name }) => [-rating, name],
  }
);
triggers.register("shows", topRatedShowsByPreference.trigger());

export const topRatedShowsByPreferenceAndYear = new TableAggregate<AggregateShowsParams<string, [number, string]>>(
  components.topRatedShowsByPreferenceAndYear,
  {
    namespace: ({ preference, premiered, rating }) => {
      if (rating > 0 && !!premiered && preference) return `${preference}-${getYear(premiered)}`;
    },
    sortKey: ({ rating, name }) => [-rating, name],
  }
);
triggers.register("shows", topRatedShowsByPreferenceAndYear.trigger());

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

export const trendingShowsByPreference = new TableAggregate<AggregateShowsParams<string, [number, number, string]>>(
  components.trendingShowsByPreference,
  {
    namespace: ({ preference, premiered, rating }) => {
      if (rating > 0 && !!premiered && preference) return preference;
    },
    sortKey: ({ rating, weight, name }) => [-weight, -rating, name],
  }
);
triggers.register("shows", trendingShowsByPreference.trigger());

export const trendingShowsByPreferenceAndYear = new TableAggregate<AggregateShowsParams<string, [number, number, string]>>(
  components.trendingShowsByPreferenceAndYear,
  {
    namespace: ({ preference, premiered, rating }) => {
      if (rating > 0 && !!premiered && preference) return `${preference}-${getYear(premiered)}`;
    },
    sortKey: ({ rating, weight, name }) => [-weight, -rating, name],
  }
);
triggers.register("shows", trendingShowsByPreferenceAndYear.trigger());

// MIGRATIONS ------------------------------------------------------------------------------------------------------------------------------
export const migrations = new Migrations<DataModel>(components.migrations);
export const run = migrations.runner();

export const backfillAggregatesMigration = migrations.define({
  table: "shows",
  migrateOne: async (ctx, doc) => {
    // await favoriteShows.insertIfDoesNotExist(ctx, doc);
    // await trendingShows.insertIfDoesNotExist(ctx, doc);
    // await trendingShowsByYear.insertIfDoesNotExist(ctx, doc);
    // await topRatedShows.insertIfDoesNotExist(ctx, doc);
    // await topRatedShowsByYear.insertIfDoesNotExist(ctx, doc);
    // await topRatedShowsByPreference.insertIfDoesNotExist(ctx, doc);
    // await topRatedShowsByPreferenceAndYear.insertIfDoesNotExist(ctx, doc);
    await trendingShowsByPreference.insertIfDoesNotExist(ctx, doc);
    await trendingShowsByPreferenceAndYear.insertIfDoesNotExist(ctx, doc);
  },
});

export const runAggregateBackfill = migrations.runner(internal.shows.backfillAggregatesMigration);

// QUERIES ---------------------------------------------------------------------------------------------------------------------------------
export const filterRevisionsToRefresh = query(
  queryHandler({
    args: S.Struct({ revisions: S.Array(sShowRevision) }),
    returns: S.Array(sShowRevision),
    handler: ({ revisions }) => E.filter(revisions, isMissingOrStaleShow),
  })
);

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
    handler: (pageArgs) => readPaginatedShows({ aggregate: favoriteShows, opts: { namespace: true } })(pageArgs),
  })
);

export const readPaginatedTopRated = query(
  queryHandler({
    args: sPaginationWith({ preference: S.optional(FIELDS.shows.preference), year: S.optional(S.NonNegativeInt) }),
    returns: sPaginated(sShow),
    handler: ({ preference, year, ...pageArgs }) => {
      if (preference && year)
        return readPaginatedShows({ aggregate: topRatedShowsByPreferenceAndYear, opts: { namespace: `${preference}-${year}` } })(pageArgs);
      if (preference) return readPaginatedShows({ aggregate: topRatedShowsByPreference, opts: { namespace: preference } })(pageArgs);
      if (year) return readPaginatedShows({ aggregate: topRatedShowsByYear, opts: { namespace: year } })(pageArgs);
      return readPaginatedShows({ aggregate: topRatedShows, opts: { namespace: true } })(pageArgs);
    },
  })
);

export const readPaginatedTopRatedUnset = query(
  queryHandler({
    args: sPaginationWith({ year: S.optional(S.NonNegativeInt) }),
    returns: sPaginated(sShow),
    handler: ({ year, ...pageArgs }) =>
      year !== undefined
        ? readPaginatedShows({ aggregate: topRatedShowsByPreferenceAndYear, opts: { namespace: `unset-${year}` } })(pageArgs)
        : readPaginatedShows({ aggregate: topRatedShowsByPreference, opts: { namespace: "unset" } })(pageArgs),
  })
);

export const readPaginatedTrending = query(
  queryHandler({
    args: sPaginationWith({ preference: S.optional(FIELDS.shows.preference), year: S.optional(S.NonNegativeInt) }),
    returns: sPaginated(sShow),
    handler: ({ preference, year, ...pageArgs }) => {
      if (preference && year)
        return readPaginatedShows({ aggregate: trendingShowsByPreferenceAndYear, opts: { namespace: `${preference}-${year}` } })(pageArgs);
      if (preference) return readPaginatedShows({ aggregate: trendingShowsByPreference, opts: { namespace: preference } })(pageArgs);
      if (year) return readPaginatedShows({ aggregate: trendingShowsByYear, opts: { namespace: year } })(pageArgs);
      return readPaginatedShows({ aggregate: trendingShows, opts: { namespace: true } })(pageArgs);
    },
  })
);

export const readPaginatedTrendingUnset = query(
  queryHandler({
    args: sPaginationWith({ year: S.optional(S.NonNegativeInt) }),
    returns: sPaginated(sShow),
    handler: ({ year, ...pageArgs }) =>
      year !== undefined
        ? readPaginatedShows({ aggregate: trendingShowsByPreferenceAndYear, opts: { namespace: `unset-${year}` } })(pageArgs)
        : readPaginatedShows({ aggregate: trendingShowsByPreference, opts: { namespace: "unset" } })(pageArgs),
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

      const episodes = yield* readEpisodesByShow(_id);
      for (const episode of episodes) yield* db.patch("episodes", episode._id, { preference });

      if (preference === "favorite") {
        const { apiId } = (yield* db.get("shows", _id)).pipe(O.getOrThrow);
        yield* scheduler.runAfter(0, api.episodes.fetchForShow, { _id, apiId });
      }
      return null;
    }),
  })
);

export const upsert = mutation(
  mutationHandler({
    args: S.Struct({ dto: sShowWithEpisodesCreate }),
    returns: sId("shows"),
    handler: ({ dto }) => upsertShow(dto),
  })
);

// ACTIONS ---------------------------------------------------------------------------------------------------------------------------------
export const fetchManyMissingPerPage = action(
  actionHandler({
    args: S.Struct({ page: S.NonNegativeInt }),
    returns: S.Null,
    handler: ({ page }): E.Effect<null, HttpClientError | ParseError, ActionCtxDeps> =>
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

export const refreshMany = action(
  actionHandler({
    args: S.Struct({ revisions: S.Array(sShowRevision) }),
    returns: S.Null,
    handler: ({ revisions }): E.Effect<null, HttpClientError | ParseError, ActionCtxDeps> =>
      E.gen(function* () {
        if (revisions.length === 0) return null;
        const { runMutation, runQuery } = yield* ActionCtx;
        const revisionsToRefresh = yield* runQuery(api.shows.filterRevisionsToRefresh, { revisions });
        if (revisionsToRefresh.length === 0) return null;
        const { fetchShowWithEpisodes } = yield* TvMaze;
        for (const { apiId } of revisionsToRefresh) {
          const dto = yield* fetchShowWithEpisodes(apiId);
          yield* runMutation(api.shows.upsert, { dto });
        }
        return null;
      }).pipe(E.provide(TvMaze.Default)),
  })
);

export const refreshAllDaily = action(
  actionHandler({
    args: S.Struct({}),
    returns: S.Null,
    handler: (): E.Effect<null, HttpClientError, ActionCtxDeps> =>
      E.gen(function* () {
        const { scheduler } = yield* ActionCtx;
        const { fetchDailyShowRevisions } = yield* TvMaze;
        const revisions = yield* fetchDailyShowRevisions();
        const batches = Arr.chunksOf(revisions, SHOW_UPDATE_BATCH_SIZE);
        for (const [index, batch] of batches.entries())
          yield* scheduler.runAfter(index * SHOW_UPDATE_BATCH_DELAY_MS, api.shows.refreshMany, { revisions: [...batch] });
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
