import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { StatCard } from '@/components/dashboard/StatCard';
import { StatusBadge } from '@/components/expenses/StatusBadge';
import { mockDashboardStats, mockExpenses } from '@/data/mockData';
import { Receipt, Clock, CheckCircle2, XCircle, DollarSign, TrendingUp, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useNavigate } from 'react-router-dom';

const COLORS = ['hsl(38 92% 50%)', 'hsl(152 60% 40%)', 'hsl(0 72% 51%)', 'hsl(200 80% 50%)', 'hsl(220 14% 80%)'];

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const stats = mockDashboardStats;
  const isEmployee = user?.role === 'employee';

  const relevantExpenses = isEmployee
    ? mockExpenses.filter(e => e.employeeId === user?.id)
    : mockExpenses;

  const pendingExpenses = relevantExpenses.filter(e => e.status === 'pending');

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8">
      {/* Header */}
      <motion.div variants={fadeUp} className="page-header">
        <h1 className="page-title">
          Welcome back, {user?.firstName} 👋
        </h1>
        <p className="page-description">
          {isEmployee ? "Here's an overview of your expenses" : "Here's what's happening across the organization"}
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Expenses"
          value={relevantExpenses.length}
          icon={Receipt}
          trend={{ value: 12, positive: true }}
          gradient="var(--gradient-primary)"
        />
        <StatCard
          title="Pending Approvals"
          value={pendingExpenses.length}
          icon={Clock}
          subtitle="Awaiting review"
          gradient="var(--gradient-warning)"
        />
        <StatCard
          title="Approved Amount"
          value={`$${stats.approvedAmount.toLocaleString()}`}
          icon={CheckCircle2}
          trend={{ value: 8, positive: true }}
          gradient="var(--gradient-success)"
        />
        <StatCard
          title={isEmployee ? 'Avg. Expense' : 'Rejected'}
          value={isEmployee ? `$${stats.averageExpense.toFixed(0)}` : stats.rejectedCount}
          icon={isEmployee ? DollarSign : XCircle}
          gradient={isEmployee ? 'var(--gradient-primary)' : 'var(--gradient-danger)'}
        />
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend */}
        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Monthly Expense Trend</h3>
              <p className="text-xs text-muted-foreground">Last 6 months</p>
            </div>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-6">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={stats.statusDistribution} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                {stats.statusDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2">
            {stats.statusDistribution.map((item, i) => (
              <div key={item.status} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-muted-foreground">{item.status} ({item.count})</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Recent Expenses */}
      <motion.div variants={fadeUp} className="glass-card">
        <div className="flex items-center justify-between p-6 pb-4">
          <h3 className="text-sm font-semibold text-foreground">Recent Expenses</h3>
          <button onClick={() => navigate('/expenses')} className="text-xs text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-border">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Description</th>
                {!isEmployee && <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Employee</th>}
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Category</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {relevantExpenses.slice(0, 5).map(expense => (
                <tr key={expense.id} className="border-t border-border/50 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/expenses/${expense.id}`)}>
                  <td className="px-6 py-3.5">
                    <p className="text-sm font-medium text-foreground">{expense.description}</p>
                    <p className="text-xs text-muted-foreground">{expense.merchantName}</p>
                  </td>
                  {!isEmployee && <td className="px-6 py-3.5 text-sm text-foreground">{expense.employeeName}</td>}
                  <td className="px-6 py-3.5 text-sm text-muted-foreground">{expense.categoryName}</td>
                  <td className="px-6 py-3.5 text-sm font-semibold text-foreground text-right">
                    ${expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-3.5"><StatusBadge status={expense.status} /></td>
                  <td className="px-6 py-3.5 text-sm text-muted-foreground">{expense.expenseDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={fadeUp} className="glass-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {stats.recentActivity.slice(0, 4).map((activity, i) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3"
            >
              <div className={`w-2 h-2 rounded-full mt-1.5 ${
                activity.type === 'expense_approved' ? 'bg-success' :
                activity.type === 'expense_rejected' ? 'bg-destructive' :
                'bg-primary'
              }`} />
              <div>
                <p className="text-sm text-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{new Date(activity.timestamp).toLocaleDateString()}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardPage;
