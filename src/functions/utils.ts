import type { Bounds, TableAggregate, TableAggregateType } from "@convex-dev/aggregate";
import type { Value as V } from "convex/values";
import { Array as Arr, Effect as E, Option as O } from "effect";
import type { Simplify } from "effect/Types";
import type { DataModel, Id, TableNames } from "@/convex/_generated/dataModel";
import { AggregateAtError, AggregateCountError, AggregatePaginateError } from "@/convex/effex/errors";
import { DatabaseReader } from "@/convex/effex/services/DatabaseReader";
import { ConvexQueryCtx } from "@/convex/effex/services/QueryCtx";

export const readPaginated = E.fn(function* <TN extends TableNames, K extends V, N extends V | undefined>(
  props: ReadPaginatedProps<TN, K, N>
) {
  const { aggregate, opts, pageIndex = 0, pageSize = 10, table } = props;
  const total = yield* count({ aggregate, opts });
  const cursor = yield* at({ aggregate, offset: pageIndex * pageSize - 1, opts });
  return { total, ...(yield* paginate({ aggregate, opts: { ...opts, cursor, pageSize }, table })) };
});

export const at = E.fn(function* <TN extends TableNames, K extends V, N extends V | undefined>(props: AtProps<TN, K, N>) {
  const { aggregate, offset, opts } = props;
  const ctx = yield* ConvexQueryCtx;
  if (offset < 0) return undefined;
  return yield* E.tryPromise({
    try: () => aggregate.at(ctx, offset, opts),
    catch: (cause) => new AggregateAtError({ cause, offset }),
  }).pipe(E.map(({ id, key }) => `[${Arr.isArray(key) ? `[""${key.map((k) => `, ${k}, ""`).join("")}]` : key},"${id}",""]`));
});

export const count = E.fn(function* <TN extends TableNames, K extends V, N extends V | undefined>(props: CountProps<TN, K, N>) {
  const { aggregate, opts } = props;
  const ctx = yield* ConvexQueryCtx;
  return yield* E.tryPromise({ try: () => aggregate.count(ctx, opts), catch: (cause) => new AggregateCountError({ cause }) });
});

export const paginate = E.fn(function* <TN extends TableNames, K extends V, N extends V | undefined>(props: PaginateProps<TN, K, N>) {
  const { aggregate, opts, table } = props;
  const ctx = yield* ConvexQueryCtx;
  const db = yield* DatabaseReader;
  const { cursor, isDone, page } = yield* E.tryPromise({
    try: () => aggregate.paginate(ctx, opts),
    catch: (cause) => new AggregatePaginateError({ cause }),
  });
  return { cursor, isDone, page: yield* E.all(page.map(({ id }) => db.get(table, id).pipe(E.map(O.getOrThrow)))) };
});

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
export type TAT<TN extends TableNames, K extends V, N extends V | undefined> = TableAggregateType<K, DataModel, TN, N>;

type AtOpts<TN extends TableNames, K extends V, N extends V | undefined> = {
  bounds?: Bounds<K, Id<TN>>;
  namespace: "Namespace" extends keyof TAT<TN, K, N> ? N : undefined;
};

type AtProps<TN extends TableNames, K extends V, N extends V | undefined> = {
  aggregate: TableAggregate<TAT<TN, K, N>>;
  offset: number;
  opts: AtOpts<TN, K, N>;
};

type CountOpts<TN extends TableNames, K extends V, N extends V | undefined> = AtOpts<TN, K, N>;

type CountProps<TN extends TableNames, K extends V, N extends V | undefined> = {
  aggregate: TableAggregate<TAT<TN, K, N>>;
  opts: CountOpts<TN, K, N>;
};

export type PaginateOpts<TN extends TableNames, K extends V, N extends V | undefined> = Simplify<
  AtOpts<TN, K, N> & {
    cursor?: string;
    order?: "asc" | "desc";
    pageSize?: number;
  }
>;

type PaginateProps<TN extends TableNames, K extends V, N extends V | undefined> = {
  aggregate: TableAggregate<TAT<TN, K, N>>;
  opts: PaginateOpts<TN, K, N>;
  table: TN;
};

export type ReadPaginatedProps<TN extends TableNames, K extends V, N extends V | undefined> = {
  aggregate: TableAggregate<TAT<TN, K, N>>;
  opts: PaginateOpts<TN, K, N>;
  pageIndex?: number;
  pageSize?: number;
  table: TN;
};
