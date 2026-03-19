import { ParseResult, Schema as S } from "effect";
import { sApiChannelDto, sApiCountryDto, sApiEpisodeDto, sApiPersonDto, sApiShowDto } from "./api";
import { sChannelFields } from "./channels";
import { sEpisodeFields } from "./episodes";
import { sShowFields } from "./shows";

// CHANNELS --------------------------------------------------------------------------------------------------------------------------------
export const sChannelDto = S.transformOrFail(
  sApiChannelDto,
  S.Struct({
    ...sApiChannelDto.omit("id").fields,
    ...sChannelFields.pick("apiId").fields,
  }),
  {
    strict: true,
    decode: ({ id: apiId, ...rest }) => ParseResult.succeed({ ...rest, apiId }),
    encode: (create, _, ast) => ParseResult.fail(new ParseResult.Forbidden(ast, create, "Forbidden.")),
  }
);

// COUNTRIES -------------------------------------------------------------------------------------------------------------------------------
export const sCountryDto = sApiCountryDto.pick("code", "name", "timezone");

// EPISODES --------------------------------------------------------------------------------------------------------------------------------
export const sEpisodeDto = S.transformOrFail(
  sApiEpisodeDto.omit("_links", "type", "url"),
  S.Struct({
    ...sApiEpisodeDto.pick("airdate", "airstamp", "airtime", "name", "number", "runtime", "season", "summary").fields,
    ...sEpisodeFields.pick("apiId", "isWatched").fields,
    image: S.NullOr(S.String),
    rating: S.NullOr(S.NonNegative),
    thumbnail: S.NullOr(S.String),
  }),
  {
    strict: true,
    decode: ({ id: apiId, image, rating, ...rest }) =>
      ParseResult.succeed({
        ...rest,
        apiId,
        image: image?.original ?? null,
        isWatched: false,
        rating: rating.average ?? null,
        thumbnail: image?.medium ?? null,
      }),
    encode: (create, _, ast) => ParseResult.fail(new ParseResult.Forbidden(ast, create, "Forbidden.")),
  }
);

// PERSONS ---------------------------------------------------------------------------------------------------------------------------------
export const sPersonDto = sApiPersonDto.pick("birthday", "deathday", "gender", "id", "image", "name", "updated");

// SHOWS -----------------------------------------------------------------------------------------------------------------------------------
export const sShowDto = S.transformOrFail(
  sApiShowDto.omit("_links", "averageRuntime", "dvdCountry", "externals", "language", "runtime", "schedule", "type", "url"),
  S.Struct({
    ...sApiShowDto.pick("ended", "genres", "name", "officialSite", "premiered", "status", "summary", "updated", "weight").fields,
    ...sShowFields.pick("apiId", "preference").fields,
    channel: S.NullOr(sChannelDto),
    episodes: S.Array(sEpisodeDto),
    image: S.NullOr(S.String),
    rating: S.NonNegative,
    thumbnail: S.NullOr(S.String),
  }),
  {
    strict: true,
    decode: ({ _embedded, id: apiId, image, network, rating, webChannel, ...rest }) =>
      ParseResult.succeed({
        ...rest,
        apiId,
        channel: webChannel ?? network,
        episodes: _embedded?.episodes ?? [],
        image: image?.original ?? null,
        preference: "unset" as const,
        rating: rating.average ?? 0,
        thumbnail: image?.medium ?? null,
      }),
    encode: (create, _, ast) => ParseResult.fail(new ParseResult.Forbidden(ast, create, "Forbidden.")),
  }
);

export const sShowUpdatesDto = S.transformOrFail(
  S.Record({ key: S.String, value: S.NonNegativeInt }),
  S.mutable(S.Array(S.NonNegativeInt)),
  {
    strict: true,
    decode: (updates) => ParseResult.succeed(Object.entries({ ...updates }).map(([key]) => +key)),
    encode: (create, _, ast) => ParseResult.fail(new ParseResult.Forbidden(ast, create, "Forbidden.")),
  }
);
