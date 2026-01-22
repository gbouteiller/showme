import type { HttpClientError } from "@effect/platform/HttpClientError";
import { Effect as E, Option as O, Schema as S } from "effect";
import { NoSuchElementException } from "effect/Cause";
import type { ParseError } from "effect/ParseResult";
import { api } from "@/convex/_generated/api";
import { ActionCtx, type QueryCtx } from "@/convex/confect";
import { sId } from "@/schemas/convex";
import type { Episodes } from "@/schemas/episodes";
import { type Shows, sShowDoc } from "@/schemas/shows";
import { TvMaze } from "@/services/tvmaze";
import { showFromDoc } from "./shows";

// ACTIONS ---------------------------------------------------------------------------------------------------------------------------------
export const fetchShowEpisodes = ({ _id, apiId }: FetchShowEpisodesArgs): FetchShowEpisodes =>
  E.gen(function* () {
    const { runMutation } = yield* ActionCtx;
    const { fetchShowEpisodes } = yield* TvMaze;
    const dtos = yield* fetchShowEpisodes(apiId);
    return yield* runMutation(api.episodes.createManyMissingForShow, { dtos, showId: _id });
  });
export const sFetchShowEpisodesArgs = sShowDoc.pick("_id", "apiId");
export const sFetchShowEpisodesReturns = S.Array(sId("episodes"));
export type FetchShowEpisodesArgs = typeof sFetchShowEpisodesArgs.Type;
export type FetchShowEpisodes = E.Effect<typeof sFetchShowEpisodesReturns.Type, HttpClientError | ParseError, ActionCtx | TvMaze>;

// TRANSFORMS ------------------------------------------------------------------------------------------------------------------------------
export function episodeFromDoc(db: Pick<QueryCtx["db"], "get">) {
  return (doc: Episodes["Doc"]): E.Effect<Episodes["Entry"], NoSuchElementException> =>
    E.gen(function* () {
      const showDoc = yield* db.get(doc.showId);
      if (O.isNone(showDoc)) return yield* new NoSuchElementException("missing show doc");
      const show = yield* showFromDoc(db)(showDoc.value);
      return { ...doc, show };
    });
}

// READ ------------------------------------------------------------------------------------------------------------------------------------
export function readEpisodeByApiId(db: Pick<QueryCtx["db"], "query">) {
  return ({ apiId }: Episodes["ApiRef"]): E.Effect<O.Option<Episodes["Doc"]>> =>
    db
      .query("episodes")
      .withIndex("by_api", (q) => q.eq("apiId", apiId))
      .first();
}

export function readEpisodesByShow(db: Pick<QueryCtx["db"], "query">) {
  return ({ _id }: Shows["Ref"]): E.Effect<Episodes["Doc"][]> =>
    db
      .query("episodes")
      .withIndex("by_show", (q) => q.eq("showId", _id))
      .collect();
}
