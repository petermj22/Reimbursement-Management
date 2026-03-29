import React from 'react';
import { motion } from 'framer-motion';
import { mockDashboardStats, mockExpenses } from '@/data/mockData';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { TrendingUp, DollarSign, Clock, Users } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const COLORS = ['hsl(225, 73%, 57%)', 'hsl(152, 60%, 40%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(262, 60%, 55%)', 'hsl(200, 80%, 50%)'];

const chartStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
};

const approvalTimeData = [
  { month: 'Oct', hours: 18 },
  { month: 'Nov', hours: 14 },
  { month: 'Dec', hours: 22 },
  { month: 'Jan', hours: 12 },
  { month: 'Feb', hours: 9 },
  { month: 'Mar', hours: 7 },
];

const topSpenders = [
  { name: 'John Smith', amount: 1453.49, count: 4 },
  { name: 'Emma Wilson', amount: 4955.00, count: 3 },
  { name: 'Mike Johnson', amount: 348.80, count: 1 },
];

const AnalyticsPage: React.FC = () => {
  const stats = mockDashboardStats;

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="space-y-6">
      <motion.div variants={fadeUp}>
        <h1 className="page-title">Analytics</h1>
        <p className="page-description">Expense trends, insights, and performance metrics</p>
      </motion.div>

      {/* KPI cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Spend (6mo)', value: '$30,528', icon: DollarSign, gradient: 'var(--gradient-primary)' },
          { label: 'Avg. Approval Time', value: '13.7 hrs', icon: Clock, gradient: 'var(--gradient-warning)' },
          { label: 'Approval Rate', value: '87.5%', icon: TrendingUp, gradient: 'var(--gradient-success)' },
          { label: 'Active Users', value: '5', icon: Users, gradient: 'var(--gradient-primary)' },
        ].map(kpi => (
          <div key={kpi.label} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-xl font-bold text-foreground mt-1">{kpi.value}</p>
              </div>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: kpi.gradient }}>
                <kpi.icon className="w-4 h-4 text-primary-foreground" />
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Charts row 1 */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Monthly Expense Trend</h3>
          <p className="text-xs text-muted-foreground mb-6">Amount and volume over time</p>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={stats.monthlyTrend}>
              <defs>
                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(225, 73%, 57%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(225, 73%, 57%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={chartStyle} />
              <Area type="monotone" dataKey="amount" stroke="hsl(225, 73%, 57%)" fill="url(#colorAmount)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Category Breakdown</h3>
          <p className="text-xs text-muted-foreground mb-6">Spending distribution by category</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={stats.categoryBreakdown} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={90} paddingAngle={3}>
                {stats.categoryBreakdown.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={chartStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2">
            {stats.categoryBreakdown.map((item, i) => (
              <div key={item.category} className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-muted-foreground">{item.category} ({item.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Charts row 2 */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Avg. Approval Time</h3>
          <p className="text-xs text-muted-foreground mb-6">Hours to approve, trending down</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={approvalTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={chartStyle} />
              <Line type="monotone" dataKey="hours" stroke="hsl(152, 60%, 40%)" strokeWidth={2} dot={{ fill: 'hsl(152, 60%, 40%)', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">Top Spenders</h3>
          <p className="text-xs text-muted-foreground mb-6">Employees by total expense amount</p>
          <div className="space-y-4">
            {topSpenders.sort((a, b) => b.amount - a.amount).map((spender, i) => (
              <div key={spender.name} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{spender.name}</span>
                    <span className="text-sm font-bold text-foreground">${spender.amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(spender.amount / 5000) * 100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.2 }}
                      className="h-full rounded-full"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{spender.count} expenses</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AnalyticsPage;
