import type { WithOptionalSystemFields, WithoutSystemFields } from "convex/server";
import { Context, type Effect as E, Layer, Option as O, Schema as S } from "effect";
import type { ParseError } from "effect/ParseResult";
import type { Doc as NativeDoc, TableNames } from "@/convex/_generated/dataModel";
import { FIELDS } from "../fields";
import { sId } from "../schemas/genericId";
import { optionMapEffect } from "../utils";

// MAKE ------------------------------------------------------------------------------------------------------------------------------------
export const makeTableHelpers = <TN extends TableNames>(table: TN) => {
  const ref = { _id: sId(table) };
  const systemFields = { _creationTime: S.Number, ...ref };
  const optionalSystemFields = { _creationTime: S.optional(S.Number), _id: S.optional(sId(table)) };
  const sFields = S.Struct(FIELDS[table]);
  const sDoc = S.Struct({ ...systemFields, ...sFields.fields });
  const sRef = S.Struct(ref);
  const decodeDoc = (doc: ConvexDoc) => S.decode(sDoc)(doc) as E.Effect<Doc, ParseError>;

  return {
    decodeDocs: (docs: ConvexDoc[]) => S.decode(S.mutable(S.Array(sDoc)))(docs) as E.Effect<Doc[], ParseError>,
    decodeNullableDoc: (doc: ConvexDoc | null): E.Effect<O.Option<Doc>, ParseError> => optionMapEffect(O.fromNullable(doc), decodeDoc),
    encodeInsertable: (value: Insertable) => S.encode(sFields)(value),
    encodePatchable: (value: Patchable) => S.encode(S.partial(sDoc))(value),
    encodeReplaceable: (value: Replaceable) => S.encode(S.Struct({ ...optionalSystemFields, ...sFields.fields }))(value),
    sDoc,
    sFields,
    sRef,
    _types: null as unknown as { ConvexDoc: ConvexDoc; Doc: Doc },
  };

  type ConvexDoc = S.Schema.Encoded<typeof sDoc>;
  type Doc = S.Schema.Type<typeof sDoc>;
  type Insertable = S.Schema.Type<typeof sFields>;
  type Patchable = Partial<Doc>;
  type Replaceable = S.Schema.Type<typeof S.Struct<typeof optionalSystemFields & typeof sFields.fields>>;
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
export class Helpers extends Context.Tag("Helpers")<Helpers, ReturnType<typeof makeHelpers>>() {
  static readonly Live = Layer.sync(this, makeHelpers);
}

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
export type { Doc as NativeDoc } from "@/convex/_generated/dataModel";
export type NativeInsertable<TN extends TableNames> = WithoutSystemFields<NativeDoc<TN>>;
export type NativePatchable<TN extends TableNames> = Partial<NativeDoc<TN>>;
export type NativeReplaceable<TN extends TableNames> = WithOptionalSystemFields<NativeDoc<TN>>;
