import { Schema as S } from "effect";

// ID --------------------------------------------------------------------------------------------------------------------------------------
export const sApiId = S.Int;
export type ApiId = typeof sApiId.Type;

// COUNTRY ---------------------------------------------------------------------------------------------------------------------------------
export const sApiCountryDto = S.Struct({
  code: S.String,
  name: S.String,
  timezone: S.String,
});

// EXTERNALS -------------------------------------------------------------------------------------------------------------------------------
export const sApiExternalsDto = S.Struct({
  imdb: S.NullOr(S.String),
  thetvdb: S.NullOr(S.Int),
  tvrage: S.NullOr(S.Int),
});

// IMAGE -----------------------------------------------------------------------------------------------------------------------------------
export const sApiImageDto = S.Struct({
  medium: S.String,
  original: S.String,
});

// LINK ------------------------------------------------------------------------------------------------------------------------------------
export const sApiLinkDto = S.Struct({
  href: S.String,
  name: S.optional(S.NullOr(S.String)),
});

// CHANNEL ---------------------------------------------------------------------------------------------------------------------------------
export const sApiChannelDto = S.Struct({
  country: S.NullOr(sApiCountryDto),
  id: S.Int,
  name: S.String,
  officialSite: S.NullOr(S.String),
});

// RATING ----------------------------------------------------------------------------------------------------------------------------------
export const sApiRatingDto = S.Struct({
  average: S.NullOr(S.Number),
});

// SCHEDULE --------------------------------------------------------------------------------------------------------------------------------
export const sApiScheduleDto = S.Struct({
  days: S.Array(S.String),
  time: S.String,
});

// CHARACTER -------------------------------------------------------------------------------------------------------------------------------
export const sApiCharacterDto = S.Struct({
  _links: S.Struct({
    self: sApiLinkDto,
  }),
  id: S.Int,
  image: S.NullOr(sApiImageDto),
  name: S.String,
  url: S.String,
});

// PERSON ----------------------------------------------------------------------------------------------------------------------------------
export const sApiPersonDto = S.Struct({
  _links: S.Struct({
    self: sApiLinkDto,
  }),
  birthday: S.NullOr(S.String),
  country: S.NullOr(sApiCountryDto),
  deathday: S.NullOr(S.String),
  gender: S.NullOr(S.String),
  id: S.Int,
  image: S.NullOr(sApiImageDto),
  name: S.String,
  updated: S.NullOr(S.Int),
  url: S.String,
});

// CAST ------------------------------------------------------------------------------------------------------------------------------------
export const sApiCastDto = S.Struct({
  character: sApiCharacterDto,
  person: sApiPersonDto,
  self: S.Boolean,
  voice: S.Boolean,
});

// CREW ------------------------------------------------------------------------------------------------------------------------------------
export const sApiCrewDto = S.Struct({
  person: sApiPersonDto,
  type: S.String,
});

// EPISODE ---------------------------------------------------------------------------------------------------------------------------------
export const sApiEpisodeDto = S.Struct({
  _links: S.Struct({
    self: sApiLinkDto,
    show: S.NullOr(sApiLinkDto),
  }),
  airdate: S.String,
  airstamp: S.NullOr(S.String),
  airtime: S.String,
  id: S.Int,
  image: S.NullOr(sApiImageDto),
  name: S.String,
  number: S.NullOr(S.Int),
  rating: sApiRatingDto,
  runtime: S.NullOr(S.Int),
  season: S.Int,
  summary: S.NullOr(S.String),
  type: S.String,
  url: S.String,
});

// SEASON ----------------------------------------------------------------------------------------------------------------------------------
export const sApiSeasonDto = S.Struct({
  _links: S.Struct({
    self: sApiLinkDto,
  }),
  endDate: S.NullOr(S.String),
  episodeOrder: S.NullOr(S.Int),
  id: S.Int,
  image: S.NullOr(sApiImageDto),
  name: S.String,
  network: S.NullOr(sApiChannelDto),
  number: S.Int,
  premiereDate: S.NullOr(S.String),
  summary: S.NullOr(S.String),
  url: S.String,
  webChannel: S.NullOr(sApiChannelDto),
});

// SHOW ------------------------------------------------------------------------------------------------------------------------------------
export const sApiShowDto = S.Struct({
  _embedded: S.NullishOr(
    S.Struct({
      cast: S.optional(S.NullOr(S.Array(sApiCastDto))),
      crew: S.optional(S.NullOr(S.Array(sApiCrewDto))),
      episodes: S.optional(S.NullOr(S.Array(sApiEpisodeDto))),
      seasons: S.optional(S.NullOr(S.Array(sApiSeasonDto))),
    })
  ),
  _links: S.Struct({
    nextepisode: S.optional(S.NullOr(sApiLinkDto)),
    previousepisode: S.optional(S.NullOr(sApiLinkDto)),
    self: sApiLinkDto,
  }),
  averageRuntime: S.NullOr(S.Int),
  dvdCountry: S.NullOr(sApiCountryDto),
  ended: S.NullOr(S.String),
  externals: sApiExternalsDto,
  genres: S.Array(S.String),
  id: S.Int,
  image: S.NullOr(sApiImageDto),
  language: S.NullOr(S.String),
  name: S.String,
  network: S.NullOr(sApiChannelDto),
  officialSite: S.NullOr(S.String),
  premiered: S.NullOr(S.String),
  rating: sApiRatingDto,
  runtime: S.NullOr(S.Int),
  schedule: sApiScheduleDto,
  status: S.Literals(["Ended", "In Development", "Running", "To Be Determined"]),
  summary: S.NullOr(S.String),
  type: S.String,
  updated: S.Int,
  url: S.String,
  webChannel: S.NullOr(sApiChannelDto),
  weight: S.Int,
});

// PEOPLE SEARCH RESULT --------------------------------------------------------------------------------------------------------------------
export const sApiPeopleSearchResultDto = S.Struct({
  person: sApiPersonDto,
  score: S.Number,
});

// SHOW SEARCH RESULT ----------------------------------------------------------------------------------------------------------------------
export const sApiShowSearchResultDto = S.Struct({
  score: S.Number,
  show: sApiShowDto,
});

// SCHEDULE ITEM ---------------------------------------------------------------------------------------------------------------------------
export const sApiScheduleItemDto = S.Struct({
  _links: S.Struct({
    self: sApiLinkDto,
    show: S.NullOr(sApiLinkDto),
  }),
  airdate: S.String,
  airstamp: S.DateTimeUtc,
  airtime: S.String,
  id: S.Int,
  image: S.NullOr(sApiImageDto),
  name: S.String,
  number: S.NullOr(S.Int),
  rating: sApiRatingDto,
  runtime: S.NullOr(S.Int),
  season: S.Int,
  show: sApiShowDto,
  summary: S.NullOr(S.String),
  type: S.String,
  url: S.String,
});
