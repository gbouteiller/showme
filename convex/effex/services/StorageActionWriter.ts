import type { StorageActionWriter as StorageActionWriter_ } from "convex/server";
import type { GenericId } from "convex/values";
import { Effect as E, Layer, Option as O, ServiceMap } from "effect";
import { StorageWriter } from "./StorageWriter";

// CONVEX ----------------------------------------------------------------------------------------------------------------------------------
export class ConvexStorageActionWriter extends ServiceMap.Service<ConvexStorageActionWriter, StorageActionWriter_>()(
  "ConvexStorageActionWriter"
) {
  static readonly layer = (storage: StorageActionWriter_) => Layer.succeed(this, storage);
}

// SERVICE ---------------------------------------------------------------------------------------------------------------------------------
export class StorageActionWriter extends ServiceMap.Service<StorageActionWriter>()("StorageActionWriter", {
  make: E.gen(function* () {
    const storageActionWriter = yield* ConvexStorageActionWriter;
    const { delete: delete_, generateUploadUrl, getUrl } = yield* StorageWriter;

    const get = (storageId: GenericId<"_storage">): E.Effect<O.Option<Blob>> =>
      E.promise(() => storageActionWriter.get(storageId)).pipe(E.map(O.fromNullishOr));

    const store = (blob: Blob, options?: { sha256?: string }): E.Effect<GenericId<"_storage">> =>
      E.promise(() => storageActionWriter.store(blob, options));

    return { delete: delete_, generateUploadUrl, get, getUrl, store };
  }),
}) {
  static readonly layer = (storage: StorageActionWriter_) =>
    Layer.effect(this, this.make).pipe(
      Layer.provide(ConvexStorageActionWriter.layer(storage)),
      Layer.provideMerge(StorageWriter.layer(storage))
    );
}
