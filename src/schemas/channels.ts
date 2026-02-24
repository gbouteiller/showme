import { ParseResult, Schema as S } from "effect";
import { makeTableHelpers } from "@/convex/effex/services/Helpers";
import { sApiChannelDto } from "./api";
import { sCountry, sCountryCreate } from "./countries";

// ENTRY -----------------------------------------------------------------------------------------------------------------------------------
export const { sDoc: sChannelDoc, sFields: sChannelFields, sRef: sChannelRef } = makeTableHelpers("channels");

// REF -------------------------------------------------------------------------------------------------------------------------------------
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
