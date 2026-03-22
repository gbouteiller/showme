import type { Auth as Auth_, UserIdentity } from "convex/server";
import { Effect as E, Layer, Option as O, ServiceMap } from "effect";

// CONVEX ----------------------------------------------------------------------------------------------------------------------------------
export class ConvexAuth extends ServiceMap.Service<ConvexAuth, Auth_>()("ConvexAuth") {
  static readonly layer = (auth: Auth_) => Layer.succeed(this, auth);
}

// SERVICE ---------------------------------------------------------------------------------------------------------------------------------
export class Auth extends ServiceMap.Service<Auth>()("Auth", {
  make: E.gen(function* () {
    const auth = yield* ConvexAuth;

    const getUserIdentity = (): E.Effect<O.Option<UserIdentity>> => E.promise(() => auth.getUserIdentity()).pipe(E.map(O.fromNullishOr));

    return { getUserIdentity };
  }),
}) {
  static readonly layer = (auth: Auth_) => Layer.effect(this, this.make).pipe(Layer.provide(ConvexAuth.layer(auth)));
}
