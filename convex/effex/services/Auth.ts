import type { Auth as Auth_, UserIdentity } from "convex/server";
import { Context, Effect as E, Layer, Option as O } from "effect";

// CONVEX ----------------------------------------------------------------------------------------------------------------------------------
export class ConvexAuth extends Context.Tag("ConvexAuth")<ConvexAuth, Auth_>() {
  static readonly Live = (auth: Auth_) => Layer.succeed(this, auth);
}

// MAKE ------------------------------------------------------------------------------------------------------------------------------------
const make = E.gen(function* () {
  const auth = yield* ConvexAuth;

  const getUserIdentity = (): E.Effect<O.Option<UserIdentity>> => E.promise(() => auth.getUserIdentity()).pipe(E.map(O.fromNullable));

  return { getUserIdentity };
});

// SERVICE ---------------------------------------------------------------------------------------------------------------------------------
export class Auth extends Context.Tag("Auth")<Auth, E.Effect.Success<typeof make>>() {
  static readonly Live = (auth: Auth_) => Layer.effect(this, make).pipe(Layer.provide(ConvexAuth.Live(auth)));
}
