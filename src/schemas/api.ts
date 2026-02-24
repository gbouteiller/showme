import { Schema as S } from "effect";

// COUNTRY ---------------------------------------------------------------------------------------------------------------------------------
export const sApiCountryDto = S.Struct({
  code: S.String,
  name: S.String,
  timezone: S.String,
});

// EXTERNALS -------------------------------------------------------------------------------------------------------------------------------
export const sApiExternalsDto = S.Struct({
  imdb: S.NullOr(S.String),
  thetvdb: S.NullOr(S.NonNegativeInt),
  tvrage: S.NullOr(S.NonNegativeInt),
});

// IMAGE -----------------------------------------------------------------------------------------------------------------------------------
export const sApiImageDto = S.Struct({
  medium: S.String,
  original: S.String,
});

// LINK ------------------------------------------------------------------------------------------------------------------------------------
export const sApiLinkDto = S.Struct({
  href: S.String,
  name: S.NullOr(S.String),
});

// CHANNEL ---------------------------------------------------------------------------------------------------------------------------------
export const sApiChannelDto = S.Struct({
  country: S.NullOr(sApiCountryDto),
  id: S.NonNegativeInt,
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
  id: S.NonNegativeInt,
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
  id: S.NonNegativeInt,
  image: S.NullOr(sApiImageDto),
  name: S.String,
  updated: S.NullOr(S.NonNegativeInt),
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
  airstamp: S.String,
  airtime: S.String,
  id: S.NonNegativeInt,
  image: S.NullOr(sApiImageDto),
  name: S.String,
  number: S.NullOr(S.NonNegativeInt),
  rating: sApiRatingDto,
  runtime: S.NullOr(S.NonNegativeInt),
  season: S.NonNegativeInt,
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
  episodeOrder: S.NullOr(S.NonNegativeInt),
  id: S.NonNegativeInt,
  image: S.NullOr(sApiImageDto),
  name: S.String,
  network: S.NullOr(sApiChannelDto),
  number: S.NonNegativeInt,
  premiereDate: S.NullOr(S.String),
  summary: S.NullOr(S.String),
  url: S.String,
  webChannel: S.NullOr(sApiChannelDto),
});

// SHOW ------------------------------------------------------------------------------------------------------------------------------------
export const sApiShowDto = S.Struct({
  _embedded: S.NullOr(
    S.Struct({
      cast: S.NullOr(S.Array(sApiCastDto)),
      crew: S.NullOr(S.Array(sApiCrewDto)),
      episodes: S.NullOr(S.Array(sApiEpisodeDto)),
      seasons: S.NullOr(S.Array(sApiSeasonDto)),
    })
  ),
  _links: S.Struct({
    nextepisode: S.NullOr(sApiLinkDto),
    previousepisode: S.NullOr(sApiLinkDto),
    self: sApiLinkDto,
  }),
  averageRuntime: S.NullOr(S.NonNegativeInt),
  dvdCountry: S.NullOr(sApiCountryDto),
  ended: S.NullOr(S.String),
  externals: sApiExternalsDto,
  genres: S.Array(S.String),
  id: S.NonNegativeInt,
  image: S.NullOr(sApiImageDto),
  language: S.NullOr(S.String),
  name: S.String,
  network: S.NullOr(sApiChannelDto),
  officialSite: S.NullOr(S.String),
  premiered: S.NullOr(S.String),
  rating: sApiRatingDto,
  runtime: S.NullOr(S.NonNegativeInt),
  schedule: sApiScheduleDto,
  status: S.Literal("Ended", "In Development", "Running", "To Be Determined"),
  summary: S.NullOr(S.String),
  type: S.String,
  updated: S.NonNegativeInt,
  url: S.String,
  webChannel: S.NullOr(sApiChannelDto),
  weight: S.NonNegativeInt,
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
  id: S.NonNegativeInt,
  image: S.NullOr(sApiImageDto),
  name: S.String,
  number: S.NullOr(S.NonNegativeInt),
  rating: sApiRatingDto,
  runtime: S.NullOr(S.NonNegativeInt),
  season: S.NonNegativeInt,
  show: sApiShowDto,
  summary: S.NullOr(S.String),
  type: S.String,
  url: S.String,
});
