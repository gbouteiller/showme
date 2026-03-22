import type { StorageWriter as StorageWriter_ } from "convex/server";
import type { GenericId } from "convex/values";
import { Effect as E, Layer, ServiceMap } from "effect";
import { StorageReader } from "./StorageReader";

// CONVEX ----------------------------------------------------------------------------------------------------------------------------------
export class ConvexStorageWriter extends ServiceMap.Service<ConvexStorageWriter, StorageWriter_>()("ConvexStorageWriter") {
  static readonly layer = (storage: StorageWriter_) => Layer.succeed(this, storage);
}

// SERVICE ---------------------------------------------------------------------------------------------------------------------------------
export class StorageWriter extends ServiceMap.Service<StorageWriter>()("StorageWriter", {
  make: E.gen(function* () {
    const storageWriter = yield* ConvexStorageWriter;
    const { getUrl } = yield* StorageReader;

    const delete_ = (storageId: GenericId<"_storage">): E.Effect<void> => E.promise(() => storageWriter.delete(storageId));
    const generateUploadUrl = (): E.Effect<string> => E.promise(() => storageWriter.generateUploadUrl());

    return { delete: delete_, generateUploadUrl, getUrl };
  }),
}) {
  static readonly layer = (storage: StorageWriter_) =>
    Layer.effect(this, this.make).pipe(Layer.provide(ConvexStorageWriter.layer(storage)), Layer.provideMerge(StorageReader.layer(storage)));
}
