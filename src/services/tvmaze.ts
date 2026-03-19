import { FetchHttpClient, HttpClient, HttpClientRequest } from "@effect/platform";
import { Effect, flow, Schema as S } from "effect";
import { sEpisodeDto, sShowDto, sShowUpdatesDto } from "@/schemas/dtos";

export class TvMaze extends Effect.Service<TvMaze>()("TvMaze", {
  dependencies: [FetchHttpClient.layer],
  effect: Effect.gen(function* () {
    const baseClient = yield* HttpClient.HttpClient;
    const client = baseClient.pipe(
      HttpClient.mapRequest(flow(HttpClientRequest.prependUrl("https://api.tvmaze.com"), HttpClientRequest.acceptJson))
    );

    const fetchShow = (showId: number) =>
      client.get(`/shows/${showId}?embed=episodes`).pipe(
        Effect.flatMap(({ json }) => json),
        Effect.map(S.decodeUnknownSync(sShowDto))
      );

    const fetchShows = (page = 1) =>
      client.get(`/shows?page=${page}`).pipe(
        Effect.flatMap(({ json }) => json),
        Effect.map(S.decodeUnknownSync(S.mutable(S.Array(sShowDto))))
      );

    const fetchDailyUpdates = () =>
      client.get("/updates/shows").pipe(
        Effect.flatMap(({ json }) => json),
        Effect.map(S.decodeUnknownSync(sShowUpdatesDto))
      );

    const fetchShowEpisodes = (showId: number) =>
      client.get(`/shows/${showId}/episodes`).pipe(
        Effect.flatMap(({ json }) => json),
        Effect.map(S.decodeUnknownSync(S.mutable(S.Array(sEpisodeDto))))
      );

    return { fetchDailyUpdates, fetchShow, fetchShows, fetchShowEpisodes };
  }),
}) {}
