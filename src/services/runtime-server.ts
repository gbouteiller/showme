import { Layer, ManagedRuntime } from "effect";
import { TvMaze } from "./tvmaze";

const MainLayer = Layer.mergeAll(TvMaze.Default);

export const RuntimeServer = ManagedRuntime.make(MainLayer);
