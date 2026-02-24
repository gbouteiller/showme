import { makeTableHelpers } from "@/convex/effex/services/Helpers";
import { sApiCharacterDto } from "./api";

// ENTRY -----------------------------------------------------------------------------------------------------------------------------------
export const { sDoc: sCharacterDoc, sFields: sCharacterFields, sRef: sCharacterRef } = makeTableHelpers("characters");

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
