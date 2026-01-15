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
    .index("by_favorites_and_name", ["isFavorite", "name"])
    .index("by_favorites_and_rating", ["isFavorite", "rating"])
    .index("by_favorites_and_weight", ["isFavorite", "weight"])
    .index("by_weight", ["weight"]),
});
export default schema.convexSchemaDefinition;
