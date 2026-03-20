import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

crons.daily("refresh all shows", { hourUTC: 16, minuteUTC: 0 }, api.shows.refreshAllDaily);

export default crons;
