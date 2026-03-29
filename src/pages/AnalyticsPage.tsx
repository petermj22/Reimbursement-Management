// =============================================================
// ANALYTICS PAGE - Enhanced with 3D Timeline, Sankey, Heatmap
// =============================================================
import React, { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { TrendingUp, DollarSign, Clock, Users, Layers, GitBranch, Calendar } from 'lucide-react';
import { useGetDashboardStatsQuery, useGetTopSpendersQuery } from '@/store';
import { useGsapAmountCounter, useGsapCounter } from '@/hooks/useGsapAnimations';
import { DashboardSkeleton, ChartSkeleton } from '@/components/Skeletons';
import { ApprovalSankey } from '@/components/viz/ApprovalSankey';
import { HeatmapCalendar } from '@/components/viz/HeatmapCalendar';
import { RoleEmptyState } from '@/components/EmptyStates';

// 3D Timeline — lazy loaded (heavy Three.js bundle)
const ExpenseTimeline3D = lazy(() =>
  import('@/components/viz/ExpenseTimeline3D').then(m => ({ default: m.ExpenseTimeline3D }))
);

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const COLORS = ['hsl(225,73%,57%)', 'hsl(152,60%,40%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)', 'hsl(262,60%,55%)', 'hsl(200,80%,50%)'];
const chartStyle = { background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: '12px', color: '#e4e4e7' };

const approvalTimeData = [
  { month: 'Oct', hours: 18 }, { month: 'Nov', hours: 14 }, { month: 'Dec', hours: 22 },
  { month: 'Jan', hours: 12 }, { month: 'Feb', hours: 9 },  { month: 'Mar', hours: 7 },
];

// Mini loading skeleton for lazy 3D component
const ThreeDLoader: React.FC = () => (
  <div className="h-[420px] border border-white/5 bg-[#0a0a10] rounded-2xl flex items-center justify-center">
    <div className="text-center space-y-3">
      <div className="flex gap-2 justify-center">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-indigo-500/50 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <p className="text-xs text-zinc-600">Initializing 3D renderer…</p>
    </div>
  </div>
);

// Section header component
const SectionHeader: React.FC<{ icon: React.FC<{ className?: string }>; title: string; badge?: string }> = ({ icon: Icon, title, badge }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-7 h-7 rounded-lg bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center">
      <Icon className="w-3.5 h-3.5 text-indigo-400" />
    </div>
    <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
    {badge && (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/20">
        {badge}
      </span>
    )}
  </div>
);

const AnalyticsPage: React.FC = () => {
  const { data: stats, isLoading } = useGetDashboardStatsQuery();
  const { data: topSpenders = [] } = useGetTopSpendersQuery();

  const totalSpend = stats?.monthlyTrend?.reduce((s: number, m) => s + m.amount, 0) || 0;
  const approvalRate = stats && stats.totalExpenses > 0
    ? (((stats.totalExpenses - stats.rejectedCount) / stats.totalExpenses) * 100).toFixed(1)
    : '0';

  const totalSpendRef = useGsapAmountCounter(totalSpend);
  const totalExpRef = useGsapCounter(stats?.totalExpenses || 0);

  if (isLoading || !stats) return <DashboardSkeleton />;

  const hasData = stats.totalExpenses > 0;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      className="space-y-8"
    >
      {/* Page Header */}
      <motion.div variants={fadeUp}>
        <h1 className="page-title">Analytics</h1>
        <p className="page-description">Expense trends, insights, and interactive visualizations</p>
      </motion.div>

      {/* KPI Strip */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Spend', ref: totalSpendRef, icon: DollarSign, gradient: 'var(--gradient-primary)', prefix: '$' },
          { label: 'Avg. Approval Time', value: '13.7 hrs', icon: Clock, gradient: 'var(--gradient-warning)' },
          { label: 'Approval Rate', value: `${approvalRate}%`, icon: TrendingUp, gradient: 'var(--gradient-success)' },
          { label: 'Total Expenses', ref: totalExpRef, icon: Users, gradient: 'var(--gradient-primary)' },
        ].map(kpi => (
          <motion.div key={kpi.label} variants={fadeUp} className="stat-card" whileHover={{ y: -2 }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {kpi.ref ? <span ref={kpi.ref}>0</span> : kpi.value}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: kpi.gradient }}>
                <kpi.icon className="w-4 h-4 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── SECTION: Standard Charts ── */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Monthly Expense Trend</h3>
          <p className="text-xs text-muted-foreground mb-5">6-month spend overview</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={stats.monthlyTrend}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartStyle} />
              <Area type="monotone" dataKey="amount" stroke="#6366f1" fill="url(#colorAmount)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: '#6366f1' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Category Breakdown</h3>
          <p className="text-xs text-muted-foreground mb-5">Spend distribution this month</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={stats.categoryBreakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3} strokeWidth={0}>
                {stats.categoryBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={chartStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-3">
            {stats.categoryBreakdown.map((item, i) => (
              <div key={item.category} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-muted-foreground">{item.category} <span className="text-zinc-500">({item.percentage}%)</span></span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── SECTION: 3D Interactive Timeline ── */}
      <motion.div variants={fadeUp}>
        <SectionHeader icon={Layers} title="3D Expense Timeline" badge="Three.js" />
        {hasData ? (
          <Suspense fallback={<ThreeDLoader />}>
            <ExpenseTimeline3D />
          </Suspense>
        ) : (
          <div className="border border-white/5 bg-[#0a0a10] rounded-2xl">
            <RoleEmptyState entity="analytics" />
          </div>
        )}
      </motion.div>

      {/* ── SECTION: Approval Sankey + Approval Time side by side ── */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <SectionHeader icon={GitBranch} title="Approval Flow" badge="Live" />
          <ApprovalSankey />
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Avg. Approval Time</h3>
          <p className="text-xs text-muted-foreground mb-5">Hours — 6-month trend</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={approvalTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartStyle} formatter={(val) => [`${val}h`, 'Avg. Time']} />
              <Line type="monotone" dataKey="hours" stroke="#10b981" strokeWidth={2.5}
                dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
            <TrendingUp className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <p className="text-xs text-zinc-500">↓ <strong className="text-emerald-400">61% faster</strong> approvals over 6 months</p>
          </div>
        </div>
      </motion.div>

      {/* ── SECTION: Heatmap Calendar ── */}
      <motion.div variants={fadeUp}>
        <SectionHeader icon={Calendar} title="Submission Heatmap" badge="Click to filter" />
        <HeatmapCalendar />
      </motion.div>

      {/* ── SECTION: Top Spenders ── */}
      <motion.div variants={fadeUp} className="glass-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-1">Top Spenders</h3>
        <p className="text-xs text-muted-foreground mb-5">By total expense amount this month</p>
        <div className="space-y-4">
          {topSpenders.sort((a, b) => b.amount - a.amount).map((spender, i) => (
            <div key={spender.name} className="flex items-center gap-4 group">
              <div className="w-8 h-8 rounded-full bg-indigo-600/10 border border-indigo-500/15 flex items-center justify-center text-xs font-bold text-indigo-400">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-foreground">{spender.name}</span>
                  <span className="text-sm font-bold text-foreground font-mono">${spender.amount.toLocaleString()}</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((spender.amount / (topSpenders[0]?.amount || 1)) * 100, 100)}%` }}
                    transition={{ duration: 0.9, delay: 0.1 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                    className="h-full rounded-full"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                </div>
                <span className="text-[11px] text-muted-foreground">{spender.count} expenses</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AnalyticsPage;
