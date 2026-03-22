import { Schema as S, SchemaGetter, Struct } from "effect";
import { sApiChannelDto, sApiCountryDto, sApiEpisodeDto, sApiPersonDto, sApiShowDto } from "./api";
import { sEpisodeFields } from "./episodes";
import { sShowRevision } from "./shows";

// CHANNELS --------------------------------------------------------------------------------------------------------------------------------
const sChannelDtoFrom = sApiChannelDto;
const sChannelDtoTo = sChannelDtoFrom.mapFields(Struct.renameKeys({ id: "apiId" }));

export const sChannelDto = sChannelDtoFrom.pipe(
  S.decodeTo(sChannelDtoTo, {
    decode: SchemaGetter.transform(({ id, ...rest }) => ({ ...rest, apiId: id })),
    encode: SchemaGetter.forbidden(() => "Forbidden."),
  })
);

// COUNTRIES -------------------------------------------------------------------------------------------------------------------------------
export const sCountryDto = sApiCountryDto.mapFields(Struct.pick(["code", "name", "timezone"]));

// EPISODES --------------------------------------------------------------------------------------------------------------------------------
const sEpisodeDtoFrom = sApiEpisodeDto.mapFields(Struct.omit(["_links", "type", "url"]));
const sEpisodeDtoTo = sEpisodeDtoFrom
  .mapFields(Struct.renameKeys({ id: "apiId" }))
  .mapFields(Struct.evolve({ image: () => S.NullOr(S.String), rating: () => S.NullOr(S.Number) }))
  .mapFields(Struct.assign({ isWatched: sEpisodeFields.fields.isWatched, thumbnail: S.NullOr(S.String) }));

export const sEpisodeDto = sEpisodeDtoFrom.pipe(
  S.decodeTo(sEpisodeDtoTo, {
    decode: SchemaGetter.transform(({ id: apiId, image, rating, ...rest }) => ({
      ...rest,
      apiId,
      image: image?.original ?? null,
      isWatched: false,
      rating: rating.average ?? null,
      thumbnail: image?.medium ?? null,
    })),
    encode: SchemaGetter.forbidden(() => "Forbidden."),
  })
);

// PERSONS ---------------------------------------------------------------------------------------------------------------------------------
export const sPersonDto = sApiPersonDto.mapFields(Struct.pick(["birthday", "deathday", "gender", "id", "image", "name", "updated"]));

// SHOWS -----------------------------------------------------------------------------------------------------------------------------------
const toOmit = ["_links", "averageRuntime", "dvdCountry", "externals", "language", "runtime", "schedule", "type", "url"] as const;
type ApiShowBaseDto = Omit<typeof sApiShowDto.Type, (typeof toOmit)[number] | "_embedded">;

const showBaseFromApi = ({ id: apiId, image, network, rating, webChannel, ...rest }: ApiShowBaseDto) => ({
  ...rest,
  apiId,
  channel: webChannel ?? network,
  image: image?.original ?? null,
  rating: rating.average ?? 0,
  thumbnail: image?.medium ?? null,
});

const sShowDtoFrom = sApiShowDto.mapFields(Struct.omit([...toOmit, "_embedded"]));
const sShowDtoTo = sShowDtoFrom
  .mapFields(Struct.omit(["network", "webChannel"]))
  .mapFields(Struct.renameKeys({ id: "apiId" }))
  .mapFields(Struct.evolve({ image: () => S.NullOr(S.String), rating: () => S.Number }))
  .mapFields(Struct.assign({ channel: S.NullOr(sChannelDto), thumbnail: S.NullOr(S.String) }));

export const sShowDto = sShowDtoFrom.pipe(
  S.decodeTo(sShowDtoTo, {
    decode: SchemaGetter.transform(showBaseFromApi),
    encode: SchemaGetter.forbidden(() => "Forbidden."),
  })
);

const sShowWithEpisodesDtoFrom = sApiShowDto.mapFields(Struct.omit([...toOmit]));
const sShowWithEpisodesDtoTo = sShowDtoTo.pipe(S.fieldsAssign({ episodes: S.Array(sEpisodeDto) }));

export const sShowWithEpisodesDto = sShowWithEpisodesDtoFrom.pipe(
  S.decodeTo(sShowWithEpisodesDtoTo, {
    decode: SchemaGetter.transform(({ _embedded, ...show }) => ({ ...showBaseFromApi(show), episodes: _embedded?.episodes ?? [] })),
    encode: SchemaGetter.forbidden(() => "Forbidden."),
  })
);

const sShowRevisionDtosFrom = S.Record(S.String, S.Int);
const sShowRevisionDtosTo = S.Array(sShowRevision);

export const sShowRevisionDtos = sShowRevisionDtosFrom.pipe(
  S.decodeTo(sShowRevisionDtosTo, {
    decode: SchemaGetter.transform((updates) => Object.entries({ ...updates }).map(([key, value]) => ({ apiId: +key, updated: value }))),
    encode: SchemaGetter.forbidden(() => "Forbidden."),
  })
);
