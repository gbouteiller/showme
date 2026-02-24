import { makeTableHelpers } from "@/convex/effex/services/Helpers";
import { sApiCastDto } from "./api";

// ENTRY -----------------------------------------------------------------------------------------------------------------------------------
export const { sDoc: sCastDoc, sFields: sCastFields, sRef: sCastRef } = makeTableHelpers("casts");

// ENTITY ----------------------------------------------------------------------------------------------------------------------------------
export const sCast = sCastDoc;

// DTO -------------------------------------------------------------------------------------------------------------------------------------
export const sCastDto = sApiCastDto.pick("character", "person");

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
export type Casts = {
  Doc: typeof sCastDoc.Type;
  Dto: typeof sCastDto.Type;
  Entity: typeof sCast.Type;
  Fields: typeof sCastFields.Type;
  Ref: typeof sCastRef.Type;
};
