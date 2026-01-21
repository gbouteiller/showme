import type { HttpClientError } from "@effect/platform/HttpClientError";
import { Effect as E, Option as O, Schema as S } from "effect";
import type { ParseError } from "effect/ParseResult";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ActionCtx, type MutationCtx, type QueryCtx } from "@/convex/confect";
import { optionMapEffect } from "@/lib/effect";
import type { sChannelFields } from "@/schemas/channels";
import type { sCountryCreate } from "@/schemas/countries";
import type { Shows } from "@/schemas/shows";
import { TvMaze } from "@/services/tvmaze";
import { channelFromDoc, createMissingChannel } from "./channels";

type ChannelCreatePayload = typeof sChannelFields.Type;

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

// BATCH CREATION HELPERS ---------------------------------------------------------------------------------------------------------------------
export function deduplicateCountries(dtos: Shows["Create"][]): Map<string, typeof sCountryCreate.Type> {
  const countries = new Map<string, typeof sCountryCreate.Type>();
  for (const dto of dtos) {
    if (O.isSome(dto.channel) && O.isSome(dto.channel.value.country)) {
      const country = dto.channel.value.country.value;
      const key = `${country.code}`;
      if (!countries.has(key)) {
        countries.set(key, country);
      }
    }
  }
  return countries;
}

export function deduplicateChannels(
  dtos: Shows["Create"][],
  countryIdMap: Map<string, Id<"countries">>
): Map<number, ChannelCreatePayload> {
  const channels = new Map<number, ChannelCreatePayload>();
  for (const dto of dtos) {
    const channelOpt = dto.channel;
    if (O.isSome(channelOpt)) {
      const channel = channelOpt.value;
      const channelWithCountry = channel as {
        apiId: number;
        name: string;
        officialSite: O.Option<string>;
        country: O.Option<{ code: string; name: string; timezone: string }>;
      };
      const key = channelWithCountry.apiId;
      if (!channels.has(key)) {
        const countryOpt = channelWithCountry.country;
        const countryId = O.isSome(countryOpt) ? countryIdMap.get(countryOpt.value.code) : undefined;
        const channelPayload: ChannelCreatePayload = {
          apiId: channelWithCountry.apiId,
          name: channelWithCountry.name,
          officialSite: channelWithCountry.officialSite,
          countryId: countryId !== undefined ? O.some(countryId) : O.none(),
        };
        channels.set(key, channelPayload);
      }
    }
  }
  return channels;
}

export function mapShowToFields(dto: Shows["Create"], channelIdMap: Map<number, Id<"channels">>): Shows["Fields"] {
  const channelId = O.isSome(dto.channel) ? channelIdMap.get(dto.channel.value.apiId) : undefined;
  const showFields: Shows["Fields"] = {
    apiId: dto.apiId,
    ended: dto.ended,
    genres: dto.genres,
    image: dto.image,
    name: dto.name,
    officialSite: dto.officialSite,
    premiered: dto.premiered,
    preference: dto.preference,
    rating: dto.rating,
    status: dto.status,
    summary: dto.summary,
    thumbnail: dto.thumbnail,
    updated: dto.updated,
    weight: dto.weight,
    channelId: channelId !== undefined ? O.some(channelId) : O.none(),
  };
  return showFields;
}

export function createMissingCountriesBatch(db: MutationCtx["db"]) {
  return (countries: Map<string, typeof sCountryCreate.Type>): E.Effect<Map<string, Id<"countries">>, ParseError> =>
    E.gen(function* () {
      const result = new Map<string, Id<"countries">>();
      for (const [code, country] of countries) {
        const existing = yield* db
          .query("countries")
          .withIndex("by_code", (q) => q.eq("code", code))
          .first();
        if (O.isSome(existing)) {
          result.set(code, existing.value._id);
        } else {
          const _id = yield* db.insert("countries", country);
          result.set(code, _id);
        }
      }
      return result;
    });
}

export function createMissingChannelsBatch(db: MutationCtx["db"]) {
  return (channels: Map<number, ChannelCreatePayload>): E.Effect<Map<number, Id<"channels">>, ParseError> =>
    E.gen(function* () {
      const result = new Map<number, Id<"channels">>();
      for (const [apiId, channel] of channels) {
        const existing = yield* db
          .query("channels")
          .withIndex("by_api", (q) => q.eq("apiId", apiId))
          .first();
        if (O.isSome(existing)) {
          result.set(apiId, existing.value._id);
        } else {
          const _id = yield* db.insert("channels", channel);
          result.set(apiId, _id);
        }
      }
      return result;
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
