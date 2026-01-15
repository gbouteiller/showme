import { Schema as S } from "effect";
import { sApiCharacterDto } from "./api";
import { sDocCommon } from "./convex";

// ENTRY -----------------------------------------------------------------------------------------------------------------------------------
export const sCharacterFields = S.Struct({
  apiId: S.Int,
  image: S.NullOr(S.String),
  name: S.String,
  thumbnail: S.NullOr(S.String),
});
export const sCharacterDoc = S.Struct({ ...sDocCommon("characters").fields, ...sCharacterFields.fields });

// ENTITY ----------------------------------------------------------------------------------------------------------------------------------
export const sCharacter = sCharacterDoc;

// DTO -------------------------------------------------------------------------------------------------------------------------------------
export const sCharacterDto = sApiCharacterDto.pick("id", "image", "name");

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
export type Characters = {
  Doc: typeof sCharacterDoc.Type;
  Dto: typeof sCharacterDto.Type;
  Entity: typeof sCharacter.Type;
  Fields: typeof sCharacterFields.Type;
};
