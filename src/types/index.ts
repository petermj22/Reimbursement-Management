export type UserRole = 'admin' | 'manager' | 'employee';

export type ExpenseStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'paid';

export type ApprovalType = 'sequential' | 'percentage' | 'specific' | 'hybrid';

export interface User {
  id: string;
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  managerId?: string;
  isActive: boolean;
  lastLogin?: string;
  avatar?: string;
  createdAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  description?: string;
  isActive: boolean;
}

export interface Expense {
  id: string;
  employeeId: string;
  employeeName: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  currency: string;
  amountInBaseCurrency: number;
  description: string;
  expenseDate: string;
  receiptUrl?: string;
  merchantName?: string;
  status: ExpenseStatus;
  currentApprovalStep: number;
  totalApprovalSteps: number;
  isOcrProcessed: boolean;
  ocrConfidence?: number;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  paidAt?: string;
  createdAt: string;
}

export interface ApprovalLog {
  id: string;
  expenseId: string;
  approverId: string;
  approverName: string;
  action: 'approved' | 'rejected' | 'escalated';
  comments?: string;
  stepNumber: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  expenseId?: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardStats {
  totalExpenses: number;
  pendingApprovals: number;
  approvedAmount: number;
  rejectedCount: number;
  averageExpense: number;
  monthlyTrend: { month: string; amount: number; count: number }[];
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
  statusDistribution: { status: string; count: number }[];
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'expense_submitted' | 'expense_approved' | 'expense_rejected' | 'user_created';
  description: string;
  timestamp: string;
  user: string;
  avatar?: string;
}

export interface ApprovalRule {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  approvalType: ApprovalType;
  requiredApprovalPercentage?: number;
  isManagerApprovalRequired: boolean;
  isActive: boolean;
}
