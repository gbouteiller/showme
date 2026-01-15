import { Id } from "@rjdellecese/confect/server";
import { ParseResult, Schema as S } from "effect";
import { sApiChannelDto } from "./api";
import { sDocCommon, sDocRef } from "./convex";
import { sCountry, sCountryCreate } from "./countries";

// ENTRY -----------------------------------------------------------------------------------------------------------------------------------
export const sChannelFields = S.Struct({
  apiId: S.NonNegativeInt,
  countryId: S.OptionFromNullOr(Id.Id("countries")),
  name: S.String,
  officialSite: S.OptionFromNullOr(S.String),
});
export const sChannelDoc = S.Struct({ ...sDocCommon("channels").fields, ...sChannelFields.fields });

// REF -------------------------------------------------------------------------------------------------------------------------------------
export const sChannelRef = sDocRef("channels");
export const sChannelApiRef = S.Struct({ apiId: S.Number });

// ENTITY ----------------------------------------------------------------------------------------------------------------------------------
export const sChannel = S.Struct({ ...sChannelDoc.fields, country: S.OptionFromNullOr(sCountry) });

// DTO -------------------------------------------------------------------------------------------------------------------------------------
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

// CREATE ----------------------------------------------------------------------------------------------------------------------------------
export const sChannelCreate = S.Struct({
  ...sChannelFields.omit("countryId").fields,
  country: S.OptionFromNullOr(sCountryCreate),
});

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
export type Channels = {
  ApiRef: typeof sChannelApiRef.Type;
  Create: typeof sChannelCreate.Type;
  Doc: typeof sChannelDoc.Type;
  Dto: typeof sChannelDto.Type;
  Entity: typeof sChannel.Encoded;
  Entry: typeof sChannel.Type;
  Fields: typeof sChannelFields.Type;
  Ref: typeof sChannelRef.Type;
};
