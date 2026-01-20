import { Effect as E, Option as O } from "effect";
import type { ParseError } from "effect/ParseResult";
import type { Id } from "@/convex/_generated/dataModel";
import type { MutationCtx, QueryCtx } from "@/convex/confect";
import { optionMapEffect } from "@/lib/effect";
import type { Channels } from "@/schemas/channels";
import { countryFromDoc, createMissingCountry } from "./countries";

// TRANSFORMS ------------------------------------------------------------------------------------------------------------------------------
export function channelFromDoc(db: Pick<QueryCtx["db"], "get">) {
  return E.fn(function* (doc: Channels["Doc"]) {
    const countryDoc = O.flatten(yield* optionMapEffect(doc.countryId, (id) => db.get(id)));
    const country = yield* optionMapEffect(countryDoc, countryFromDoc(db));
    return { ...doc, country };
  });
}

// CREATE ----------------------------------------------------------------------------------------------------------------------------------
export function createMissingChannel(db: MutationCtx["db"]) {
  return E.fn(function* ({ country, ...rest }: Channels["Create"]): E.fn.Return<Id<"channels">, ParseError> {
    const channel = yield* readChannelByApiId(db)(rest);
    if (O.isSome(channel)) return channel.value._id;
    const countryId = yield* optionMapEffect(country, createMissingCountry(db));
    return yield* db.insert("channels", { ...rest, countryId });
  });
}

// READ ------------------------------------------------------------------------------------------------------------------------------------
export function readChannelByApiId(db: Pick<QueryCtx["db"], "query">) {
  return ({ apiId }: Channels["ApiRef"]): E.Effect<O.Option<Channels["Doc"]>> =>
    db
      .query("channels")
      .withIndex("by_api", (q) => q.eq("apiId", apiId))
      .first();
}
