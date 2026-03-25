import type { HashMap as H } from "effect";
import type { Id } from "@/convex/_generated/dataModel";
import { makeTableHelpers } from "@/convex/effex/services/Helpers";
import type { sCountryCreate } from "./creates";
import type { sCountryDto } from "./dtos";

// ENTRY -----------------------------------------------------------------------------------------------------------------------------------
export const { sDoc: sCountryDoc, sFields: sCountryFields, sRef: sCountryRef } = makeTableHelpers("countries");

// ENTITY ----------------------------------------------------------------------------------------------------------------------------------
export const sCountry = sCountryDoc;

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
export type Countries = {
  Code: Countries["Doc"]["code"];
  Create: typeof sCountryCreate.Type;
  Doc: typeof sCountryDoc.Type;
  Dto: typeof sCountryDto.Type;
  Entity: typeof sCountry.Encoded;
  Entry: typeof sCountry.Type;
  Fields: typeof sCountryFields.Type;
  Id: Id<"countries">;
  Ref: typeof sCountryRef.Type;
  Set: H.HashMap<Countries["Code"], Countries["Id"]>;
};
