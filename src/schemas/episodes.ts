import { Schema as S } from "effect";
import type { Id } from "@/convex/_generated/dataModel";
import { makeTableHelpers } from "@/convex/effex/services/Helpers";
import type { sEpisodeCreate } from "./creates";
import type { sEpisodeDto } from "./dtos";
import { sShow } from "./shows";

// ENTRY -----------------------------------------------------------------------------------------------------------------------------------
export const { sDoc: sEpisodeDoc, sFields: sEpisodeFields, sRef: sEpisodeRef } = makeTableHelpers("episodes");

// ENTITY ----------------------------------------------------------------------------------------------------------------------------------
export const sEpisode = S.Struct({ ...sEpisodeDoc.fields, show: sShow });

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
export type Episodes = {
  Create: typeof sEpisodeCreate.Type;
  Doc: typeof sEpisodeDoc.Type;
  Dto: typeof sEpisodeDto.Type;
  Entity: typeof sEpisode.Encoded;
  Entry: typeof sEpisode.Type;
  Fields: typeof sEpisodeFields.Type;
  Id: Id<"episodes">;
  Ref: typeof sEpisodeRef.Type;
};
