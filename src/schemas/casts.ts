import { Id } from "@rjdellecese/confect/server";
import { Schema as S } from "effect";
import { sApiCastDto } from "./api";
import { sDocCommon } from "./convex";

// ENTRY -----------------------------------------------------------------------------------------------------------------------------------
export const sCastFields = S.Struct({
  characterId: Id.Id("characters"),
  personId: Id.Id("persons"),
  showId: Id.Id("shows"),
});
export const sCastDoc = S.Struct({ ...sDocCommon("casts").fields, ...sCastFields.fields });

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
};
