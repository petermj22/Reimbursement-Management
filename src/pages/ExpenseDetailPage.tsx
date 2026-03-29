import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, DollarSign, Clock, FileText, Loader2, User, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useGetExpenseQuery, useApproveExpenseMutation, useRejectExpenseMutation, usePayExpenseMutation } from '@/store';
import { CardSkeleton } from '@/components/Skeletons';
import { LottieSuccess } from '@/components/LottieAnimations';
import { ExpenseComments } from '@/components/ExpenseComments';
import { ShareExpenseButton } from '@/components/ShareExpenseButton';
import type { Expense, ApprovalLog } from '@/types';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const statusStyles: Record<string, string> = {
  pending: 'bg-warning/15 text-warning border-warning/30',
  approved: 'bg-success/15 text-success border-success/30',
  rejected: 'bg-destructive/15 text-destructive border-destructive/30',
  paid: 'bg-info/15 text-info border-info/30',
  draft: 'bg-muted text-muted-foreground border-border',
};

const ExpenseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, error } = useGetExpenseQuery(id!, { skip: !id });
  const [approveExpense, { isLoading: approving }] = useApproveExpenseMutation();
  const [rejectExpense, { isLoading: rejecting }] = useRejectExpenseMutation();
  const [payExpense, { isLoading: paying }] = usePayExpenseMutation();

  const expense: Expense | undefined = data?.expense;
  const approvalLogs: ApprovalLog[] = data?.approvalLogs || [];

  const canApprove = user && ['admin', 'manager'].includes(user.role) && expense?.status === 'pending';
  const canPay = user?.role === 'admin' && expense?.status === 'approved';

  const handleApprove = async () => {
    try {
      await approveExpense({ id: id!, comments: 'Approved via detail page' }).unwrap();
      toast.success('Expense approved!');
    } catch { toast.error('Failed to approve'); }
  };

  const handleReject = async () => {
    try {
      await rejectExpense({ id: id!, comments: 'Does not meet company policy' }).unwrap();
      toast.success('Expense rejected');
    } catch { toast.error('Failed to reject'); }
  };

  const handlePay = async () => {
    try {
      await payExpense(id!).unwrap();
      toast.success('Payment processed!');
    } catch { toast.error('Payment failed'); }
  };

  if (isLoading) return <div className="max-w-3xl mx-auto space-y-6"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>;
  if (error || !expense) return <div className="text-center py-20"><p className="text-muted-foreground">Expense not found</p><Button variant="outline" className="mt-4" onClick={() => navigate('/expenses')}>Back to Expenses</Button></div>;

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="page-title">Expense Details</h1>
            <Badge variant="outline" className={`${statusStyles[expense.status]} text-xs capitalize`}>{expense.status}</Badge>
          </div>
          <p className="page-description">ID: {expense.id.slice(0, 8)}...</p>
        </div>
        <div className="flex items-center gap-2 ml-auto print:hidden">
          <ShareExpenseButton expense={expense} />
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-2 h-8">
            <FileText className="w-3.5 h-3.5" /> Print
          </Button>
        </div>
      </motion.div>

      {/* Success animation */}
      <AnimatePresence>
        {expense.status === 'paid' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center">
            <LottieSuccess size={100} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Details */}
      <motion.div variants={fadeUp} className="glass-card p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-xs text-muted-foreground mb-1">Description</p><p className="text-sm font-medium text-foreground">{expense.description}</p></div>
          <div><p className="text-xs text-muted-foreground mb-1">Amount</p><p className="text-xl font-bold text-foreground">{expense.currency} ${Number(expense.amount).toLocaleString()}</p></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><p className="text-xs text-muted-foreground mb-1">Employee</p><div className="flex items-center gap-2"><User className="w-3 h-3 text-muted-foreground" /><span className="text-sm text-foreground">{expense.employeeName}</span></div></div>
          <div><p className="text-xs text-muted-foreground mb-1">Category</p><span className="text-sm text-foreground">{expense.categoryName}</span></div>
          <div><p className="text-xs text-muted-foreground mb-1">Date</p><span className="text-sm text-foreground">{new Date(expense.expenseDate).toLocaleDateString()}</span></div>
        </div>
        {expense.merchantName && <div><p className="text-xs text-muted-foreground mb-1">Merchant</p><span className="text-sm text-foreground">{expense.merchantName}</span></div>}
        {expense.isOcrProcessed && <div><p className="text-xs text-muted-foreground mb-1">OCR Confidence</p><div className="flex items-center gap-2"><div className="w-32 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-success rounded-full" style={{ width: `${expense.ocrConfidence || 0}%` }} /></div><span className="text-xs text-success">{expense.ocrConfidence}%</span></div></div>}
      </motion.div>

      {/* Approval Timeline */}
      <motion.div variants={fadeUp} className="glass-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Approval Timeline</h3>
        <div className="space-y-4">
          {/* Submitted event */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><FileText className="w-3.5 h-3.5 text-primary" /></div>
            <div><p className="text-sm font-medium text-foreground">Submitted</p><p className="text-xs text-muted-foreground">{expense.submittedAt ? new Date(expense.submittedAt).toLocaleString() : 'N/A'}</p></div>
          </div>
          {/* Approval logs */}
          {approvalLogs.map(log => (
            <div key={log.id} className="flex gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${log.action === 'approved' ? 'bg-success/10' : log.action === 'rejected' ? 'bg-destructive/10' : 'bg-warning/10'}`}>
                {log.action === 'approved' ? <CheckCircle className="w-3.5 h-3.5 text-success" /> : <XCircle className="w-3.5 h-3.5 text-destructive" />}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground capitalize">{log.action} by {log.approverName}</p>
                {log.comments && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MessageSquare className="w-3 h-3" /> {log.comments}</p>}
                <p className="text-xs text-muted-foreground mt-0.5">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {expense.status === 'paid' && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center flex-shrink-0"><DollarSign className="w-3.5 h-3.5 text-info" /></div>
              <div><p className="text-sm font-medium text-foreground">Payment Processed</p><p className="text-xs text-muted-foreground">{expense.paidAt ? new Date(expense.paidAt).toLocaleString() : 'N/A'}</p></div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Action Buttons */}
      {(canApprove || canPay) && (
        <motion.div variants={fadeUp} className="glass-card p-4 flex gap-3">
          {canApprove && (
            <>
              <Button className="flex-1 gap-2" style={{ background: 'var(--gradient-success)' }} onClick={handleApprove} disabled={approving}>
                {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Approve
              </Button>
              <Button variant="outline" className="flex-1 gap-2 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={handleReject} disabled={rejecting}>
                {rejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Reject
              </Button>
            </>
          )}
          {canPay && (
            <Button className="flex-1 gap-2" style={{ background: 'var(--gradient-primary)' }} onClick={handlePay} disabled={paying}>
              {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />} Process Payment
            </Button>
          )}
        </motion.div>
      )}

      {/* Threaded Comments */}
      {data?.expense && (
        <motion.div variants={fadeUp}>
          <ExpenseComments expenseId={data.expense.id} />
        </motion.div>
      )}
    </motion.div>
  );
};

export default ExpenseDetailPage;
