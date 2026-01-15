import { Schema as S } from "effect";
import { sApiCountryDto } from "./api";
import { sDocCommon, sDocRef } from "./convex";

// ENTRY -----------------------------------------------------------------------------------------------------------------------------------
export const sCountryFields = S.Struct({
  code: S.String,
  name: S.String,
  timezone: S.String,
});
export const sCountryDoc = S.Struct({ ...sDocCommon("countries").fields, ...sCountryFields.fields });

// REF -------------------------------------------------------------------------------------------------------------------------------------
export const sCountryRef = sDocRef("countries");
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
