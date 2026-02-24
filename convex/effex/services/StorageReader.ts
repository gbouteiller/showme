import type { StorageReader as StorageReader_ } from "convex/server";
import type { GenericId } from "convex/values";
import { Context, Effect as E, Layer, Option as O } from "effect";

// CONVEX ----------------------------------------------------------------------------------------------------------------------------------
export class ConvexStorageReader extends Context.Tag("ConvexStorageReader")<ConvexStorageReader, StorageReader_>() {
  static readonly Live = (storage: StorageReader_) => Layer.succeed(ConvexStorageReader, storage);
}

// MAKE ------------------------------------------------------------------------------------------------------------------------------------
const make = E.gen(function* () {
  const storageReader = yield* ConvexStorageReader;

  const getUrl = (storageId: GenericId<"_storage">): E.Effect<O.Option<string>> =>
    E.promise(() => storageReader.getUrl(storageId)).pipe(E.map(O.fromNullable));

  return { getUrl };
});

// SERVICE ---------------------------------------------------------------------------------------------------------------------------------
export class StorageReader extends Context.Tag("StorageReader")<StorageReader, E.Effect.Success<typeof make>>() {
  static readonly Live = (storage: StorageReader_) =>
    Layer.effect(StorageReader, make).pipe(Layer.provide(ConvexStorageReader.Live(storage)));
}
