import { useConvexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Image } from "@unpic/react";
import { api } from "convex/_generated/api";
import type { Doc } from "convex/_generated/dataModel";
// import { ExternalLink, Heart, HeartCrack, Info, Star } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export function ShowItems({
  items,
  kind,
}: {
  items: Array<Doc<"shows"> & { preference: "favorite" | "unset" | "ignored" }>;
  kind: "topRated" | "trending";
}) {
  const { mutate: setPreference, isPending } = useMutation({
    // @ts-expect-error - useConvexMutation integration with useMutation
    mutationFn: useConvexMutation(api.shows.setPreference),
    // @ts-expect-error - useConvexMutation integration with useMutation
    onSuccess: (_data, { preference }) => {
      const messages: Record<string, string> = {
        favorite: "Show successfully added to favorites",
        unset: "Show successfully removed from favorites",
        ignored: "Show successfully ignored",
      };
      toast.success(messages[preference]);
    },
    onError: () => toast.error("An error occurred"),
  });

  const cyclePreference = (current: "favorite" | "unset" | "ignored"): "favorite" | "unset" | "ignored" => {
    if (current === "favorite") return "unset";
    if (current === "unset") return "favorite";
    return "unset";
  };

  return (
    <div className="py-2">
      <div className="space-y-2.5">
        {items.map(({ _id, apiId, image, preference, name, rating }) => (
          <div
            className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"
            key={apiId}
          >
            <div className="relative h-16 w-full">
              {image ? (
                <Image
                  alt={name}
                  className="object-cover brightness-75"
                  layout="fullWidth"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  src={image}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <span className="icon-[lucide--info] h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 bg-linear-to-r from-black/60 to-transparent">
                <div className="flex h-full items-center justify-between p-2">
                  <div className="flex items-center gap-2">
                    {rating && (
                      <div
                        className={cn("flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-[10px] text-white", {
                          "bg-amber-500": kind === "topRated",
                          "bg-green-500": kind === "trending",
                        })}
                      >
                        <span className="icon-[lucide--star] mr-0.5 h-2.5 w-2.5 fill-white" />
                        {rating.toFixed(1)}
                      </div>
                    )}
                    <h3 className="max-w-[180px] truncate font-heading font-semibold text-sm text-white">{name}</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      aria-label={preference === "favorite" ? "Remove from favorites" : "Add to favorites"}
                      className="h-6 w-6 bg-black/40 text-white hover:bg-black/60 hover:text-white"
                      disabled={isPending}
                      onClick={() => setPreference({ _id, preference: cyclePreference(preference) })}
                      size="icon"
                      variant="ghost"
                    >
                      {preference === "favorite" ? (
                        <span className="icon-[lucide--heart-crack]" />
                      ) : (
                        <span className="icon-[lucide--heart]" />
                      )}
                    </Button>
                    <Button
                      aria-label={preference === "ignored" ? "Stop ignoring" : "Ignore"}
                      className="h-6 w-6 bg-black/40 text-white hover:bg-black/60 hover:text-white"
                      disabled={isPending}
                      onClick={() => setPreference({ _id, preference: preference === "ignored" ? "unset" : "ignored" })}
                      size="icon"
                      variant="ghost"
                    >
                      {preference === "ignored" ? <span className="icon-[lucide--eye]" /> : <span className="icon-[lucide--eye-off]" />}
                    </Button>
                    <Link params={{ showId: `${apiId}` }} to="/series/$showId">
                      <Button
                        aria-label="View details"
                        className="h-6 w-6 bg-black/40 text-white hover:bg-black/60 hover:text-white"
                        size="icon"
                        variant="ghost"
                      >
                        <span className="icon-[lucide--external-link] size-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// SKELETON --------------------------------------------------------------------------------------------------------------------------------
export function ShowItemsSkeleton() {
  return (
    <div className="space-y-2.5">
      {new Array(10).fill(0).map((_, i) => (
        <div className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm" key={i}>
          <Skeleton className="h-16 w-full" />
        </div>
      ))}
    </div>
  );
}
