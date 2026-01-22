import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export function ShowsListPagination({ currentPage, hasNextPage, goToPage, isLoading }: ShowsListPaginationProps) {
  const hasPrevPage = currentPage > 1;

  return (
    <div className="mt-4">
      <Pagination>
        <PaginationContent className={cn("transition-opacity duration-200", isLoading && "opacity-60")}>
          <PaginationItem>
            <PaginationPrevious
              className={cn(
                "transition-all duration-200",
                hasPrevPage ? "cursor-pointer hover:scale-105 hover:bg-accent active:scale-95" : "pointer-events-none opacity-50"
              )}
              onClick={() => goToPage(currentPage - 1)}
            />
          </PaginationItem>

          {currentPage > 2 && (
            <PaginationItem>
              <PaginationLink className="transition-all duration-200 hover:scale-105 active:scale-95" onClick={() => goToPage(1)}>
                1
              </PaginationLink>
            </PaginationItem>
          )}

          {currentPage > 3 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          {hasPrevPage && (
            <PaginationItem>
              <PaginationLink
                className="transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={() => goToPage(currentPage - 1)}
              >
                {currentPage - 1}
              </PaginationLink>
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationLink isActive>{currentPage}</PaginationLink>
          </PaginationItem>

          {hasNextPage && (
            <PaginationItem>
              <PaginationLink
                className="transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={() => goToPage(currentPage + 1)}
              >
                {currentPage + 1}
              </PaginationLink>
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationNext
              className={cn(
                "transition-all duration-200",
                hasNextPage ? "cursor-pointer hover:scale-105 hover:bg-accent active:scale-95" : "pointer-events-none opacity-50"
              )}
              onClick={() => goToPage(currentPage + 1)}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
type ShowsListPaginationProps = {
  currentPage: number;
  hasNextPage: boolean;
  goToPage: (page: number) => void;
  isLoading?: boolean;
};
