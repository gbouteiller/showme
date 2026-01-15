import { Id } from "@rjdellecese/confect/server";
import { ParseResult, Schema as S } from "effect";
import { sApiShowDto } from "./api";
import { sChannel, sChannelCreate, sChannelDto } from "./channels";
import { sDocCommon, sDocRef } from "./convex";

// ENTRY -----------------------------------------------------------------------------------------------------------------------------------
export const sShowFields = S.Struct({
  apiId: S.NonNegativeInt,
  channelId: S.OptionFromNullOr(Id.Id("channels")),
  ended: S.OptionFromNullOr(S.String),
  genres: S.Array(S.String),
  image: S.OptionFromNullOr(S.String),
  name: S.String,
  officialSite: S.OptionFromNullOr(S.String),
  premiered: S.OptionFromNullOr(S.String),
  preference: S.Literal("favorite", "ignored", "unset"),
  rating: S.OptionFromNullOr(S.NonNegative),
  status: S.String,
  summary: S.OptionFromNullOr(S.String),
  thumbnail: S.OptionFromNullOr(S.String),
  updated: S.NonNegativeInt,
  weight: S.NonNegativeInt,
});
export const sShowDoc = S.Struct({ ...sDocCommon("shows").fields, ...sShowFields.fields });

// REF -------------------------------------------------------------------------------------------------------------------------------------
export const sShowRef = sDocRef("shows");
export const sShowApiRef = S.Struct({ apiId: S.Number });

// ENTITY ----------------------------------------------------------------------------------------------------------------------------------
export const sShow = S.Struct({ ...sShowDoc.fields, channel: S.OptionFromNullOr(sChannel) });

// DTO -------------------------------------------------------------------------------------------------------------------------------------
export const sShowDto = S.transformOrFail(
  sApiShowDto.omit("_embedded", "_links", "averageRuntime", "dvdCountry", "externals", "language", "runtime", "schedule", "type", "url"),
  S.Struct({
    ...sApiShowDto.pick("ended", "genres", "name", "officialSite", "premiered", "status", "summary", "updated", "weight").fields,
    ...sShowFields.pick("apiId", "preference").fields,
    channel: S.NullOr(sChannelDto),
    image: S.NullOr(S.String),
    rating: S.NullOr(S.NonNegative),
    thumbnail: S.NullOr(S.String),
  }),
  {
    strict: true,
    decode: ({ id: apiId, image, network, rating, webChannel, ...rest }) =>
      ParseResult.succeed({
        ...rest,
        apiId,
        channel: webChannel ?? network,
        image: image?.original ?? null,
        preference: "unset" as const,
        rating: rating.average ?? null,
        thumbnail: image?.medium ?? null,
      }),
    encode: (create, _, ast) => ParseResult.fail(new ParseResult.Forbidden(ast, create, "Forbidden.")),
  }
);

// CREATE ----------------------------------------------------------------------------------------------------------------------------------
export const sShowCreate = S.Struct({
  ...sShowFields.omit("channelId").fields,
  channel: S.OptionFromNullOr(sChannelCreate),
});

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
export type Shows = {
  ApiRef: typeof sShowApiRef.Type;
  Create: typeof sShowCreate.Type;
  Doc: typeof sShowDoc.Type;
  Dto: typeof sShowDto.Type;
  Entity: typeof sShow.Encoded;
  Entry: typeof sShow.Type;
  Fields: typeof sShowFields.Type;
  Ref: typeof sShowRef.Type;
};
