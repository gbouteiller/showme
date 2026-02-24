import { makeTableHelpers } from "@/convex/effex/services/Helpers";

// ENTRY -----------------------------------------------------------------------------------------------------------------------------------
export const { sDoc: sFetcherDoc, sFields: sFetcherFields, sRef: sFetcherRef } = makeTableHelpers("fetcher");

// ENTITY ----------------------------------------------------------------------------------------------------------------------------------
export const sFetcher = sFetcherDoc;

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
export type Fetchers = {
  Doc: typeof sFetcherDoc.Type;
  Entity: typeof sFetcher.Encoded;
  Entry: typeof sFetcher.Type;
  Fields: typeof sFetcherFields.Type;
};
