import type { StorageActionWriter as StorageActionWriter_ } from "convex/server";
import type { GenericId } from "convex/values";
import { Context, Effect as E, Layer, Option as O } from "effect";
import { StorageWriter } from "./StorageWriter";

// CONVEX ----------------------------------------------------------------------------------------------------------------------------------
export class ConvexStorageActionWriter extends Context.Tag("ConvexStorageActionWriter")<ConvexStorageActionWriter, StorageActionWriter_>() {
  static readonly Live = (storage: StorageActionWriter_) => Layer.succeed(this, storage);
}

// MAKE ------------------------------------------------------------------------------------------------------------------------------------
const make = E.gen(function* () {
  const storageActionWriter = yield* ConvexStorageActionWriter;
  const { delete: delete_, generateUploadUrl, getUrl } = yield* StorageWriter;

  const get = (storageId: GenericId<"_storage">): E.Effect<O.Option<Blob>> =>
    E.promise(() => storageActionWriter.get(storageId)).pipe(E.map(O.fromNullable));

  const store = (blob: Blob, options?: { sha256?: string }): E.Effect<GenericId<"_storage">> =>
    E.promise(() => storageActionWriter.store(blob, options));

  return { delete: delete_, generateUploadUrl, get, getUrl, store };
});

// SERVICE ---------------------------------------------------------------------------------------------------------------------------------
export class StorageActionWriter extends Context.Tag("StorageActionWriter")<StorageActionWriter, E.Effect.Success<typeof make>>() {
  static readonly Live = (storage: StorageActionWriter_) =>
    Layer.effect(this, make).pipe(Layer.provide(ConvexStorageActionWriter.Live(storage)), Layer.provideMerge(StorageWriter.Live(storage)));
}
