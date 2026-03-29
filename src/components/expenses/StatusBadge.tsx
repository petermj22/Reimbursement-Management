import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { ExpenseStatus } from '@/types';

const statusConfig: Record<ExpenseStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground border-border' },
  pending: { label: 'Pending', className: 'bg-warning/10 text-warning border-warning/30' },
  approved: { label: 'Approved', className: 'bg-success/10 text-success border-success/30' },
  rejected: { label: 'Rejected', className: 'bg-destructive/10 text-destructive border-destructive/30' },
  paid: { label: 'Paid', className: 'bg-info/10 text-info border-info/30' },
};

export const StatusBadge: React.FC<{ status: ExpenseStatus }> = ({ status }) => {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={`${config.className} text-xs font-medium`}>
      {config.label}
    </Badge>
  );
};
