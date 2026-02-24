import { Array as Arr, Effect as E, HashMap, Option as O, pipe } from "effect";
import { DatabaseReader } from "@/convex/effex/services/DatabaseReader";
import { DatabaseWriter } from "@/convex/effex/services/DatabaseWriter";
import type { Countries } from "@/schemas/countries";
import type { Shows } from "@/schemas/shows";

// TRANSFORMS ------------------------------------------------------------------------------------------------------------------------------
export const countryFromDoc = (doc: Countries["Doc"]) => E.succeed(doc);

// CREATE ----------------------------------------------------------------------------------------------------------------------------------
export const createMissingCountries = E.fn(function* (creates: Countries["Create"][]) {
  const db = yield* DatabaseWriter;

  return yield* E.forEach(
    creates,
    E.fn(function* (create) {
      const existing = yield* readCountryByCode(create);
      return [create.code, O.isSome(existing) ? existing.value._id : yield* db.insert("countries", create)] as const;
    })
  ).pipe(E.map(HashMap.fromIterable));
});

// READ ------------------------------------------------------------------------------------------------------------------------------------
export const getDistinctCountries = (dtos: Shows["Create"][]): Countries["Create"][] =>
  pipe(
    dtos,
    Arr.filterMap(({ channel }) => O.andThen(channel, ({ country }) => country)),
    Arr.dedupeWith((a, b) => a.code === b.code)
  );

export const readCountryByCode = E.fn(function* ({ code }: Countries["ApiRef"]) {
  const db = yield* DatabaseReader;
  return yield* db
    .query("countries")
    .withIndex("by_code", (q) => q.eq("code", code))
    .first();
});
