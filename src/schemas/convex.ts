import { Id } from "@rjdellecese/confect/server";
import { Schema as S } from "effect";
import type { TableNames } from "../../convex/_generated/dataModel";

// ID --------------------------------------------------------------------------------------------------------------------------------------
export const sId = Id.Id;

// FILE ------------------------------------------------------------------------------------------------------------------------------------
export const sFiles = S.declare((input: unknown): input is File => input instanceof File).pipe(S.Array, S.mutable);

// REFS ------------------------------------------------------------------------------------------------------------------------------------
export const sDocRef = <T extends TableNames>(tableName: T) => S.Struct({ _id: sId(tableName) });
export const sDocRefs = <T extends TableNames>(tableName: T) => S.Struct({ _ids: S.HashSet(sId(tableName)) });
export const sStorageRef = S.Struct({ storageId: sId("_storage") });

// COMMON ----------------------------------------------------------------------------------------------------------------------------------
export const sDocCommon = <T extends TableNames>(tableName: T) =>
  S.Struct({
    ...sDocRef(tableName).fields,
    _creationTime: S.Number,
  });

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
export type DocCommon<T extends TableNames> = ReturnType<typeof sDocCommon<T>>["Type"];
export type DocRef<T extends TableNames> = ReturnType<typeof sDocRef<T>>["Type"];
export type DocRefs<T extends TableNames> = ReturnType<typeof sDocRefs<T>>["Type"];
export type StorageRef = typeof sStorageRef.Type;
