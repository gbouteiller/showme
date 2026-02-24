import { ParseResult, Schema as S } from "effect";
import { makeTableHelpers } from "@/convex/effex/services/Helpers";
import { sApiShowDto } from "./api";
import { sChannel, sChannelCreate, sChannelDto } from "./channels";

// ENTRY -----------------------------------------------------------------------------------------------------------------------------------
export const { sDoc: sShowDoc, sFields: sShowFields, sRef: sShowRef } = makeTableHelpers("shows");

// REF -------------------------------------------------------------------------------------------------------------------------------------
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
    rating: S.NonNegative,
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
        rating: rating.average ?? 0,
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
  Preference: typeof sShowFields.Type.preference;
  Ref: typeof sShowRef.Type;
};
