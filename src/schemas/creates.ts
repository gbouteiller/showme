import { Schema as S } from "effect";
import { sChannelFields } from "./channels";
import { sCountryDto } from "./dtos";
import { sEpisodeFields } from "./episodes";
import { sShowFields } from "./shows";

// COUNTRIES -------------------------------------------------------------------------------------------------------------------------------
export const sCountryCreate = sCountryDto;

// CHANNELS --------------------------------------------------------------------------------------------------------------------------------
export const sChannelCreate = S.Struct({
  ...sChannelFields.omit("countryId").fields,
  country: S.OptionFromNullOr(sCountryCreate),
});

// EPISODES --------------------------------------------------------------------------------------------------------------------------------
export const sEpisodeCreate = sEpisodeFields.omit("showId", "preference");

// SHOWS -----------------------------------------------------------------------------------------------------------------------------------
export const sShowCreate = S.Struct({
  ...sShowFields.omit("channelId", "preference", "trackEpisodes").fields,
  channel: S.OptionFromNullOr(sChannelCreate),
});

export const sShowWithEpisodesCreate = S.Struct({
  ...sShowCreate.fields,
  episodes: S.Array(sEpisodeCreate),
});
