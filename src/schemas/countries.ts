import { Schema as S } from "effect";
import { makeTableHelpers } from "@/convex/effex/services/Helpers";
import { sApiCountryDto } from "./api";

// ENTRY -----------------------------------------------------------------------------------------------------------------------------------
export const { sDoc: sCountryDoc, sFields: sCountryFields, sRef: sCountryRef } = makeTableHelpers("countries");

// REF -------------------------------------------------------------------------------------------------------------------------------------
export const sCountryApiRef = S.Struct({ code: S.String });

// ENTITY ----------------------------------------------------------------------------------------------------------------------------------
export const sCountry = sCountryDoc;

// DTO -------------------------------------------------------------------------------------------------------------------------------------
export const sCountryDto = sApiCountryDto.pick("code", "name", "timezone");

// CREATE -------------------------------------------------------------------------------------------------------------------------------------
export const sCountryCreate = sCountryDto;

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
export type Countries = {
  ApiRef: typeof sCountryApiRef.Type;
  Create: typeof sCountryCreate.Type;
  Doc: typeof sCountryDoc.Type;
  Dto: typeof sCountryDto.Type;
  Entity: typeof sCountry.Encoded;
  Entry: typeof sCountry.Type;
  Fields: typeof sCountryFields.Type;
  Ref: typeof sCountryRef.Type;
};
