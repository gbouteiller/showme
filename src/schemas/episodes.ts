import { ParseResult, Schema as S } from "effect";
import { sApiEpisodeDto } from "./api";
import { sDocCommon, sDocRef, sId } from "./convex";
import { sShow } from "./shows";

// ENTRY -----------------------------------------------------------------------------------------------------------------------------------
export const sEpisodeFields = S.Struct({
  airdate: S.String,
  airstamp: S.String,
  airtime: S.String,
  apiId: S.NonNegativeInt,
  image: S.NullOr(S.String),
  isWatched: S.Boolean,
  name: S.String,
  number: S.NullOr(S.NonNegativeInt),
  preference: S.Literal("favorite", "ignored", "unset"),
  rating: S.NullOr(S.NonNegative),
  runtime: S.NullOr(S.NonNegativeInt),
  season: S.NonNegativeInt,
  showId: sId("shows"),
  summary: S.NullOr(S.String),
  thumbnail: S.NullOr(S.String),
});
export const sEpisodeDoc = S.Struct({ ...sDocCommon("episodes").fields, ...sEpisodeFields.fields });

// REF -------------------------------------------------------------------------------------------------------------------------------------
export const sEpisodeRef = sDocRef("episodes");
export const sEpisodeApiRef = S.Struct({ apiId: S.Number });

// ENTITY ----------------------------------------------------------------------------------------------------------------------------------
export const sEpisode = S.Struct({ ...sEpisodeDoc.fields, show: sShow });

// DTO -------------------------------------------------------------------------------------------------------------------------------------
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

// CREATE ----------------------------------------------------------------------------------------------------------------------------------
export const sEpisodeCreate = sEpisodeFields.omit("showId", "preference");

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
export type Episodes = {
  ApiRef: typeof sEpisodeApiRef.Type;
  Create: typeof sEpisodeCreate.Type;
  Doc: typeof sEpisodeDoc.Type;
  Dto: typeof sEpisodeDto.Type;
  Entity: typeof sEpisode.Encoded;
  Entry: typeof sEpisode.Type;
  Fields: typeof sEpisodeFields.Type;
  Ref: typeof sEpisodeRef.Type;
};
