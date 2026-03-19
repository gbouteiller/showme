import { Schema as S } from "effect";
import { makeTableHelpers } from "@/convex/effex/services/Helpers";
import { sChannel } from "./channels";
import type { sShowCreate } from "./creates";
import type { sShowDto } from "./dtos";

// ENTRY -----------------------------------------------------------------------------------------------------------------------------------
export const { sDoc: sShowDoc, sFields: sShowFields, sRef: sShowRef } = makeTableHelpers("shows");

// REF -------------------------------------------------------------------------------------------------------------------------------------
export const sShowApiRef = S.Struct({ apiId: S.Number });

// ENTITY ----------------------------------------------------------------------------------------------------------------------------------
export const sShow = S.Struct({ ...sShowDoc.fields, channel: S.OptionFromNullOr(sChannel) });

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
