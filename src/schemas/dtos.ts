import { ParseResult, Schema as S } from "effect";
import { sApiChannelDto, sApiCountryDto, sApiEpisodeDto, sApiPersonDto, sApiShowDto } from "./api";
import { sChannelFields } from "./channels";
import { sEpisodeFields } from "./episodes";
import { sShowFields, sShowRevision } from "./shows";

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
const toOmit = ["_links", "averageRuntime", "dvdCountry", "externals", "language", "runtime", "schedule", "type", "url"] as const;
type ApiShowBaseDto = Omit<typeof sApiShowDto.Type, (typeof toOmit)[number] | "_embedded">;

const sShowBaseDto = S.Struct({
  ...sApiShowDto.pick("ended", "genres", "name", "officialSite", "premiered", "status", "summary", "updated", "weight").fields,
  ...sShowFields.pick("apiId", "preference", "trackEpisodes").fields,
  channel: S.NullOr(sChannelDto),
  image: S.NullOr(S.String),
  rating: S.NonNegative,
  thumbnail: S.NullOr(S.String),
});

const showBaseFromApi = ({ id: apiId, image, network, rating, webChannel, ...rest }: ApiShowBaseDto, trackEpisodes = false) => ({
  ...rest,
  apiId,
  channel: webChannel ?? network,
  image: image?.original ?? null,
  preference: "unset" as const,
  rating: rating.average ?? 0,
  trackEpisodes,
  thumbnail: image?.medium ?? null,
});

export const sShowDto = S.transformOrFail(sApiShowDto.omit(...toOmit, "_embedded"), sShowBaseDto, {
  strict: true,
  decode: (show) => ParseResult.succeed(showBaseFromApi(show)),
  encode: (create, _, ast) => ParseResult.fail(new ParseResult.Forbidden(ast, create, "Forbidden.")),
});

export const sShowWithEpisodesDto = S.transformOrFail(
  sApiShowDto.omit(...toOmit),
  S.Struct({ ...sShowBaseDto.fields, episodes: S.Array(sEpisodeDto) }),
  {
    strict: true,
    decode: ({ _embedded, ...show }) => ParseResult.succeed({ ...showBaseFromApi(show, true), episodes: _embedded?.episodes ?? [] }),
    encode: (create, _, ast) => ParseResult.fail(new ParseResult.Forbidden(ast, create, "Forbidden.")),
  }
);

export const sShowRevisionDtos = S.transformOrFail(S.Record({ key: S.String, value: S.NonNegativeInt }), S.Array(sShowRevision), {
  strict: true,
  decode: (updates) => ParseResult.succeed(Object.entries({ ...updates }).map(([key, value]) => ({ apiId: +key, updated: value }))),
  encode: (create, _, ast) => ParseResult.fail(new ParseResult.Forbidden(ast, create, "Forbidden.")),
});
