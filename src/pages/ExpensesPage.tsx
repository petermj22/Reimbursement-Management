import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetExpensesQuery, useGetCategoriesQuery } from '@/store';
import ExpenseDataGrid from '@/components/ExpenseDataGrid';
import { ExpenseListSkeleton } from '@/components/Skeletons';
import { bulkExportByMonth, startViewTransition } from '@/lib/webApis';
import { toast } from 'sonner';
import { FirstTimeEmptyState, FilterEmptyState, NetworkErrorState } from '@/components/EmptyStates';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const ExpensesPage: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading, isFetching, error, refetch } = useGetExpensesQuery({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    page,
    limit: 100,
  });
  const { data: categories = [] } = useGetCategoriesQuery();

  const expenses = data?.expenses || [];
  const hasActiveFilters = statusFilter !== 'all' || categoryFilter !== 'all';
  const isFirstTime = !hasActiveFilters && expenses.length === 0 && !isLoading && !error;
  const isFilterEmpty = hasActiveFilters && expenses.length === 0 && !isLoading;

  // Build active filter labels for FilterEmptyState
  const activeFilters = [
    ...(statusFilter !== 'all' ? [{ label: statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1), key: 'status' }] : []),
    ...(categoryFilter !== 'all' ? [{ label: categories.find(c => c.id === categoryFilter)?.name || categoryFilter, key: 'category' }] : []),
  ];

  const handleClearFilter = (key: string) => {
    if (key === 'status') setStatusFilter('all');
    if (key === 'category') setCategoryFilter('all');
  };

  const handleClearAll = () => {
    setStatusFilter('all');
    setCategoryFilter('all');
  };

  const handleExport = async () => {
    if (expenses.length === 0) { toast.error('No expenses to export'); return; }
    setExporting(true);
    try {
      await bulkExportByMonth(
        expenses.map(e => ({
          amount: Number(e.amount),
          description: e.description,
          expenseDate: e.expenseDate,
          status: e.status,
          employeeName: e.employeeName || 'Unknown',
          categoryName: e.categoryName || 'Uncategorized',
        }))
      );
      toast.success(`Exported ${expenses.length} expenses by month`);
    } catch { toast.error('Export failed'); }
    setExporting(false);
  };

  const handleNewExpense = () => startViewTransition(() => navigate('/expenses/new'));

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="page-title">All Expenses</h1>
          <p className="page-description">
            {isLoading ? 'Loading...' : `${data?.total || 0} total expenses`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting || expenses.length === 0}
            className="gap-2 h-9 border-white/10 text-zinc-400 hover:text-white">
            {exporting
              ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : <Download className="w-3.5 h-3.5" />}
            {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button onClick={handleNewExpense} style={{ background: 'var(--gradient-primary)' }} className="gap-2">
            <Plus className="w-4 h-4" /> New Expense
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} className="glass-card p-4 flex items-center gap-4 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {['all', 'draft', 'pending', 'approved', 'rejected', 'paid'].map(s => (
              <SelectItem key={s} value={s} className="capitalize">{s === 'all' ? 'All Statuses' : s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Active filter pills */}
        {activeFilters.map(f => (
          <span key={f.key}
            className="flex items-center gap-1.5 text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-full">
            {f.label}
            <button onClick={() => handleClearFilter(f.key)} className="text-indigo-500 hover:text-white transition-colors leading-none">×</button>
          </span>
        ))}
        {isFetching && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin ml-auto" />}
        {!isFetching && hasActiveFilters && (
          <button onClick={handleClearAll} className="ml-auto text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            Clear all
          </button>
        )}
      </motion.div>

      {/* Content */}
      <motion.div variants={fadeUp}>
        {isLoading ? (
          <ExpenseListSkeleton />
        ) : error ? (
          /* Network error state */
          <div className="glass-card">
            <NetworkErrorState
              error="Couldn't load expenses. Check your connection."
              onRetry={() => refetch()}
              cachedDataAvailable={false}
            />
          </div>
        ) : isFirstTime ? (
          /* First-time user — no expenses at all */
          <div className="glass-card">
            <FirstTimeEmptyState onAction={handleNewExpense} />
          </div>
        ) : isFilterEmpty ? (
          /* Filter returned no results */
          <div className="glass-card">
            <FilterEmptyState
              activeFilters={activeFilters}
              onClearFilter={handleClearFilter}
              onClearAll={handleClearAll}
              alternativeCount={{ label: 'pending approvals', href: '/approvals', count: 12 }}
            />
          </div>
        ) : (
          <ExpenseDataGrid data={expenses} />
        )}
      </motion.div>
    </motion.div>
  );
};

export default ExpensesPage;
