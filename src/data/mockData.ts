import type { User, Expense, ExpenseCategory, Notification, DashboardStats, ApprovalLog, ApprovalRule, ActivityItem } from '@/types';

export const mockUsers: User[] = [
  { id: 'u1', companyId: 'c1', email: 'admin@acme.com', firstName: 'Sarah', lastName: 'Chen', role: 'admin', isActive: true, lastLogin: '2026-03-29T10:00:00Z', avatar: '', createdAt: '2025-01-01' },
  { id: 'u2', companyId: 'c1', email: 'manager@acme.com', firstName: 'James', lastName: 'Rodriguez', role: 'manager', isActive: true, lastLogin: '2026-03-29T09:30:00Z', avatar: '', createdAt: '2025-01-15' },
  { id: 'u3', companyId: 'c1', email: 'john@acme.com', firstName: 'John', lastName: 'Smith', role: 'employee', managerId: 'u2', isActive: true, lastLogin: '2026-03-28T14:00:00Z', avatar: '', createdAt: '2025-02-01' },
  { id: 'u4', companyId: 'c1', email: 'emma@acme.com', firstName: 'Emma', lastName: 'Wilson', role: 'employee', managerId: 'u2', isActive: true, lastLogin: '2026-03-29T08:00:00Z', avatar: '', createdAt: '2025-02-15' },
  { id: 'u5', companyId: 'c1', email: 'mike@acme.com', firstName: 'Mike', lastName: 'Johnson', role: 'employee', managerId: 'u2', isActive: false, lastLogin: '2026-03-15T10:00:00Z', avatar: '', createdAt: '2025-03-01' },
  { id: 'u6', companyId: 'c1', email: 'lisa@acme.com', firstName: 'Lisa', lastName: 'Park', role: 'manager', isActive: true, lastLogin: '2026-03-29T07:00:00Z', avatar: '', createdAt: '2025-01-20' },
];

export const mockCategories: ExpenseCategory[] = [
  { id: 'cat1', name: 'Travel', icon: 'Plane', description: 'Flights, hotels, transportation', isActive: true },
  { id: 'cat2', name: 'Meals & Entertainment', icon: 'UtensilsCrossed', description: 'Business meals and client entertainment', isActive: true },
  { id: 'cat3', name: 'Office Supplies', icon: 'Package', description: 'Stationery, equipment, furniture', isActive: true },
  { id: 'cat4', name: 'Software', icon: 'Monitor', description: 'Subscriptions and licenses', isActive: true },
  { id: 'cat5', name: 'Training', icon: 'GraduationCap', description: 'Courses, certifications, conferences', isActive: true },
  { id: 'cat6', name: 'Miscellaneous', icon: 'MoreHorizontal', description: 'Other business expenses', isActive: true },
];

