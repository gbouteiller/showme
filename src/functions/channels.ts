import { Array as Arr, Effect as E, HashMap as H, Option as O, pipe, Tuple } from "effect";
import { DatabaseReader } from "@/convex/effex/services/DatabaseReader";
import { DatabaseWriter } from "@/convex/effex/services/DatabaseWriter";
import { optionMapEffect } from "@/convex/effex/utils";
import type { Channels } from "@/schemas/channels";
import type { Countries } from "@/schemas/countries";
import type { Shows } from "@/schemas/shows";
import { countryFromDoc, getOrCreateCountry, lookupCountryId } from "./countries";

// TRANSFORMS ------------------------------------------------------------------------------------------------------------------------------
export const channelFromDoc = E.fn(function* (doc: Channels["Doc"]) {
  const db = yield* DatabaseReader;
  const countryDoc = O.flatten(yield* optionMapEffect(doc.countryId, (id) => db.get("countries", id)));
  const country = yield* optionMapEffect(countryDoc, countryFromDoc);
  return { ...doc, country };
});

// CREATE ----------------------------------------------------------------------------------------------------------------------------------
export const getOrCreateChannel = E.fn(function* ({ country, ...create }: Channels["Create"], { countryIds }: GetOrCreateChannelOpts = {}) {
  const db = yield* DatabaseWriter;
  const existing = yield* readChannelByApiId(create.apiId);
  if (O.isSome(existing)) return existing.value._id;
  const countryId = countryIds ? lookupCountryId(country, countryIds) : yield* optionMapEffect(country, getOrCreateCountry);
  return yield* db.insert("channels", { ...create, countryId });
});
type GetOrCreateChannelOpts = { countryIds?: Countries["Set"] };

export const getOrCreateChannels = (creates: Channels["Create"][], opts: GetOrCreateChannelsOpts = {}) =>
  E.forEach(creates, (create) => getOrCreateChannel(create, opts).pipe(E.map((id) => Tuple.make(create.apiId, id)))).pipe(
    E.map(H.fromIterable)
  );
type GetOrCreateChannelsOpts = { countryIds?: Countries["Set"] };

// READ ------------------------------------------------------------------------------------------------------------------------------------
export const getDistinctChannelsFromShows = (dtos: Shows["Create"][]): Channels["Create"][] =>
  pipe(
    dtos,
    Arr.flatMap(({ channel }) => O.toArray(channel)),
    Arr.dedupeWith((a, b) => a.apiId === b.apiId)
  );

export const lookupChannelId = (channel: O.Option<Channels["Create"]>, channelIds: Channels["Set"]) =>
  O.andThen(channel, ({ apiId }) => H.get(channelIds, apiId));

export const readChannelByApiId = E.fn(function* (apiId: Channels["ApiId"]) {
  const db = yield* DatabaseReader;
  return yield* db
    .query("channels")
    .withIndex("by_api", (q) => q.eq("apiId", apiId))
    .first();
});
