import { Effect as E, flow, Layer, Schema as S, ServiceMap } from "effect";
import { FetchHttpClient, HttpClient, HttpClientRequest } from "effect/unstable/http";
import { filterValidEpisodes } from "@/functions/episodes";
import { sEpisodeDto, sShowDto, sShowRevisionDtos, sShowWithEpisodesDto } from "@/schemas/dtos";
import type { Shows } from "@/schemas/shows";

export class TvMaze extends ServiceMap.Service<TvMaze>()("TvMaze", {
  make: E.gen(function* () {
    const baseClient = yield* HttpClient.HttpClient;
    const client = baseClient.pipe(
      HttpClient.mapRequest(flow(HttpClientRequest.prependUrl("https://api.tvmaze.com"), HttpClientRequest.acceptJson))
    );

    const fetchShowRevisions = E.fn(function* (period?: Shows["RevisionPeriod"]) {
      const { json } = yield* client.get(`/updates/shows${period ? `?since=${period}` : ""}`);
      return yield* S.decodeUnknownEffect(sShowRevisionDtos)(yield* json);
    });

    const fetchShow = E.fn(function* (showId: number) {
      const { json } = yield* client.get(`/shows/${showId}`);
      return yield* S.decodeUnknownEffect(sShowDto)(yield* json);
    });

    const fetchShowWithEpisodes = E.fn(function* (showId: number) {
      const { json } = yield* client.get(`/shows/${showId}?embed=episodes`);
      const show = yield* S.decodeUnknownEffect(sShowWithEpisodesDto)(yield* json);
      return { ...show, episodes: filterValidEpisodes(show.episodes) };
    });

    const fetchShowsByPage = E.fn(function* (page: number) {
      const { json } = yield* client.get(`/shows?page=${page}`);
      return yield* S.decodeUnknownEffect(S.mutable(S.Array(sShowDto)))(yield* json);
    });

    const fetchShowEpisodes = E.fn(function* (showId: number) {
      const { json } = yield* client.get(`/shows/${showId}/episodes`);
      const episodes = yield* S.decodeUnknownEffect(S.mutable(S.Array(sEpisodeDto)))(yield* json);
      return filterValidEpisodes(episodes);
    });

    return { fetchShowRevisions, fetchShow, fetchShowWithEpisodes, fetchShowsByPage, fetchShowEpisodes };
  }),
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(Layer.provide(FetchHttpClient.layer));
}
