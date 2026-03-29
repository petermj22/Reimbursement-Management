// =============================================================
// TANSTACK TABLE - Expense Data Grid with sorting, filtering, pagination
// =============================================================
import React, { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import type { Expense } from '@/types';

const columnHelper = createColumnHelper<Expense>();

const statusStyles: Record<string, string> = {
  pending: 'bg-warning/15 text-warning border-warning/30',
  approved: 'bg-success/15 text-success border-success/30',
  rejected: 'bg-destructive/15 text-destructive border-destructive/30',
  paid: 'bg-info/15 text-info border-info/30',
  draft: 'bg-muted text-muted-foreground border-border',
};

interface Props {
  data: Expense[];
  loading?: boolean;
}

const ExpenseDataGrid: React.FC<Props> = ({ data, loading }) => {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([{ id: 'created_at', desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo(() => [
    columnHelper.accessor('employeeName', {
      header: ({ column }) => (
        <button className="flex items-center gap-1 text-xs font-medium" onClick={() => column.toggleSorting()}>
          Employee
          {column.getIsSorted() === 'asc' ? <ArrowUp className="w-3 h-3" /> :
           column.getIsSorted() === 'desc' ? <ArrowDown className="w-3 h-3" /> :
           <ArrowUpDown className="w-3 h-3 opacity-40" />}
        </button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
            {row.original.employeeName?.split(' ').map(n => n[0]).join('') || '?'}
          </div>
          <span className="text-sm font-medium text-foreground">{row.original.employeeName}</span>
        </div>
      ),
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">{getValue()}</span>
      ),
    }),
    columnHelper.accessor('amount', {
      header: ({ column }) => (
        <button className="flex items-center gap-1 text-xs font-medium" onClick={() => column.toggleSorting()}>
          Amount
          {column.getIsSorted() === 'asc' ? <ArrowUp className="w-3 h-3" /> :
           column.getIsSorted() === 'desc' ? <ArrowDown className="w-3 h-3" /> :
           <ArrowUpDown className="w-3 h-3 opacity-40" />}
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-foreground">
          ${Number(row.original.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    }),
    columnHelper.accessor('categoryName', {
      header: 'Category',
      cell: ({ getValue }) => (
        <Badge variant="outline" className="text-xs">{getValue() || 'Uncategorized'}</Badge>
      ),
    }),
    columnHelper.accessor('status', {
      header: ({ column }) => (
        <button className="flex items-center gap-1 text-xs font-medium" onClick={() => column.toggleSorting()}>
          Status
          {column.getIsSorted() ? <ArrowUp className="w-3 h-3" /> : <ArrowUpDown className="w-3 h-3 opacity-40" />}
        </button>
      ),
      cell: ({ getValue }) => {
        const status = getValue();
        return (
          <Badge variant="outline" className={`${statusStyles[status]} text-xs capitalize`}>
            {status}
          </Badge>
        );
      },
      filterFn: 'equals',
    }),
    columnHelper.accessor('expenseDate', {
      header: ({ column }) => (
        <button className="flex items-center gap-1 text-xs font-medium" onClick={() => column.toggleSorting()}>
          Date
          {column.getIsSorted() ? <ArrowUp className="w-3 h-3" /> : <ArrowUpDown className="w-3 h-3 opacity-40" />}
        </button>
      ),
      cell: ({ getValue }) => (
        <span className="text-sm text-muted-foreground">
          {new Date(getValue()).toLocaleDateString()}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => navigate(`/expenses/${row.original.id}`)}>
          <Eye className="w-3.5 h-3.5" />
        </Button>
      ),
    }),
  ], [navigate]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, globalFilter },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-3">
      {/* Global search */}
      <div className="glass-card p-3">
        <Input
          placeholder="Search expenses..."
          value={globalFilter}
          onChange={e => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="table-container overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="bg-muted/30">
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, i) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="border-t border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => navigate(`/expenses/${row.original.id}`)}
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-4 py-2.5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <p className="text-xs text-muted-foreground">
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}–
          {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, data.length)} of {data.length}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseDataGrid;
