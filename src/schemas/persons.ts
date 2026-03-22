import { Schema as S } from "effect";
import { makeTableHelpers } from "@/convex/effex/services/Helpers";
import { sCountry } from "./countries";
import type { sPersonDto } from "./dtos";

// ENTRY -----------------------------------------------------------------------------------------------------------------------------------
export const { sDoc: sPersonDoc, sFields: sPersonFields, sRef: sPersonRef } = makeTableHelpers("persons");

// ENTITY ----------------------------------------------------------------------------------------------------------------------------------
export const sPerson = sPersonDoc.pipe(S.fieldsAssign({ country: S.OptionFromNullOr(sCountry) }));

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
export type Persons = {
  Doc: typeof sPersonDoc.Type;
  Dto: typeof sPersonDto.Type;
  Entity: typeof sPerson.Type;
  Fields: typeof sPersonFields.Type;
};
