import type { StorageReader as StorageReader_ } from "convex/server";
import type { GenericId } from "convex/values";
import { Effect as E, Layer, Option as O, ServiceMap } from "effect";

// CONVEX ----------------------------------------------------------------------------------------------------------------------------------
export class ConvexStorageReader extends ServiceMap.Service<ConvexStorageReader, StorageReader_>()("ConvexStorageReader") {
  static readonly layer = (storage: StorageReader_) => Layer.succeed(ConvexStorageReader, storage);
}

// SERVICE ---------------------------------------------------------------------------------------------------------------------------------
export class StorageReader extends ServiceMap.Service<StorageReader>()("StorageReader", {
  make: E.gen(function* () {
    const storageReader = yield* ConvexStorageReader;

    const getUrl = (storageId: GenericId<"_storage">): E.Effect<O.Option<string>> =>
      E.promise(() => storageReader.getUrl(storageId)).pipe(E.map(O.fromNullishOr));

    return { getUrl };
  }),
}) {
  static readonly layer = (storage: StorageReader_) =>
    Layer.effect(StorageReader, this.make).pipe(Layer.provide(ConvexStorageReader.layer(storage)));
}
