import type { GenericId } from "convex/values";
import { Context, Effect as E, Layer } from "effect";
import type { TableNames } from "@/convex/_generated/dataModel";
import type { DatabaseWriter as DatabaseWriter_ } from "@/convex/_generated/server";
import { DatabaseReader } from "./DatabaseReader";
import { Helpers, type NativeInsertable, type NativePatchable, type NativeReplaceable } from "./Helpers";

// CONVEX ----------------------------------------------------------------------------------------------------------------------------------
export class ConvexDatabaseWriter extends Context.Tag("ConvexDatabaseWriter")<ConvexDatabaseWriter, DatabaseWriter_>() {
  static readonly Live = (db: DatabaseWriter_) => Layer.succeed(this, db);
}

// MAKE ------------------------------------------------------------------------------------------------------------------------------------
const make = E.gen(function* () {
  const { get, normalizeId, query } = yield* DatabaseReader;
  const db = yield* ConvexDatabaseWriter;
  const helpers = yield* Helpers;

  const delete_ = E.fn(function* <TN extends TableNames>(table: TN, id: GenericId<TN>) {
    return yield* E.promise(() => db.delete(table, id));
  });

  const insert = E.fn(function* <TN extends TableNames>(table: TN, value: Insertable<TN>) {
    const { encodeInsertable } = helpers.for(table);
    const encoded = (yield* encodeInsertable(value)) as NativeInsertable<TN>;
    return yield* E.promise(() => db.insert(table, encoded));
  });

  const patch = E.fn(function* <TN extends TableNames>(table: TN, id: GenericId<TN>, value: Patchable<TN>) {
    const { encodePatchable } = helpers.for(table);
    const encoded = (yield* encodePatchable(value)) as NativePatchable<TN>;
    return yield* E.promise(() => db.patch(table, id, encoded));
  });

  const replace = E.fn(function* <TN extends TableNames>(table: TN, id: GenericId<TN>, value: Replaceable<TN>) {
    const { encodeReplaceable } = helpers.for(table);
    const encoded = (yield* encodeReplaceable(value)) as NativeReplaceable<TN>;
    return yield* E.promise(() => db.replace(table, id, encoded));
  });

  return { delete: delete_, get, insert, normalizeId, patch, query, replace };

  type Insertable<TN extends TableNames> = (typeof helpers._types.Insertable)[TN];
  type Patchable<TN extends TableNames> = (typeof helpers._types.Patchable)[TN];
  type Replaceable<TN extends TableNames> = (typeof helpers._types.Replaceable)[TN];
});

// SERVICE ---------------------------------------------------------------------------------------------------------------------------------
export class DatabaseWriter extends Context.Tag("DatabaseWriter")<DatabaseWriter, E.Effect.Success<typeof make>>() {
  static readonly Live = (db: DatabaseWriter_) =>
    Layer.effect(this, make).pipe(Layer.provide(ConvexDatabaseWriter.Live(db)), Layer.provideMerge(DatabaseReader.Live(db)));
}
