import { Array as Arr, Effect as E, HashMap as H, Option as O, pipe, Tuple } from "effect";
import { DatabaseReader } from "@/convex/effex/services/DatabaseReader";
import { DatabaseWriter } from "@/convex/effex/services/DatabaseWriter";
import type { Countries } from "@/schemas/countries";
import type { Shows } from "@/schemas/shows";

// TRANSFORMS ------------------------------------------------------------------------------------------------------------------------------
export const countryFromDoc = (doc: Countries["Doc"]) => E.succeed(doc);

// CREATE ----------------------------------------------------------------------------------------------------------------------------------
export const getOrCreateCountries = (creates: Countries["Create"][]) =>
  E.forEach(creates, (create) => getOrCreateCountry(create).pipe(E.map((id) => Tuple.make(create.code, id))), { concurrency: 8 }).pipe(
    E.map(H.fromIterable)
  );

export const getOrCreateCountry = E.fn(function* (create: Countries["Create"]) {
  const db = yield* DatabaseWriter;
  const existing = yield* readCountryByCode(create.code);
  return O.isSome(existing) ? existing.value._id : yield* db.insert("countries", create);
});

// READ ------------------------------------------------------------------------------------------------------------------------------------
export const getDistinctCountriesFromShows = (dtos: Shows["Create"][]): Countries["Create"][] =>
  pipe(
    dtos,
    Arr.flatMap(({ channel }) => O.toArray(O.andThen(channel, ({ country }) => country))),
    Arr.dedupeWith((a, b) => a.code === b.code)
  );

export const lookupCountryId = (country: O.Option<Countries["Create"]>, countryIds: Countries["Set"]) =>
  O.andThen(country, ({ code }) => H.get(countryIds, code));

export const readCountryByCode = E.fn(function* (code: Countries["Code"]) {
  const db = yield* DatabaseReader;
  return yield* db
    .query("countries")
    .withIndex("by_code", (q) => q.eq("code", code))
    .first();
});
