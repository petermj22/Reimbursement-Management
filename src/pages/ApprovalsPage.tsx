import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { mockExpenses } from '@/data/mockData';
import { StatusBadge } from '@/components/expenses/StatusBadge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, Eye, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const ApprovalsPage: React.FC = () => {
  const navigate = useNavigate();
  const pendingExpenses = mockExpenses.filter(e => e.status === 'pending');

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="space-y-6">
      <motion.div variants={fadeUp}>
        <h1 className="page-title">Pending Approvals</h1>
        <p className="page-description">{pendingExpenses.length} expenses awaiting your review</p>
      </motion.div>

      <motion.div variants={fadeUp} className="space-y-4">
        {pendingExpenses.map((expense, i) => (
          <motion.div
            key={expense.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {expense.employeeName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{expense.description}</h3>
                  <p className="text-xs text-muted-foreground">{expense.employeeName} · {expense.merchantName}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground">{expense.categoryName}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">{expense.expenseDate}</span>
                    {expense.isOcrProcessed && (
                      <>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-success">OCR {expense.ocrConfidence?.toFixed(0)}%</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-muted-foreground">{expense.currency}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Step {expense.currentApprovalStep + 1} of {expense.totalApprovalSteps}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate(`/expenses/${expense.id}`)}>
                  <Eye className="w-3.5 h-3.5 mr-1" /> View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={() => toast.error('Expense rejected')}
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => toast.success('Expense approved!')}
                  style={{ background: 'var(--gradient-success)' }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                </Button>
              </div>
            </div>
          </motion.div>
        ))}

        {pendingExpenses.length === 0 && (
          <div className="glass-card p-16 text-center">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground">All caught up! No pending approvals.</p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ApprovalsPage;
