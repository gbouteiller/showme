import { defineSchema, defineTable } from "convex/server";
import { Schema as S } from "effect";
import { FIELDS } from "./effex/fields";
import { convexSchemaFrom } from "./effex/schemas";

// SCHEMA ----------------------------------------------------------------------------------------------------------------------------------
export default defineSchema({
  casts: defineTable(convexSchemaFrom(S.Struct(FIELDS.casts))),
  channels: defineTable(convexSchemaFrom(S.Struct(FIELDS.channels))).index("by_api", ["apiId"]),
  characters: defineTable(convexSchemaFrom(S.Struct(FIELDS.characters))).index("by_api", ["apiId"]),
  fetcher: defineTable(convexSchemaFrom(S.Struct(FIELDS.fetcher))),
  countries: defineTable(convexSchemaFrom(S.Struct(FIELDS.countries))).index("by_code", ["code"]),
  episodes: defineTable(convexSchemaFrom(S.Struct(FIELDS.episodes)))
    .index("by_api", ["apiId"])
    .index("by_show_and_season", ["showId", "season", "airstamp"])
    .index("by_show", ["showId", "airstamp"]),
  // .index("by_preference_and_unwatched", ["preference", "isWatched", "airstamp"]),
  persons: defineTable(convexSchemaFrom(S.Struct(FIELDS.persons))).index("by_api", ["apiId"]),
  shows: defineTable(convexSchemaFrom(S.Struct(FIELDS.shows)))
    .index("by_api", ["apiId"])
    // .index("by_rating", ["rating"])
    // .index("by_weight", ["weight"])
    // .index("by_preference_and_name", ["preference", "name"])
    // .index("by_preference_and_rating", ["preference", "rating"])
    // .index("by_preference_and_weight", ["preference", "weight"]),
    .searchIndex("search_name", { searchField: "name" }),
});
