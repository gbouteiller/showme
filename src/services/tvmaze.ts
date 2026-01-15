import { FetchHttpClient, HttpClient, HttpClientRequest } from "@effect/platform";
import { Effect, flow, Schema as S } from "effect";
import { sEpisodeDto } from "@/schemas/episodes";
import { sShowDto } from "@/schemas/shows";

export class TvMaze extends Effect.Service<TvMaze>()("TvMaze", {
  dependencies: [FetchHttpClient.layer],
  effect: Effect.gen(function* () {
    const baseClient = yield* HttpClient.HttpClient;
    const client = baseClient.pipe(
      HttpClient.mapRequest(flow(HttpClientRequest.prependUrl("https://api.tvmaze.com"), HttpClientRequest.acceptJson))
    );

    const fetchShows = (page = 1) =>
      client.get(`/shows?page=${page}`).pipe(
        Effect.flatMap(({ json }) => json),
        Effect.map(S.decodeUnknownSync(S.mutable(S.Array(sShowDto))))
      );

    const fetchShowEpisodes = (showId: number) =>
      client.get(`/shows/${showId}/episodes`).pipe(
        Effect.flatMap(({ json }) => json),
        Effect.map(S.decodeUnknownSync(S.mutable(S.Array(sEpisodeDto))))
      );

    return { fetchShows, fetchShowEpisodes };
  }),
}) {}
