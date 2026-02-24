import { ParseResult, Schema as S } from "effect";
import { makeTableHelpers } from "@/convex/effex/services/Helpers";
import { sApiEpisodeDto } from "./api";
import { sShow } from "./shows";

// ENTRY -----------------------------------------------------------------------------------------------------------------------------------
export const { sDoc: sEpisodeDoc, sFields: sEpisodeFields, sRef: sEpisodeRef } = makeTableHelpers("episodes");

// REF -------------------------------------------------------------------------------------------------------------------------------------
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
