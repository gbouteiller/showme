import type { WithOptionalSystemFields, WithoutSystemFields } from "convex/server";
import { type Effect as E, Layer, Option as O, Schema as S, ServiceMap, Struct } from "effect";
import type { Doc as NativeDoc, TableNames } from "@/convex/_generated/dataModel";
import { FIELDS } from "../fields";
import { sId } from "../schemas/genericId";
import { optionMapEffect } from "../utils";

// MAKE ------------------------------------------------------------------------------------------------------------------------------------
export const makeTableHelpers = <TN extends TableNames>(table: TN) => {
  const sRef = S.Struct({ _id: sId(table) });
  const sSystemFields = sRef.pipe(S.fieldsAssign({ _creationTime: S.Number }));
  const sFields = S.Struct(FIELDS[table]);
  const sDoc = sFields.pipe(S.fieldsAssign(sSystemFields.fields));
  const sInsertable = sFields;
  const sPatchable = sDoc.mapFields(Struct.map(S.optional));
  const sReplaceable = sFields.pipe(S.fieldsAssign(sSystemFields.mapFields(Struct.map(S.optional)).fields));

  const decodeDoc = (doc: ConvexDoc) => S.decodeEffect(sDoc)(doc) as E.Effect<Doc, S.SchemaError>;

  return {
    decodeDocs: (docs: NativeDoc<TN>[]) =>
      S.decodeEffect(S.mutable(S.Array(sDoc)))(docs as unknown as ConvexDoc[]) as E.Effect<Doc[], S.SchemaError>,
    decodeNullableDoc: (doc: NativeDoc<TN> | null) => optionMapEffect(O.fromNullishOr(doc as ConvexDoc | null), decodeDoc),
    encodeInsertable: S.encodeEffect(sInsertable) as unknown as (v: Insertable) => E.Effect<NativeInsertable<TN>, S.SchemaError>,
    encodePatchable: S.encodeEffect(sPatchable) as (v: Patchable) => E.Effect<NativePatchable<TN>, S.SchemaError>,
    encodeReplaceable: S.encodeEffect(sReplaceable) as unknown as (v: Replaceable) => E.Effect<NativeReplaceable<TN>, S.SchemaError>,
    sDoc,
    sFields,
    sRef,
    _types: null as unknown as { Insertable: Insertable; Patchable: Patchable; Replaceable: Replaceable },
  };

  type ConvexDoc = typeof sDoc.Encoded;
  type Doc = typeof sDoc.Type;
  type Insertable = typeof sInsertable.Type;
  type Patchable = typeof sPatchable.Type;
  type Replaceable = typeof sReplaceable.Type;
};

export const makeHelpers = () => {
  const for_ = makeTableHelpers;
  return {
    for: for_,
    _types: null as unknown as {
      Gettable: { [TN in TableNames]: Parameters<ReturnType<typeof for_<TN>>["decodeNullableDoc"]>[0] };
      Insertable: { [TN in TableNames]: Parameters<ReturnType<typeof for_<TN>>["encodeInsertable"]>[0] };
      Patchable: { [TN in TableNames]: Parameters<ReturnType<typeof for_<TN>>["encodePatchable"]>[0] };
      Replaceable: { [TN in TableNames]: Parameters<ReturnType<typeof for_<TN>>["encodeReplaceable"]>[0] };
    },
  };
};

// SERVICE ---------------------------------------------------------------------------------------------------------------------------------
export class Helpers extends ServiceMap.Service<Helpers, ReturnType<typeof makeHelpers>>()("Helpers") {
  static readonly layer = Layer.sync(this, makeHelpers);
}

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
export type { Doc as NativeDoc } from "@/convex/_generated/dataModel";
export type NativeInsertable<TN extends TableNames> = WithoutSystemFields<NativeDoc<TN>>;
export type NativePatchable<TN extends TableNames> = Partial<NativeDoc<TN>>;
export type NativeReplaceable<TN extends TableNames> = WithOptionalSystemFields<NativeDoc<TN>>;
