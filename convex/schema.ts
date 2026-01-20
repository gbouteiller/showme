import { defineSchema, defineTable } from "@rjdellecese/confect/server";
import { sCastFields } from "@/schemas/casts";
import { sChannelFields } from "@/schemas/channels";
import { sCharacterFields } from "@/schemas/characters";
import { sCountryFields } from "@/schemas/countries";
import { sEpisodeFields } from "@/schemas/episodes";
import { sFetcherFields } from "@/schemas/fetcher";
import { sPersonFields } from "@/schemas/persons";
import { sShowFields } from "@/schemas/shows";

// SCHEMA ----------------------------------------------------------------------------------------------------------------------------------
export const schema = defineSchema({
  casts: defineTable(sCastFields),
  channels: defineTable(sChannelFields).index("by_api", ["apiId"]),
  characters: defineTable(sCharacterFields).index("by_api", ["apiId"]),
  fetcher: defineTable(sFetcherFields),
  countries: defineTable(sCountryFields).index("by_code", ["code"]),
  episodes: defineTable(sEpisodeFields)
    .index("by_api", ["apiId"])
    .index("by_show_and_season", ["showId", "season", "airstamp"])
    .index("by_show", ["showId", "airstamp"])
    .index("by_unwatched", ["isWatched", "airstamp"]),
  persons: defineTable(sPersonFields).index("by_api", ["apiId"]),
  shows: defineTable(sShowFields)
    .index("by_api", ["apiId"])
    .index("by_rating", ["rating"])
    .index("by_weight", ["weight"])
    .index("by_preference_and_name", ["preference", "name"])
    .index("by_preference_and_rating", ["preference", "rating"])
    .index("by_preference_and_weight", ["preference", "weight"])
    .searchIndex("search_name", { searchField: "name" }),
});
export default schema.convexSchemaDefinition;
