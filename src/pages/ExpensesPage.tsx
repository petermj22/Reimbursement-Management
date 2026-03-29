import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { StatusBadge } from '@/components/expenses/StatusBadge';
import { mockExpenses, mockCategories } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, Receipt, Eye, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ExpenseStatus } from '@/types';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const ExpensesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const isEmployee = user?.role === 'employee';
  const allExpenses = isEmployee ? mockExpenses.filter(e => e.employeeId === user?.id) : mockExpenses;

  const filtered = allExpenses.filter(e => {
    const matchesSearch = e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.merchantName?.toLowerCase().includes(search.toLowerCase()) ||
      e.employeeName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || e.categoryId === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalAmount = filtered.reduce((sum, e) => sum + e.amount, 0);

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="space-y-6">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{isEmployee ? 'My Expenses' : 'All Expenses'}</h1>
          <p className="page-description">{filtered.length} expenses · ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} total</p>
        </div>
        <Button onClick={() => navigate('/expenses/new')} style={{ background: 'var(--gradient-primary)' }}>
          <Plus className="w-4 h-4 mr-2" /> New Expense
        </Button>
      </motion.div>

      {/* Filters */}
      <motion.div variants={fadeUp} className="glass-card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="w-3 h-3 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {mockCategories.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Table */}
      <motion.div variants={fadeUp} className="table-container">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/30">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Expense</th>
                {!isEmployee && <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Employee</th>}
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Category</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">OCR</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((expense, i) => (
                  <motion.tr
                    key={expense.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-t border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Receipt className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{expense.description}</p>
                          <p className="text-xs text-muted-foreground">{expense.merchantName}</p>
                        </div>
                      </div>
                    </td>
                    {!isEmployee && <td className="px-6 py-3.5 text-sm text-foreground">{expense.employeeName}</td>}
                    <td className="px-6 py-3.5 text-sm text-muted-foreground">{expense.categoryName}</td>
                    <td className="px-6 py-3.5 text-sm font-semibold text-foreground text-right">
                      <span>${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      {expense.currency !== 'USD' && (
                        <span className="text-xs text-muted-foreground ml-1">{expense.currency}</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5"><StatusBadge status={expense.status} /></td>
                    <td className="px-6 py-3.5 text-sm text-muted-foreground">{expense.expenseDate}</td>
                    <td className="px-6 py-3.5">
                      {expense.isOcrProcessed ? (
                        <span className="text-xs text-success font-medium">{expense.ocrConfidence?.toFixed(0)}%</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/expenses/${expense.id}`)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-sm">No expenses found</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ExpensesPage;