export const mockExpenses: Expense[] = [
  { id: 'e1', employeeId: 'u3', employeeName: 'John Smith', categoryId: 'cat1', categoryName: 'Travel', amount: 1250.00, currency: 'USD', amountInBaseCurrency: 1250.00, description: 'Flight to NYC for client meeting', expenseDate: '2026-03-25', merchantName: 'Delta Airlines', status: 'pending', currentApprovalStep: 0, totalApprovalSteps: 2, isOcrProcessed: true, ocrConfidence: 94.5, submittedAt: '2026-03-26T10:00:00Z', createdAt: '2026-03-25' },
  { id: 'e2', employeeId: 'u3', employeeName: 'John Smith', categoryId: 'cat2', categoryName: 'Meals & Entertainment', amount: 85.50, currency: 'USD', amountInBaseCurrency: 85.50, description: 'Client dinner at Nobu', expenseDate: '2026-03-26', merchantName: 'Nobu Restaurant', status: 'approved', currentApprovalStep: 2, totalApprovalSteps: 2, isOcrProcessed: true, ocrConfidence: 97.2, submittedAt: '2026-03-27T08:00:00Z', approvedAt: '2026-03-27T14:00:00Z', createdAt: '2026-03-26' },
  { id: 'e3', employeeId: 'u4', employeeName: 'Emma Wilson', categoryId: 'cat4', categoryName: 'Software', amount: 299.00, currency: 'USD', amountInBaseCurrency: 299.00, description: 'Figma annual subscription renewal', expenseDate: '2026-03-20', merchantName: 'Figma Inc.', status: 'approved', currentApprovalStep: 1, totalApprovalSteps: 1, isOcrProcessed: false, submittedAt: '2026-03-20T09:00:00Z', approvedAt: '2026-03-21T11:00:00Z', createdAt: '2026-03-20' },
  { id: 'e4', employeeId: 'u4', employeeName: 'Emma Wilson', categoryId: 'cat5', categoryName: 'Training', amount: 4500.00, currency: 'USD', amountInBaseCurrency: 4500.00, description: 'React Advanced Conference + Workshop', expenseDate: '2026-03-15', merchantName: 'React Conf', status: 'pending', currentApprovalStep: 1, totalApprovalSteps: 3, isOcrProcessed: true, ocrConfidence: 88.0, submittedAt: '2026-03-16T10:00:00Z', createdAt: '2026-03-15' },
  { id: 'e5', employeeId: 'u3', employeeName: 'John Smith', categoryId: 'cat3', categoryName: 'Office Supplies', amount: 42.99, currency: 'USD', amountInBaseCurrency: 42.99, description: 'USB-C hub and cables', expenseDate: '2026-03-22', merchantName: 'Amazon', status: 'paid', currentApprovalStep: 1, totalApprovalSteps: 1, isOcrProcessed: true, ocrConfidence: 99.1, submittedAt: '2026-03-22T16:00:00Z', approvedAt: '2026-03-23T09:00:00Z', paidAt: '2026-03-25T12:00:00Z', createdAt: '2026-03-22' },
  { id: 'e6', employeeId: 'u5', employeeName: 'Mike Johnson', categoryId: 'cat1', categoryName: 'Travel', amount: 320.00, currency: 'EUR', amountInBaseCurrency: 348.80, description: 'Train tickets to Berlin office', expenseDate: '2026-03-18', merchantName: 'Deutsche Bahn', status: 'rejected', currentApprovalStep: 1, totalApprovalSteps: 2, isOcrProcessed: false, submittedAt: '2026-03-19T07:00:00Z', rejectedAt: '2026-03-19T15:00:00Z', createdAt: '2026-03-18' },
  { id: 'e7', employeeId: 'u4', employeeName: 'Emma Wilson', categoryId: 'cat2', categoryName: 'Meals & Entertainment', amount: 156.00, currency: 'USD', amountInBaseCurrency: 156.00, description: 'Team lunch for Q1 review', expenseDate: '2026-03-28', merchantName: 'The Capital Grille', status: 'draft', currentApprovalStep: 0, totalApprovalSteps: 0, isOcrProcessed: false, createdAt: '2026-03-28' },
  { id: 'e8', employeeId: 'u3', employeeName: 'John Smith', categoryId: 'cat6', categoryName: 'Miscellaneous', amount: 75.00, currency: 'USD', amountInBaseCurrency: 75.00, description: 'Parking fees - downtown lot', expenseDate: '2026-03-27', merchantName: 'CityPark', status: 'pending', currentApprovalStep: 0, totalApprovalSteps: 1, isOcrProcessed: true, ocrConfidence: 91.3, submittedAt: '2026-03-28T10:00:00Z', createdAt: '2026-03-27' },
];

export const mockApprovalLogs: ApprovalLog[] = [
  { id: 'al1', expenseId: 'e2', approverId: 'u2', approverName: 'James Rodriguez', action: 'approved', comments: 'Client meeting verified', stepNumber: 1, createdAt: '2026-03-27T12:00:00Z' },
  { id: 'al2', expenseId: 'e2', approverId: 'u1', approverName: 'Sarah Chen', action: 'approved', comments: 'Within budget', stepNumber: 2, createdAt: '2026-03-27T14:00:00Z' },
  { id: 'al3', expenseId: 'e3', approverId: 'u2', approverName: 'James Rodriguez', action: 'approved', comments: 'Approved - valid subscription', stepNumber: 1, createdAt: '2026-03-21T11:00:00Z' },
  { id: 'al4', expenseId: 'e6', approverId: 'u2', approverName: 'James Rodriguez', action: 'rejected', comments: 'Missing travel approval form', stepNumber: 1, createdAt: '2026-03-19T15:00:00Z' },
  { id: 'al5', expenseId: 'e4', approverId: 'u2', approverName: 'James Rodriguez', action: 'approved', comments: 'Good for professional development', stepNumber: 1, createdAt: '2026-03-17T10:00:00Z' },
  { id: 'al6', expenseId: 'e5', approverId: 'u2', approverName: 'James Rodriguez', action: 'approved', stepNumber: 1, createdAt: '2026-03-23T09:00:00Z' },
];

