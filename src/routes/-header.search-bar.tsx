import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/adapted/command";
import { ShowItem } from "@/components/shows/item";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/convex/_generated/api";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data = [], isLoading } = useQuery({
    ...convexQuery(api.shows.searchByName, { search: debouncedSearch }),
    enabled: debouncedSearch.length >= 2,
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        )
          return;

        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger
        render={
          <Button
            className={cn(
              "relative h-8 w-full justify-start pl-3 font-normal text-foreground shadow-none hover:bg-muted/50 sm:pr-12 md:w-48 lg:w-56 xl:w-64 dark:bg-card"
            )}
            onClick={() => setOpen(true)}
            variant="outline"
          />
        }
      >
        <span className="hidden lg:inline-flex">Search a show...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <div className="absolute top-1.5 right-1.5 hidden gap-1 group-has-data-[slot=designer]/body:hidden sm:flex">
          <Kbd>⌘K</Kbd>
        </div>
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader className="sr-only">
          <DialogTitle>Search a show...</DialogTitle>
          <DialogDescription>Search for a show to add...</DialogDescription>
        </DialogHeader>
        <Command shouldFilter={false}>
          <div className="relative">
            <CommandInput onValueChange={setSearch} placeholder="Search a show..." value={search} />
            {isLoading && (
              <div className="pointer-events-none absolute top-1/2 right-3 z-10 flex -translate-y-1/2 items-center justify-center">
                <Spinner className="size-4 text-muted-foreground" />
              </div>
            )}
          </div>
          <CommandList>
            <CommandEmpty className="py-12 text-center text-muted-foreground text-sm">
              {isLoading ? "Searching..." : "No results found."}
            </CommandEmpty>
            <CommandGroup>
              {data.map((item) => (
                <CommandItem key={item._id} onSelect={() => setOpen(false)}>
                  <ShowItem className="w-full" show={item} variant="favorites" />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
