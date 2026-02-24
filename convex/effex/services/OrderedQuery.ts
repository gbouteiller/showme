import type { ExpressionOrValue, FilterBuilder, OrderedQuery as OrderedQuery_, PaginationOptions, PaginationResult } from "convex/server";
import { Effect as E, type Option as O } from "effect";
import type { ParseError } from "effect/ParseResult";
import type { DataModel, TableNames } from "@/convex/_generated/dataModel";
import { DocNotFoundInTable } from "../errors";
import { makeTableHelpers } from "./Helpers";

// FACTORY ---------------------------------------------------------------------------------------------------------------------------------
export const makeOrderedQuery = <TN extends TableNames>(query: OrderedQuery_<DataModel[TN]>, table: TN) => {
  const { _types, decodeDocs, decodeNullableDoc } = makeTableHelpers(table);

  const collect = E.fn(function* (): E.fn.Return<Doc[], ParseError> {
    const docs = yield* E.promise(() => query.collect());
    return yield* decodeDocs(docs as ConvexDoc[]);
  });

  const filter = (predicate: (q: FilterBuilder<DataModel[TN]>) => ExpressionOrValue<boolean>) =>
    makeOrderedQuery(query.filter(predicate), table);

  const first = E.fn(function* (): E.fn.Return<O.Option<Doc>, ParseError> {
    const doc = yield* E.promise(() => query.first());
    return yield* decodeNullableDoc(doc as ConvexDoc | null);
  });

  const paginate = E.fn(function* (paginationOpts: PaginationOptions): E.fn.Return<PaginationResult<Doc>, ParseError> {
    const result = yield* E.promise(() => query.paginate(paginationOpts));
    const page = yield* decodeDocs(result.page as ConvexDoc[]);
    return { ...result, page };
  });

  const take = E.fn(function* (n: number): E.fn.Return<Doc[], ParseError> {
    const docs = yield* E.promise(() => query.take(n));
    return yield* decodeDocs(docs as ConvexDoc[]);
  });

  const unique = E.fn(function* (): E.fn.Return<O.Option<Doc>, ParseError | DocNotFoundInTable<TN>> {
    const doc = yield* E.tryPromise({
      try: () => query.unique(),
      catch: () => new DocNotFoundInTable({ table }),
    });
    return yield* decodeNullableDoc(doc as ConvexDoc | null);
  });

  return { collect, filter, first, paginate, take, unique };

  type ConvexDoc = typeof _types.ConvexDoc;
  type Doc = typeof _types.Doc;
};