export const mockNotifications: Notification[] = [
  { id: 'n1', userId: 'u2', expenseId: 'e1', type: 'expense_submitted', title: 'New Expense', message: 'John Smith submitted a $1,250.00 travel expense', isRead: false, createdAt: '2026-03-26T10:00:00Z' },
  { id: 'n2', userId: 'u2', expenseId: 'e4', type: 'expense_submitted', title: 'New Expense', message: 'Emma Wilson submitted a $4,500.00 training expense', isRead: false, createdAt: '2026-03-16T10:00:00Z' },
  { id: 'n3', userId: 'u3', expenseId: 'e2', type: 'expense_approved', title: 'Expense Approved', message: 'Your dinner expense of $85.50 was approved', isRead: true, createdAt: '2026-03-27T14:00:00Z' },
  { id: 'n4', userId: 'u2', expenseId: 'e8', type: 'expense_submitted', title: 'New Expense', message: 'John Smith submitted a $75.00 parking expense', isRead: false, createdAt: '2026-03-28T10:00:00Z' },
  { id: 'n5', userId: 'u5', expenseId: 'e6', type: 'expense_rejected', title: 'Expense Rejected', message: 'Your travel expense was rejected - missing form', isRead: true, createdAt: '2026-03-19T15:00:00Z' },
];

export const mockApprovalRules: ApprovalRule[] = [
  { id: 'ar1', name: 'Small Expenses', minAmount: 0, maxAmount: 100, approvalType: 'sequential', isManagerApprovalRequired: true, isActive: true },
  { id: 'ar2', name: 'Medium Expenses', minAmount: 100, maxAmount: 1000, approvalType: 'sequential', isManagerApprovalRequired: true, isActive: true },
  { id: 'ar3', name: 'Large Expenses', minAmount: 1000, maxAmount: 5000, approvalType: 'sequential', isManagerApprovalRequired: true, isActive: true },
  { id: 'ar4', name: 'Executive Expenses', minAmount: 5000, maxAmount: 999999, approvalType: 'hybrid', requiredApprovalPercentage: 60, isManagerApprovalRequired: true, isActive: true },
];

const recentActivity: ActivityItem[] = [
  { id: 'a1', type: 'expense_submitted', description: 'John Smith submitted a travel expense', timestamp: '2026-03-28T10:00:00Z', user: 'John Smith' },
  { id: 'a2', type: 'expense_approved', description: 'Client dinner expense approved by James Rodriguez', timestamp: '2026-03-27T14:00:00Z', user: 'James Rodriguez' },
  { id: 'a3', type: 'expense_rejected', description: 'Train ticket expense rejected', timestamp: '2026-03-19T15:00:00Z', user: 'James Rodriguez' },
  { id: 'a4', type: 'expense_submitted', description: 'Emma Wilson submitted a training expense', timestamp: '2026-03-16T10:00:00Z', user: 'Emma Wilson' },
  { id: 'a5', type: 'user_created', description: 'New employee Mike Johnson added', timestamp: '2026-03-01T09:00:00Z', user: 'Sarah Chen' },
];

export const mockDashboardStats: DashboardStats = {
  totalExpenses: 8,
  pendingApprovals: 3,
  approvedAmount: 4877.49,
  rejectedCount: 1,
  averageExpense: 841.06,
  monthlyTrend: [
    { month: 'Oct', amount: 3200, count: 5 },
    { month: 'Nov', amount: 4500, count: 8 },
    { month: 'Dec', amount: 6100, count: 12 },
    { month: 'Jan', amount: 5200, count: 9 },
    { month: 'Feb', amount: 4800, count: 7 },
    { month: 'Mar', amount: 6728, count: 8 },
  ],
  categoryBreakdown: [
    { category: 'Travel', amount: 1598.80, percentage: 35 },
    { category: 'Meals', amount: 241.50, percentage: 12 },
    { category: 'Software', amount: 299.00, percentage: 8 },
    { category: 'Training', amount: 4500.00, percentage: 35 },
    { category: 'Office', amount: 42.99, percentage: 3 },
    { category: 'Other', amount: 75.00, percentage: 7 },
  ],
  statusDistribution: [
    { status: 'Pending', count: 3 },
    { status: 'Approved', count: 2 },
    { status: 'Rejected', count: 1 },
    { status: 'Paid', count: 1 },
    { status: 'Draft', count: 1 },
  ],
  recentActivity,
};
