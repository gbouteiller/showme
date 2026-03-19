import { Schema as S } from "effect";
import { makeTableHelpers } from "@/convex/effex/services/Helpers";
import { sCountry } from "./countries";
import type { sChannelCreate } from "./creates";
import type { sChannelDto } from "./dtos";

// ENTRY -----------------------------------------------------------------------------------------------------------------------------------
export const { sDoc: sChannelDoc, sFields: sChannelFields, sRef: sChannelRef } = makeTableHelpers("channels");

// REF -------------------------------------------------------------------------------------------------------------------------------------
export const sChannelApiRef = S.Struct({ apiId: S.Number });

// ENTITY ----------------------------------------------------------------------------------------------------------------------------------
export const sChannel = S.Struct({ ...sChannelDoc.fields, country: S.OptionFromNullOr(sCountry) });

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
