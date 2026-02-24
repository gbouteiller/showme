import type { ExpressionOrValue, FilterBuilder, Query as Query_ } from "convex/server";
import type { DataModel, TableNames } from "@/convex/_generated/dataModel";
import { makeOrderedQuery } from "./OrderedQuery";

// FACTORY ---------------------------------------------------------------------------------------------------------------------------------
export const makeQuery = <TN extends TableNames>(query: Query_<DataModel[TN]>, table: TN) => {
  const orderedQuery = makeOrderedQuery(query, table);

  const filter = (predicate: (q: FilterBuilder<DataModel[TN]>) => ExpressionOrValue<boolean>) => makeQuery(query.filter(predicate), table);

  const order = (order: "asc" | "desc") => makeOrderedQuery(query.order(order), table);

  return { ...orderedQuery, filter, order };
};
