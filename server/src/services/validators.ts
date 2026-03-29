// =============================================================
// ZOD VALIDATION SCHEMAS - Request validation for all endpoints
// =============================================================
import { z } from 'zod';

// ---- Auth Schemas ----
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// ---- Expense Schemas ----
export const createExpenseSchema = z.object({
  description: z.string().min(3, 'Description must be at least 3 characters').max(500),
  amount: z.number().positive('Amount must be positive').max(999999.99, 'Amount too large'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD']),
  categoryId: z.string().uuid('Invalid category ID'),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  merchantName: z.string().max(255).optional(),
  status: z.enum(['draft', 'pending']).optional().default('pending'),
  receiptUrl: z.string().url().optional(),
});

export const approveExpenseSchema = z.object({
  comments: z.string().max(1000).optional(),
});

export const rejectExpenseSchema = z.object({
  comments: z.string().min(1, 'Rejection reason is required').max(1000),
});

// ---- User Schemas ----
export const createUserSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name required').max(100),
  lastName: z.string().min(1, 'Last name required').max(100),
  role: z.enum(['admin', 'manager', 'employee']),
  managerId: z.string().uuid().optional().nullable(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  role: z.enum(['admin', 'manager', 'employee']).optional(),
  managerId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

// ---- Category Schemas ----
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name required').max(100),
  description: z.string().max(500).optional(),
});

// ---- Query Params ----
export const expenseQuerySchema = z.object({
  status: z.enum(['all', 'draft', 'pending', 'approved', 'rejected', 'paid']).optional(),
  category_id: z.string().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// ---- Export Types ----
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type ApproveExpenseInput = z.infer<typeof approveExpenseSchema>;
export type RejectExpenseInput = z.infer<typeof rejectExpenseSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type ExpenseQueryInput = z.infer<typeof expenseQuerySchema>;
