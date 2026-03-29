import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { mockExpenses, mockApprovalLogs } from '@/data/mockData';
import { StatusBadge } from '@/components/expenses/StatusBadge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, CheckCircle2, XCircle, Clock, Receipt, FileText, Scan } from 'lucide-react';
import { toast } from 'sonner';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const ExpenseDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const expense = mockExpenses.find(e => e.id === id);
  const logs = mockApprovalLogs.filter(l => l.expenseId === id);

  if (!expense) {
    return <div className="text-center py-20 text-muted-foreground">Expense not found</div>;
  }

  const canApprove = (user?.role === 'manager' || user?.role === 'admin') && expense.status === 'pending';

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="max-w-3xl mx-auto space-y-6">
      <motion.div variants={fadeUp}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="page-title">{expense.description}</h1>
            <p className="page-description">Submitted by {expense.employeeName} · {expense.merchantName}</p>
          </div>
          <StatusBadge status={expense.status} />
        </div>
      </motion.div>

      {/* Details */}
      <motion.div variants={fadeUp} className="glass-card p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Amount</p>
            <p className="text-xl font-bold text-foreground">${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-muted-foreground">{expense.currency}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Category</p>
            <p className="text-sm font-medium text-foreground">{expense.categoryName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Expense Date</p>
            <p className="text-sm font-medium text-foreground">{expense.expenseDate}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Submitted</p>
            <p className="text-sm font-medium text-foreground">{expense.submittedAt ? new Date(expense.submittedAt).toLocaleDateString() : '—'}</p>
          </div>
        </div>
      </motion.div>

      {/* OCR Info */}
      {expense.isOcrProcessed && (
        <motion.div variants={fadeUp} className="glass-card p-6">
          <div className="flex items-center gap-2 mb-3">
            <Scan className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">OCR Processing</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-sm text-foreground">Processed</span>
            </div>
            <span className="text-sm text-muted-foreground">Confidence: <span className="font-semibold text-foreground">{expense.ocrConfidence?.toFixed(1)}%</span></span>
          </div>
        </motion.div>
      )}

      {/* Approval Timeline */}
      <motion.div variants={fadeUp} className="glass-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Approval Timeline</h3>
        <div className="space-y-4">
          {/* Submitted step */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
              <Receipt className="w-3 h-3 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Submitted by {expense.employeeName}</p>
              <p className="text-xs text-muted-foreground">{expense.submittedAt ? new Date(expense.submittedAt).toLocaleString() : '—'}</p>
            </div>
          </div>

          {logs.map(log => (
            <div key={log.id} className="flex items-start gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${
                log.action === 'approved' ? 'bg-success/10' : 'bg-destructive/10'
              }`}>
                {log.action === 'approved' ? (
                  <CheckCircle2 className="w-3 h-3 text-success" />
                ) : (
                  <XCircle className="w-3 h-3 text-destructive" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {log.action === 'approved' ? 'Approved' : 'Rejected'} by {log.approverName}
                </p>
                {log.comments && <p className="text-xs text-muted-foreground mt-0.5">"{log.comments}"</p>}
                <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}

          {expense.status === 'pending' && (
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-warning/10 flex items-center justify-center mt-0.5">
                <Clock className="w-3 h-3 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Awaiting approval</p>
                <p className="text-xs text-muted-foreground">Step {expense.currentApprovalStep + 1} of {expense.totalApprovalSteps}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Actions */}
      {canApprove && (
        <motion.div variants={fadeUp} className="flex gap-3">
          <Button
            onClick={() => { toast.success('Expense approved!'); navigate('/approvals'); }}
            className="flex-1"
            style={{ background: 'var(--gradient-success)' }}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
          </Button>
          <Button
            onClick={() => { toast.error('Expense rejected'); navigate('/approvals'); }}
            variant="outline"
            className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <XCircle className="w-4 h-4 mr-2" /> Reject
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ExpenseDetailPage;
