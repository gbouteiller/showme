import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

crons.daily("refresh all shows (morning)", { hourUTC: 5, minuteUTC: 0 }, api.shows.refreshAllDaily);
crons.daily("refresh all shows (evening)", { hourUTC: 17, minuteUTC: 0 }, api.shows.refreshAllDaily);

export default crons;
