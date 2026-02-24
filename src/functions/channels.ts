import { Array as Arr, Effect as E, HashMap as H, Option as O, pipe } from "effect";
import type { Id } from "@/convex/_generated/dataModel";
import { DatabaseReader } from "@/convex/effex/services/DatabaseReader";
import { DatabaseWriter } from "@/convex/effex/services/DatabaseWriter";
import { optionMapEffect } from "@/convex/effex/utils";
import type { Channels } from "@/schemas/channels";
import type { Shows } from "@/schemas/shows";
import { countryFromDoc } from "./countries";

// TRANSFORMS ------------------------------------------------------------------------------------------------------------------------------
export const channelFromDoc = E.fn(function* (doc: Channels["Doc"]) {
  const db = yield* DatabaseReader;
  const countryDoc = O.flatten(yield* optionMapEffect(doc.countryId, (id) => db.get("countries", id)));
  const country = yield* optionMapEffect(countryDoc, countryFromDoc);
  return { ...doc, country };
});

// CREATE ----------------------------------------------------------------------------------------------------------------------------------
export const createMissingChannels = E.fn(function* (creates: Channels["Create"][], countryIdsByCode: H.HashMap<string, Id<"countries">>) {
  const db = yield* DatabaseWriter;
  return yield* E.forEach(
    creates,
    E.fn(function* ({ country, ...create }) {
      const existing = yield* readChannelByApiId(create);
      const _id = O.isSome(existing)
        ? existing.value._id
        : yield* db.insert("channels", {
            ...create,
            countryId: O.andThen(country, ({ code }) => H.get(countryIdsByCode, code)),
          });
      return [create.apiId, _id] as const;
    })
  ).pipe(E.map(H.fromIterable));
});

// READ ------------------------------------------------------------------------------------------------------------------------------------
export const getDistinctChannels = (dtos: Shows["Create"][]): Channels["Create"][] =>
  pipe(
    dtos,
    Arr.filterMap(({ channel }) => channel),
    Arr.dedupeWith((a, b) => a.apiId === b.apiId)
  );

export const readChannelByApiId = E.fn(function* ({ apiId }: Channels["ApiRef"]) {
  const db = yield* DatabaseReader;
  return yield* db
    .query("channels")
    .withIndex("by_api", (q) => q.eq("apiId", apiId))
    .first();
});
