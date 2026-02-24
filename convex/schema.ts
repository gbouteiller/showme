import { defineSchema, defineTable } from "convex/server";
import { Schema as S } from "effect";
import { FIELDS } from "./effex/fields";
import { tableFrom } from "./effex/schemas/validators";

// SCHEMA ----------------------------------------------------------------------------------------------------------------------------------
export default defineSchema({
  casts: defineTable(tableFrom(S.Struct(FIELDS.casts))),
  channels: defineTable(tableFrom(S.Struct(FIELDS.channels))).index("by_api", ["apiId"]),
  characters: defineTable(tableFrom(S.Struct(FIELDS.characters))).index("by_api", ["apiId"]),
  fetcher: defineTable(tableFrom(S.Struct(FIELDS.fetcher))),
  countries: defineTable(tableFrom(S.Struct(FIELDS.countries))).index("by_code", ["code"]),
  episodes: defineTable(tableFrom(S.Struct(FIELDS.episodes)))
    .index("by_api", ["apiId"])
    .index("by_show_and_season", ["showId", "season", "airstamp"])
    .index("by_show", ["showId", "airstamp"]),
  // .index("by_preference_and_unwatched", ["preference", "isWatched", "airstamp"]),
  persons: defineTable(tableFrom(S.Struct(FIELDS.persons))).index("by_api", ["apiId"]),
  shows: defineTable(tableFrom(S.Struct(FIELDS.shows)))
    .index("by_api", ["apiId"])
    // .index("by_rating", ["rating"])
    // .index("by_weight", ["weight"])
    // .index("by_preference_and_name", ["preference", "name"])
    // .index("by_preference_and_rating", ["preference", "rating"])
    // .index("by_preference_and_weight", ["preference", "weight"]),
    .searchIndex("search_name", { searchField: "name" }),
});
