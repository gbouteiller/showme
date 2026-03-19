import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/adapted/select";

// CONSTS ----------------------------------------------------------------------------------------------------------------------------------
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1960 + 1 }, (_, i) => 1960 + i).reverse();

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export function YearSelect({ onValueChange, year }: YearSelectProps) {
  return (
    <Select onValueChange={(value) => onValueChange(value ?? undefined)} value={year}>
      <SelectTrigger size="sm">
        <SelectValue placeholder="All years" render={() => <span>{year === undefined ? "All" : year}</span>} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={undefined}>All years</SelectItem>
        {YEARS.map((y) => (
          <SelectItem key={y} value={y}>
            {y}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
export type YearSelectProps = {
  onValueChange: (value: number | undefined) => void;
  year?: number;
};
