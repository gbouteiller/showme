import { Schema as S } from "effect";
import { sDocCommon } from "./convex";

// ENTRY -----------------------------------------------------------------------------------------------------------------------------------
export const sFetcherFields = S.Struct({
  created: S.NonNegativeInt,
  isPending: S.Boolean,
  lastPage: S.NonNegativeInt,
  lastUpdated: S.NonNegativeInt,
});
export const sFetcherDoc = S.Struct({ ...sDocCommon("fetcher").fields, ...sFetcherFields.fields });

// ENTITY ----------------------------------------------------------------------------------------------------------------------------------
export const sFetcher = sFetcherDoc;

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
export type Fetchers = {
  Doc: typeof sFetcherDoc.Type;
  Entity: typeof sFetcher.Encoded;
  Entry: typeof sFetcher.Type;
  Fields: typeof sFetcherFields.Type;
};
