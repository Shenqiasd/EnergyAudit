import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { forwardRef, type HTMLAttributes, type ReactNode, type TdHTMLAttributes, type ThHTMLAttributes } from "react";

const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
);
Table.displayName = "Table";

const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn("bg-[hsl(var(--muted))/50] border-b border-[hsl(var(--border))]", className)} {...props} />
  )
);
TableHeader.displayName = "TableHeader";

const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
);
TableBody.displayName = "TableBody";

const TableFooter = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn("border-t border-[hsl(var(--border))] bg-[hsl(var(--muted))/50] font-medium", className)}
      {...props}
    />
  )
);
TableFooter.displayName = "TableFooter";

const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-[hsl(var(--border))] transition-colors hover:bg-[hsl(var(--muted))/30] data-[state=selected]:bg-[hsl(var(--muted))]",
        className,
      )}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

type SortDirection = "asc" | "desc" | false;

interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sortDirection?: SortDirection;
  onSort?: () => void;
}

const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, children, sortable, sortDirection, onSort, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-12 px-4 text-left align-middle font-semibold text-[hsl(var(--muted-foreground))]",
        sortable && "cursor-pointer select-none hover:text-[hsl(var(--foreground))] transition-colors",
        className,
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortable && (
          <span className="ml-1 inline-flex text-inherit">
            {sortDirection === "asc" && <ArrowUp className="h-4 w-4" />}
            {sortDirection === "desc" && <ArrowDown className="h-4 w-4" />}
            {!sortDirection && <ArrowUpDown className="h-4 w-4 opacity-30" />}
          </span>
        )}
      </div>
    </th>
  )
);
TableHead.displayName = "TableHead";

const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn("p-4 align-middle", className)}
      {...props}
    />
  )
);
TableCell.displayName = "TableCell";

const TableCaption = forwardRef<HTMLTableCaptionElement, HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption
      ref={ref}
      className={cn("mt-4 text-sm text-[hsl(var(--muted-foreground))]", className)}
      {...props}
    />
  )
);
TableCaption.displayName = "TableCaption";

/* ────────── Empty state ────────── */

interface TableEmptyProps {
  colSpan: number;
  icon?: ReactNode;
  message?: string;
}

function TableEmpty({ colSpan, icon, message = "暂无数据" }: TableEmptyProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-32 text-center">
        <div className="flex flex-col items-center justify-center gap-2 text-[hsl(var(--muted-foreground))]">
          {icon}
          <span className="text-sm font-medium">{message}</span>
        </div>
      </TableCell>
    </TableRow>
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableEmpty,
};
