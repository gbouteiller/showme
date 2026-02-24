import type { GenericId } from "convex/values";
import { Context, Effect as E, Layer, Option as O } from "effect";
import type { TableNames } from "@/convex/_generated/dataModel";
import type { DatabaseReader as DatabaseReader_ } from "@/convex/_generated/server";
import { Helpers } from "./Helpers";
import { makeQueryInitializer } from "./QueryInitializer";

// CONVEX ----------------------------------------------------------------------------------------------------------------------------------
export class ConvexDatabaseReader extends Context.Tag("ConvexDatabaseReader")<ConvexDatabaseReader, DatabaseReader_>() {
  static readonly Live = (db: DatabaseReader_) => Layer.succeed(this, db);
}

// MAKE ------------------------------------------------------------------------------------------------------------------------------------
const make = E.gen(function* () {
  const db = yield* ConvexDatabaseReader;
  const helpers = yield* Helpers;

  const get = E.fn(function* <TN extends TableNames>(table: TN, id: GenericId<TN>) {
    const { decodeNullableDoc } = helpers.for(table);
    const convexDoc = yield* E.promise(() => db.get(table, id));
    return yield* decodeNullableDoc(convexDoc as Gettable<TN>);
  });

  const normalizeId = <TN extends TableNames>(table: TN, id: GenericId<TN>): O.Option<GenericId<TN>> =>
    O.fromNullable(db.normalizeId(table, id));

  const query = <TN extends TableNames>(table: TN) => makeQueryInitializer(db.query(table), table);

  return { get, normalizeId, query };

  type Gettable<TN extends TableNames> = (typeof helpers._types.Gettable)[TN];
});

// SERVICE ---------------------------------------------------------------------------------------------------------------------------------
export class DatabaseReader extends Context.Tag("DatabaseReader")<DatabaseReader, E.Effect.Success<typeof make>>() {
  static readonly Live = (db: DatabaseReader_) => Layer.effect(this, make).pipe(Layer.provide(ConvexDatabaseReader.Live(db)));
}
