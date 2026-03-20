import { Schema as S } from "effect";
import type { Id } from "@/convex/_generated/dataModel";
import { makeTableHelpers } from "@/convex/effex/services/Helpers";
import { sChannel } from "./channels";
import type { sShowCreate, sShowWithEpisodesCreate } from "./creates";
import type { sShowDto, sShowWithEpisodesDto } from "./dtos";

// ENTRY -----------------------------------------------------------------------------------------------------------------------------------
export const { sDoc: sShowDoc, sFields: sShowFields, sRef: sShowRef } = makeTableHelpers("shows");

// REF -------------------------------------------------------------------------------------------------------------------------------------
export const sShowApiRef = S.Struct({ apiId: S.Number });

// ENTITY ----------------------------------------------------------------------------------------------------------------------------------
export const sShow = S.Struct({ ...sShowDoc.fields, channel: S.OptionFromNullOr(sChannel) });

// REVISION --------------------------------------------------------------------------------------------------------------------------------
export const sShowRevision = sShowFields.pick("apiId", "updated");

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
export type Shows = {
  ApiRef: typeof sShowApiRef.Type;
  Create: typeof sShowCreate.Type;
  Doc: typeof sShowDoc.Type;
  Dto: typeof sShowDto.Type;
  Entity: typeof sShow.Encoded;
  Entry: typeof sShow.Type;
  Fields: typeof sShowFields.Type;
  Id: Id<"shows">;
  Preference: typeof sShowFields.Type.preference;
  Ref: typeof sShowRef.Type;
  Revision: typeof sShowRevision.Type;
  WithEpisodesCreate: typeof sShowWithEpisodesCreate.Type;
  WithEpisodesDto: typeof sShowWithEpisodesDto.Type;
};
