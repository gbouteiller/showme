import { Effect as E, Option as O, pipe } from "effect";
import { dual } from "effect/Function";

export const optionMapEffect: {
  <A, B, E1, R1>(f: (a: A) => E.Effect<B, E1, R1>): (self: O.Option<A>) => E.Effect<O.Option<B>, E1, R1>;
  <A, B, E1, R1>(self: O.Option<A>, f: (a: A) => E.Effect<B, E1, R1>): E.Effect<O.Option<B>, E1, R1>;
} = dual(2, <A, B, E1, R1>(self: O.Option<A>, f: (a: A) => E.Effect<B, E1, R1>): E.Effect<O.Option<B>, E1, R1> => {
  return O.match(self, {
    onNone: () => E.succeed(O.none<B>()),
    onSome: (a: A) => pipe(f(a), E.map(O.some)),
  });
});
