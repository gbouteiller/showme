import { cva } from "class-variance-authority";

// STYLES ----------------------------------------------------------------------------------------------------------------------------------
export const PAGE_HEADER = {
  base: cva("mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center"),
  children: cva("flex items-center gap-2"),
  description: cva("mt-1 text-muted-foreground"),
  title: cva("font-bold font-heading text-3xl tracking-tight"),
};

// MAIN ------------------------------------------------------------------------------------------------------------------------------------
export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className={PAGE_HEADER.base()}>
      <div>
        <h1 className={PAGE_HEADER.title()}> {title}</h1>
        {description && <p className={PAGE_HEADER.description()}> {description}</p>}
      </div>
      {children && <div className={PAGE_HEADER.children()}> {children}</div>}
    </div>
  );
}
type PageHeaderProps = React.PropsWithChildren<{ description?: string; title: string }>;
