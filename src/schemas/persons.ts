import { Id } from "@rjdellecese/confect/server";
import { Schema as S } from "effect";
import { sApiPersonDto } from "./api";
import { sDocCommon } from "./convex";
import { sCountry } from "./countries";

// ENTRY -----------------------------------------------------------------------------------------------------------------------------------
export const sPersonFields = S.Struct({
  apiId: S.NonNegativeInt,
  birthday: S.NullOr(S.String),
  countryId: S.NullOr(Id.Id("countries")),
  deathday: S.NullOr(S.String),
  gender: S.NullOr(S.String),
  image: S.NullOr(S.String),
  name: S.String,
  thumbnail: S.NullOr(S.String),
  updated: S.NullOr(S.NonNegativeInt),
});
export const sPersonDoc = S.Struct({ ...sDocCommon("persons").fields, ...sPersonFields.fields });

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
