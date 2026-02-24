import type {
  ExpressionOrValue,
  FilterBuilder,
  IndexNames,
  IndexRange,
  IndexRangeBuilder,
  NamedIndex,
  NamedSearchIndex,
  QueryInitializer as QueryInitializer_,
  SearchFilter,
  SearchFilterBuilder,
  SearchIndexNames,
} from "convex/server";
import type { DataModel, Doc as NativeDoc, TableNames } from "@/convex/_generated/dataModel";
import { makeOrderedQuery } from "./OrderedQuery";
import { makeQuery } from "./Query";

// FACTORY ---------------------------------------------------------------------------------------------------------------------------------
export const makeQueryInitializer = <TN extends TableNames>(query: QueryInitializer_<DataModel[TN]>, table: TN) => {
  const baseQuery = makeQuery(query, table);

  const filter = (predicate: (q: FilterBuilder<DataModel[TN]>) => ExpressionOrValue<boolean>) =>
    makeQueryInitializer(query.filter(predicate), table);

  const fullTableScan = () => makeQuery(query.fullTableScan(), table);

  const withIndex = <IndexName extends IndexNames<DataModel[TN]>>(
    indexName: IndexName,
    indexRange?: (q: IndexRangeBuilder<NativeDoc<TN>, NamedIndex<DataModel[TN], IndexName>>) => IndexRange
  ) => makeQuery(query.withIndex(indexName, indexRange), table);

  const withSearchIndex = <IndexName extends SearchIndexNames<DataModel[TN]>>(
    indexName: IndexName,
    searchFilter: (q: SearchFilterBuilder<NativeDoc<TN>, NamedSearchIndex<DataModel[TN], IndexName>>) => SearchFilter
  ) => makeOrderedQuery(query.withSearchIndex(indexName, searchFilter), table);

  return { ...baseQuery, filter, fullTableScan, withIndex, withSearchIndex };
};
