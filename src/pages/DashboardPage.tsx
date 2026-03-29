import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { DollarSign, Clock, CheckCircle, TrendingUp, Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useGetDashboardStatsQuery, useGetExpensesQuery } from '@/store';
import { useGsapAmountCounter, useGsapCounter, useGsapFadeInStagger } from '@/hooks/useGsapAnimations';
import { DashboardSkeleton } from '@/components/Skeletons';
import { toast } from 'sonner';

const ease = [0.22, 1, 0.36, 1] as const;
const fadeUp = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.8, ease } } };
const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

const chartStyle = {
  background: '#0a0a0a',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#fff',
  boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'
};

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  paid: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  draft: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading } = useGetDashboardStatsQuery();
  const { data: expensesData } = useGetExpensesQuery({ limit: 5 });

  const totalRef = useGsapCounter(stats?.totalExpenses || 0);
  const pendingRef = useGsapCounter(stats?.pendingApprovals || 0);
  const approvedRef = useGsapAmountCounter(stats?.approvedAmount || 0);
  const avgRef = useGsapAmountCounter(stats?.averageExpense || 0);
  const statsContainerRef = useGsapFadeInStagger('.stat-card');

  if (isLoading || !stats) return <DashboardSkeleton />;

  const recentExpenses = expensesData?.expenses || [];

  const handleExportCSV = () => {
    if (!recentExpenses.length) {
      toast.error('No expenses to export.');
      return;
    }
    const headers = ['ID', 'Date', 'Description', 'Amount', 'Status', 'Submitter'];
    const rows = recentExpenses.map(exp => [
      exp.id,
      exp.expenseDate,
      `"${exp.description.replace(/"/g, '""')}"`,
      exp.amount,
      exp.status,
      exp.employeeName
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `expense_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Report exported successfully to CSV');
  };

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white mb-1">
            Overview
          </h1>
          <p className="text-zinc-500 text-sm">Welcome back, {user?.firstName}. Here is what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleExportCSV} variant="outline" className="border-white/10 text-white hover:bg-white/5 h-9 text-sm font-medium">
            Export Report
          </Button>
          <Button onClick={() => navigate('/expenses/new')} className="bg-white text-black hover:bg-zinc-200 border-0 rounded-lg px-4 h-9 flex items-center gap-2 transition-all font-medium text-sm">
            <Plus className="w-4 h-4" /> 
            New Expense
          </Button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div ref={statsContainerRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Expenses', ref: totalRef, icon: DollarSign, sub: '+12% from last month' },
          { label: 'Pending Approvals', ref: pendingRef, icon: Clock, sub: 'Needs your attention' },
          { label: 'Approved Amount', ref: approvedRef, icon: CheckCircle, sub: 'Cleared this month' },
          { label: 'Average Claim', ref: avgRef, icon: TrendingUp, sub: 'Per transaction' },
        ].map((item, idx) => (
          <div key={item.label} className="stat-card border border-white/5 bg-[#111] rounded-xl p-5 hover:bg-[#151515] transition-colors duration-300">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-zinc-400">{item.label}</p>
              <item.icon className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="text-2xl font-semibold text-white tracking-tight mb-1">
              <span ref={item.ref}>0</span>
            </div>
            <p className="text-xs text-zinc-500">
              {item.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Box */}
      <motion.div 
        initial="hidden" 
        whileInView="show" 
        viewport={{ once: true, margin: "-50px" }} 
        variants={fadeUp} 
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        <div className="lg:col-span-2 border border-white/5 bg-[#111] rounded-xl p-6 relative overflow-hidden group">
          <motion.div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <h3 className="text-sm font-medium text-white">Expense Trend</h3>
              <p className="text-xs text-zinc-500">Six month trailing</p>
            </div>
          </div>
          <div className="h-[260px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyTrend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip contentStyle={chartStyle} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="amount" stroke="#8b5cf6" fill="url(#colorAmt)" strokeWidth={3} activeDot={{ r: 6, fill: '#fff', stroke: '#8b5cf6', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border border-white/5 bg-[#111] rounded-xl p-6 flex flex-col relative overflow-hidden group">
          <motion.div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
          <h3 className="text-sm font-medium text-white mb-1 relative z-10">By Category</h3>
          <p className="text-xs text-zinc-500 mb-6 relative z-10">Distribution breakdown</p>
          <div className="flex-1 flex flex-col items-center justify-center relative z-10">
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={stats.categoryBreakdown} 
                    dataKey="amount" 
                    nameKey="category" 
                    cx="50%" cy="50%" 
                    innerRadius={60} 
                    outerRadius={80} 
                    paddingAngle={4}
                    stroke="rgba(0,0,0,0.5)"
                    strokeWidth={2}
                  >
                    {stats.categoryBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={chartStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="w-full space-y-2.5 mt-4">
              {stats.categoryBreakdown.slice(0, 3).map((c, i) => (
                <div key={c.category} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-zinc-400">{c.category}</span>
                  </div>
                  <span className="text-white font-medium">{c.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Activity Stream */}
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }} variants={fadeUp} className="border border-white/5 bg-[#111] rounded-xl overflow-hidden mt-6">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h3 className="text-sm font-medium text-white">Recent Activity</h3>
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white h-8 text-xs font-medium" onClick={() => navigate('/expenses')}>
            View all
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Submitter', 'Description', 'Amount', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentExpenses.map((exp) => (
                <tr 
                  key={exp.id} 
                  className="hover:bg-white/[0.04] transition-colors cursor-pointer group" 
                  onClick={() => navigate(`/expenses/${exp.id}`)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-medium text-zinc-300 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                        {exp.employeeName.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-zinc-200">{exp.employeeName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-400 truncate max-w-[250px] group-hover:text-zinc-300 transition-colors">{exp.description}</td>
                  <td className="px-6 py-4 text-sm font-medium text-white">
                    ${Number(exp.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={`${statusStyles[exp.status]} px-2 py-0.5 text-[10px] uppercase font-medium border-0 bg-transparent p-0 relative`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 inline-block animate-pulse duration-[3000ms] ${exp.status === 'pending' ? 'bg-amber-500' : exp.status === 'approved' ? 'bg-emerald-500' : exp.status === 'rejected' ? 'bg-rose-500' : 'bg-zinc-500'}`} />
                      {exp.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors flex items-center gap-2">
                    {new Date(exp.expenseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}
                    <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardPage;
