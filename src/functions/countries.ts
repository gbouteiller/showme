import { Effect as E, Option as O } from "effect";
import type { ParseError } from "effect/ParseResult";
import type { Id } from "@/convex/_generated/dataModel";
import type { MutationCtx, QueryCtx } from "@/convex/confect";
import type { Countries } from "@/schemas/countries";

// TRANSFORMS ------------------------------------------------------------------------------------------------------------------------------
export function countryFromDoc(_db: Pick<QueryCtx["db"], "get">) {
  return (doc: Countries["Doc"]): E.Effect<Countries["Entry"]> => E.succeed(doc);
}

// CREATE ----------------------------------------------------------------------------------------------------------------------------------
export function createMissingCountry(db: MutationCtx["db"]) {
  return (dto: Countries["Create"]): E.Effect<Id<"countries">, ParseError> =>
    E.gen(function* () {
      const country = yield* readCountryByCode(db)(dto);
      if (O.isSome(country)) return country.value._id;
      return yield* db.insert("countries", dto);
    });
}

// READ ------------------------------------------------------------------------------------------------------------------------------------
export function readCountryByCode(db: Pick<QueryCtx["db"], "query">) {
  return ({ code }: Countries["ApiRef"]): E.Effect<O.Option<Countries["Doc"]>> =>
    db
      .query("countries")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();
}
