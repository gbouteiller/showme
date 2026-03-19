import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

crons.daily("update all shows", { hourUTC: 6, minuteUTC: 0 }, api.shows.updateAll);

export default crons;
