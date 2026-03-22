import { Effect as E, Option as O, pipe, Schema as S } from "effect";
import { dual } from "effect/Function";

// CORE ------------------------------------------------------------------------------------------------------------------------------------
export const optionMapEffect: {
  <A, B, E1, R1>(f: (a: A) => E.Effect<B, E1, R1>): (self: O.Option<A>) => E.Effect<O.Option<B>, E1, R1>;
  <A, B, E1, R1>(self: O.Option<A>, f: (a: A) => E.Effect<B, E1, R1>): E.Effect<O.Option<B>, E1, R1>;
} = dual(2, <A, B, E1, R1>(self: O.Option<A>, f: (a: A) => E.Effect<B, E1, R1>): E.Effect<O.Option<B>, E1, R1> => {
  return O.match(self, {
    onNone: () => E.succeed(O.none<B>()),
    onSome: (a: A) => pipe(f(a), E.map(O.some)),
  });
});

// PAGINATION ------------------------------------------------------------------------------------------------------------------------------
export const sPaginated = <A, E, R>(schema: S.Codec<A, E, R>) => S.Struct({ items: S.Array(schema), total: S.Int });
export const sPagination = S.Struct({ pageIndex: S.Int, pageSize: S.Int });
export const sPaginationWith = <F extends S.Struct.Fields>(fields: F) => sPagination.pipe(S.fieldsAssign(fields));

// TYPES -----------------------------------------------------------------------------------------------------------------------------------
export type Paginated<A, E, R> = S.Schema.Type<ReturnType<typeof sPaginated<A, E, R>>>;
export type Pagination = S.Schema.Type<typeof sPagination>;
export type PaginationWith<F extends S.Struct.Fields> = S.Schema.Type<ReturnType<typeof sPaginationWith<F>>>;
