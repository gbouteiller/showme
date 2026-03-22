import type { GenericId } from "convex/values";
import { Effect as E, Layer, Option as O, ServiceMap } from "effect";
import type { TableNames } from "@/convex/_generated/dataModel";
import type { DatabaseReader as DatabaseReader_ } from "@/convex/_generated/server";
import { Helpers } from "./Helpers";
import { makeQueryInitializer } from "./QueryInitializer";

// CONVEX ----------------------------------------------------------------------------------------------------------------------------------
export class ConvexDatabaseReader extends ServiceMap.Service<ConvexDatabaseReader, DatabaseReader_>()("ConvexDatabaseReader") {
  static readonly layer = (db: DatabaseReader_) => Layer.succeed(this, db);
}

// SERVICE ---------------------------------------------------------------------------------------------------------------------------------
export class DatabaseReader extends ServiceMap.Service<DatabaseReader>()("DatabaseReader", {
  make: E.gen(function* () {
    const db = yield* ConvexDatabaseReader;
    const helpers = yield* Helpers;

    const get = E.fn(function* <TN extends TableNames>(table: TN, id: GenericId<TN>) {
      const { decodeNullableDoc } = helpers.for(table);
      const convexDoc = yield* E.promise(() => db.get(table, id));
      return yield* decodeNullableDoc(convexDoc);
    });

    const normalizeId = <TN extends TableNames>(table: TN, id: GenericId<TN>) => O.fromNullishOr(db.normalizeId(table, id));

    const query = <TN extends TableNames>(table: TN) => makeQueryInitializer(db.query(table), table);

    return { get, normalizeId, query };
  }),
}) {
  static readonly layer = (db: DatabaseReader_) => Layer.effect(this, this.make).pipe(Layer.provide(ConvexDatabaseReader.layer(db)));
}
