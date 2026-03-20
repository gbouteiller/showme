import { FetchHttpClient, HttpClient, HttpClientRequest } from "@effect/platform";
import { Effect as E, flow, Schema as S } from "effect";
import { filterValidEpisodes } from "@/functions/episodes";
import { sEpisodeDto, sShowDto, sShowRevisionDtos, sShowWithEpisodesDto } from "@/schemas/dtos";

export class TvMaze extends E.Service<TvMaze>()("TvMaze", {
  dependencies: [FetchHttpClient.layer],
  effect: E.gen(function* () {
    const baseClient = yield* HttpClient.HttpClient;
    const client = baseClient.pipe(
      HttpClient.mapRequest(flow(HttpClientRequest.prependUrl("https://api.tvmaze.com"), HttpClientRequest.acceptJson))
    );

    const fetchDailyShowRevisions = E.fn(function* () {
      const { json } = yield* client.get("/updates/shows");
      return yield* S.decodeUnknown(sShowRevisionDtos)(yield* json);
    });

    const fetchShow = E.fn(function* (showId: number) {
      const { json } = yield* client.get(`/shows/${showId}`);
      return yield* S.decodeUnknown(sShowDto)(yield* json);
    });

    const fetchShowWithEpisodes = E.fn(function* (showId: number) {
      const { json } = yield* client.get(`/shows/${showId}?embed=episodes`);
      const show = yield* S.decodeUnknown(sShowWithEpisodesDto)(yield* json);
      return { ...show, episodes: filterValidEpisodes(show.episodes) };
    });

    const fetchShows = E.fn(function* (page = 1) {
      const { json } = yield* client.get(`/shows?page=${page}`);
      return yield* S.decodeUnknown(S.mutable(S.Array(sShowDto)))(yield* json);
    });

    const fetchShowEpisodes = E.fn(function* (showId: number) {
      const { json } = yield* client.get(`/shows/${showId}/episodes`);
      const episodes = yield* S.decodeUnknown(S.mutable(S.Array(sEpisodeDto)))(yield* json);
      return filterValidEpisodes(episodes);
    });

    return { fetchDailyShowRevisions, fetchShow, fetchShowWithEpisodes, fetchShows, fetchShowEpisodes };
  }),
}) {}
