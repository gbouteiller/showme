import type { StorageWriter as StorageWriter_ } from "convex/server";
import type { GenericId } from "convex/values";
import { Context, Effect as E, Layer } from "effect";
import { StorageReader } from "./StorageReader";

// CONVEX ----------------------------------------------------------------------------------------------------------------------------------
export class ConvexStorageWriter extends Context.Tag("ConvexStorageWriter")<ConvexStorageWriter, StorageWriter_>() {
  static readonly Live = (storage: StorageWriter_) => Layer.succeed(this, storage);
}

// MAKE ------------------------------------------------------------------------------------------------------------------------------------
const make = E.gen(function* () {
  const storageWriter = yield* ConvexStorageWriter;
  const { getUrl } = yield* StorageReader;

  const delete_ = (storageId: GenericId<"_storage">): E.Effect<void> => E.promise(() => storageWriter.delete(storageId));
  const generateUploadUrl = (): E.Effect<string> => E.promise(() => storageWriter.generateUploadUrl());

  return { delete: delete_, generateUploadUrl, getUrl };
});

// SERVICE ---------------------------------------------------------------------------------------------------------------------------------
export class StorageWriter extends Context.Tag("StorageWriter")<StorageWriter, E.Effect.Success<typeof make>>() {
  static readonly Live = (storage: StorageWriter_) =>
    Layer.effect(this, make).pipe(Layer.provide(ConvexStorageWriter.Live(storage)), Layer.provideMerge(StorageReader.Live(storage)));
}
