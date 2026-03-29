// =============================================================
// SKELETON LOADING COMPONENTS - Shimmer loading states
// =============================================================
import React from 'react';
import { motion } from 'framer-motion';

const shimmer = {
  initial: { backgroundPosition: '-468px 0' },
  animate: { backgroundPosition: '468px 0' },
};

const Shimmer: React.FC<{ className?: string }> = ({ className = '' }) => (
  <motion.div
    className={`bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:468px_100%] rounded-md ${className}`}
    initial={shimmer.initial}
    animate={shimmer.animate}
    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
  />
);

export const StatCardSkeleton: React.FC = () => (
  <div className="stat-card space-y-3">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Shimmer className="h-3 w-20" />
        <Shimmer className="h-7 w-16" />
      </div>
      <Shimmer className="h-10 w-10 rounded-lg" />
    </div>
    <Shimmer className="h-3 w-24" />
  </div>
);

export const TableRowSkeleton: React.FC = () => (
  <tr className="border-t border-border/50">
    <td className="px-6 py-3.5"><div className="flex items-center gap-3"><Shimmer className="h-8 w-8 rounded-full" /><div className="space-y-1.5"><Shimmer className="h-3 w-24" /><Shimmer className="h-2 w-32" /></div></div></td>
    <td className="px-6 py-3.5"><Shimmer className="h-4 w-16" /></td>
    <td className="px-6 py-3.5"><Shimmer className="h-5 w-16 rounded-full" /></td>
    <td className="px-6 py-3.5"><Shimmer className="h-3 w-20" /></td>
    <td className="px-6 py-3.5"><Shimmer className="h-3 w-14" /></td>
  </tr>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="space-y-2">
      <Shimmer className="h-8 w-48" />
      <Shimmer className="h-4 w-64" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="glass-card p-6"><Shimmer className="h-4 w-32 mb-4" /><Shimmer className="h-48 w-full rounded-lg" /></div>
      <div className="glass-card p-6"><Shimmer className="h-4 w-32 mb-4" /><Shimmer className="h-48 w-full rounded-lg" /></div>
    </div>
  </div>
);

export const ExpenseListSkeleton: React.FC = () => (
  <div className="table-container">
    <table className="w-full">
      <thead>
        <tr className="bg-muted/30">
          {['Employee', 'Amount', 'Status', 'Category', 'Date'].map(h => (
            <th key={h} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{[...Array(5)].map((_, i) => <TableRowSkeleton key={i} />)}</tbody>
    </table>
  </div>
);

export const CardSkeleton: React.FC = () => (
  <div className="glass-card p-6 space-y-4">
    <Shimmer className="h-5 w-32" />
    <Shimmer className="h-3 w-full" />
    <Shimmer className="h-3 w-3/4" />
    <div className="flex gap-2 pt-2">
      <Shimmer className="h-8 w-20 rounded-md" />
      <Shimmer className="h-8 w-20 rounded-md" />
    </div>
  </div>
);

export const ChartSkeleton: React.FC = () => (
  <div className="glass-card p-6">
    <Shimmer className="h-4 w-40 mb-2" />
    <Shimmer className="h-3 w-56 mb-6" />
    <div className="flex items-end gap-2 h-48">
      {[40, 70, 55, 85, 60, 90, 45, 75, 50, 80, 65, 70].map((h, i) => (
        <Shimmer key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%` }} />
      ))}
    </div>
  </div>
);

export { Shimmer };
