import type { ExpressionOrValue, FilterBuilder, OrderedQuery as OrderedQuery_, PaginationOptions } from "convex/server";
import { Effect as E } from "effect";
import type { DataModel, TableNames } from "@/convex/_generated/dataModel";
import { DocNotFoundInTable } from "../errors";
import { makeTableHelpers } from "./Helpers";

// FACTORY ---------------------------------------------------------------------------------------------------------------------------------
export const makeOrderedQuery = <TN extends TableNames>(query: OrderedQuery_<DataModel[TN]>, table: TN) => {
  const { decodeDocs, decodeNullableDoc } = makeTableHelpers(table);

  const collect = E.fn(function* () {
    const docs = yield* E.promise(() => query.collect());
    return yield* decodeDocs(docs);
  });

  const filter = (predicate: (q: FilterBuilder<DataModel[TN]>) => ExpressionOrValue<boolean>) =>
    makeOrderedQuery(query.filter(predicate), table);

  const first = E.fn(function* () {
    const doc = yield* E.promise(() => query.first());
    return yield* decodeNullableDoc(doc);
  });

  const paginate = E.fn(function* (paginationOpts: PaginationOptions) {
    const result = yield* E.promise(() => query.paginate(paginationOpts));
    const page = yield* decodeDocs(result.page);
    return { ...result, page };
  });

  const take = E.fn(function* (n: number) {
    const docs = yield* E.promise(() => query.take(n));
    return yield* decodeDocs(docs);
  });

  const unique = E.fn(function* () {
    const doc = yield* E.tryPromise({
      try: () => query.unique(),
      catch: () => new DocNotFoundInTable({ table }),
    });
    return yield* decodeNullableDoc(doc);
  });

  return { collect, filter, first, paginate, take, unique };
};
