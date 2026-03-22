import { Schema as S, Struct } from "effect";
import { sChannelFields } from "./channels";
import { sCountryDto } from "./dtos";
import { sEpisodeFields } from "./episodes";
import { sShowFields } from "./shows";

// COUNTRIES -------------------------------------------------------------------------------------------------------------------------------
export const sCountryCreate = sCountryDto;

// CHANNELS --------------------------------------------------------------------------------------------------------------------------------
export const sChannelCreate = sChannelFields
  .mapFields(Struct.omit(["countryId"]))
  .pipe(S.fieldsAssign({ country: S.OptionFromNullOr(sCountryCreate) }));

// EPISODES --------------------------  ------------------------------------------------------------------------------------------------------
export const sEpisodeCreate = sEpisodeFields.mapFields(Struct.omit(["showId", "preference"]));

// SHOWS -----------------------------------------------------------------------------------------------------------------------------------
export const sShowCreate = sShowFields
  .mapFields(Struct.omit(["channelId", "preference", "trackEpisodes"]))
  .pipe(S.fieldsAssign({ channel: S.OptionFromNullOr(sChannelCreate) }));

export const sShowWithEpisodesCreate = sShowCreate.pipe(S.fieldsAssign({ episodes: S.Array(sEpisodeCreate) }));
