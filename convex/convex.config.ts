import aggregate from "@convex-dev/aggregate/convex.config";
import migrations from "@convex-dev/migrations/convex.config.js";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(aggregate, { name: "favoriteShows" });
app.use(aggregate, { name: "topRatedShows" });
app.use(aggregate, { name: "topRatedShowsByYear" });
app.use(aggregate, { name: "topRatedShowsByPreference" });
app.use(aggregate, { name: "topRatedShowsByPreferenceAndYear" });
app.use(aggregate, { name: "trendingShows" });
app.use(aggregate, { name: "trendingShowsByYear" });
app.use(aggregate, { name: "trendingUnsetShows" });
app.use(aggregate, { name: "trendingUnsetShowsByYear" });
app.use(aggregate, { name: "unwatchedEpisodes" });
app.use(aggregate, { name: "upcomingEpisodes" });
app.use(migrations);

export default app;
