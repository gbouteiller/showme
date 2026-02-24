import { Schema as S } from "effect";
import { makeTableHelpers } from "@/convex/effex/services/Helpers";
import { sApiPersonDto } from "./api";
import { sCountry } from "./countries";

// ENTRY -----------------------------------------------------------------------------------------------------------------------------------
export const { sDoc: sPersonDoc, sFields: sPersonFields, sRef: sPersonRef } = makeTableHelpers("persons");

// ENTITY ----------------------------------------------------------------------------------------------------------------------------------
export const sPerson = S.Struct({ ...sPersonDoc.fields, country: S.NullOr(sCountry) });

// DTO -------------------------------------------------------------------------------------------------------------------------------------
export const sPersonDto = sApiPersonDto.pick("birthday", "deathday", "gender", "id", "image", "name", "updated");

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
export type Persons = {
  Doc: typeof sPersonDoc.Type;
  Dto: typeof sPersonDto.Type;
  Entity: typeof sPerson.Type;
  Fields: typeof sPersonFields.Type;
};
