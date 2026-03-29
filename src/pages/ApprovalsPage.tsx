import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Eye, DollarSign, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useGetExpensesQuery, useApproveExpenseMutation, useRejectExpenseMutation } from '@/store';
import { CardSkeleton } from '@/components/Skeletons';
import { RoleEmptyState } from '@/components/EmptyStates';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const ApprovalsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useGetExpensesQuery({ status: 'pending', limit: 50 });
  const [approveExpense, { isLoading: approving }] = useApproveExpenseMutation();
  const [rejectExpense, { isLoading: rejecting }] = useRejectExpenseMutation();

  const pendingExpenses = data?.expenses || [];

  const handleApprove = async (id: string) => {
    try {
      await approveExpense({ id, comments: 'Approved' }).unwrap();
      toast.success('Expense approved!');
    } catch (err: unknown) {
      toast.error('Approval failed');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectExpense({ id, comments: 'Does not meet policy requirements' }).unwrap();
      toast.success('Expense rejected');
    } catch (err: unknown) {
      toast.error('Rejection failed');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div><h1 className="page-title">Pending Approvals</h1></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="space-y-6">
      <motion.div variants={fadeUp}>
        <h1 className="page-title">Pending Approvals</h1>
        <p className="page-description">{pendingExpenses.length} expenses awaiting your review</p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-warning" />
            <span className="text-xs text-muted-foreground">Pending</span>
          </div>
          <p className="text-xl font-bold mt-1 text-foreground">{pendingExpenses.length}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Total Value</span>
          </div>
          <p className="text-xl font-bold mt-1 text-foreground">
            ${pendingExpenses.reduce((s, e) => s + Number(e.amount), 0).toLocaleString()}
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-info" />
            <span className="text-xs text-muted-foreground">Avg. Amount</span>
          </div>
          <p className="text-xl font-bold mt-1 text-foreground">
            ${pendingExpenses.length ? Math.round(pendingExpenses.reduce((s, e) => s + Number(e.amount), 0) / pendingExpenses.length).toLocaleString() : 0}
          </p>
        </div>
      </motion.div>

      {/* Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 gap-4">
        {pendingExpenses.map((exp, i) => (
          <motion.div
            key={exp.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="relative w-full rounded-2xl overflow-hidden"
          >
            {/* Background Action Indicators (Behind the Card) */}
            <div className="absolute inset-0 flex items-center justify-between px-8 rounded-2xl">
              <div className="flex items-center gap-2 text-red-500 font-bold opacity-80">
                <XCircle className="w-6 h-6" /> Reject
              </div>
              <div className="flex items-center gap-2 text-green-500 font-bold opacity-80">
                Approve <CheckCircle className="w-6 h-6" />
              </div>
            </div>

            {/* The Draggable Card */}
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.8}
              onDragEnd={(event, info) => {
                const swipeThreshold = 100;
                if (info.offset.x > swipeThreshold) {
                  // Swiped right -> Approve
                  handleApprove(exp.id);
                } else if (info.offset.x < -swipeThreshold) {
                  // Swiped left -> Reject
                  handleReject(exp.id);
                }
              }}
              whileTap={{ cursor: 'grabbing', scale: 0.98 }}
              className="glass-card p-5 flex flex-col gap-3 relative z-10 bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 cursor-grab will-change-transform shadow-xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{exp.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{exp.employeeName} · {exp.categoryName}</p>
                </div>
                <span className="text-lg font-bold text-foreground">${Number(exp.amount).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">{exp.currency}</Badge>
                <span>{new Date(exp.expenseDate).toLocaleDateString()}</span>
                {exp.merchantName && <span>· {exp.merchantName}</span>}
              </div>
              <div className="flex gap-2 mt-auto pt-2">
                <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => navigate(`/expenses/${exp.id}`)}>
                  <Eye className="w-3 h-3" /> View Detail
                </Button>
                <div className="hidden sm:flex flex-1 items-center justify-center text-xs text-zinc-500 opacity-60">
                  <motion.span animate={{ x: [-5, 5, -5] }} transition={{ repeat: Infinity, duration: 2 }}>←</motion.span>
                  <span className="mx-2">Swipe to Act</span>
                  <motion.span animate={{ x: [5, -5, 5] }} transition={{ repeat: Infinity, duration: 2 }}>→</motion.span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </motion.div>

      {pendingExpenses.length === 0 && (
        <motion.div variants={fadeUp} className="glass-card">
          <RoleEmptyState entity="approvals" />
        </motion.div>
      )}
    </motion.div>
  );
};

export default ApprovalsPage;
