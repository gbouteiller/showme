import { type HashMap as H, Schema as S } from "effect";
import type { Id } from "@/convex/_generated/dataModel";
import { makeTableHelpers } from "@/convex/effex/services/Helpers";
import { sCountry } from "./countries";
import type { sChannelCreate } from "./creates";
import type { sChannelDto } from "./dtos";

// ENTRY -----------------------------------------------------------------------------------------------------------------------------------
export const { sDoc: sChannelDoc, sFields: sChannelFields, sRef: sChannelRef } = makeTableHelpers("channels");

// ENTITY ----------------------------------------------------------------------------------------------------------------------------------
export const sChannel = sChannelDoc.pipe(S.fieldsAssign({ country: S.OptionFromNullOr(sCountry) }));

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
export type Channels = {
  ApiId: Channels["Doc"]["apiId"];
  Create: typeof sChannelCreate.Type;
  Doc: typeof sChannelDoc.Type;
  Dto: typeof sChannelDto.Type;
  Entity: typeof sChannel.Encoded;
  Entry: typeof sChannel.Type;
  Fields: typeof sChannelFields.Type;
  Id: Id<"channels">;
  Ref: typeof sChannelRef.Type;
  Set: H.HashMap<Channels["ApiId"], Channels["Id"]>;
};
