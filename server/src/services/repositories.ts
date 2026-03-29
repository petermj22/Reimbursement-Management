// =============================================================
// BACKEND SERVICE LAYER - Repository + Service Pattern
// =============================================================
import supabase from '../config/supabase.js';
import logger from '../config/logger.js';

// ---- Expense Repository ----
export class ExpenseRepository {
  async findAll(companyId: string, filters: {
    employeeId?: string;
    status?: string;
    categoryId?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('expenses')
      .select(`
        *,
        users!expenses_employee_id_fkey(first_name, last_name, email),
        expense_categories(name)
      `, { count: 'exact' })
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.employeeId) query = query.eq('employee_id', filters.employeeId);
    if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
    if (filters.categoryId && filters.categoryId !== 'all') query = query.eq('category_id', filters.categoryId);
    if (filters.search) query = query.or(`description.ilike.%${filters.search}%,merchant_name.ilike.%${filters.search}%`);

    return query;
  }

  async findById(id: string, companyId: string) {
    return supabase
      .from('expenses')
      .select(`*, users!expenses_employee_id_fkey(first_name, last_name, email), expense_categories(name)`)
      .eq('id', id)
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .single();
  }

  async create(data: Record<string, unknown>) {
    return supabase.from('expenses').insert(data).select().single();
  }

  async update(id: string, companyId: string, data: Record<string, unknown>) {
    return supabase.from('expenses').update(data).eq('id', id).eq('company_id', companyId).select().single();
  }

  async softDelete(id: string, companyId: string) {
    return supabase.from('expenses').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('company_id', companyId);
  }
}

// ---- User Repository ----
export class UserRepository {
  async findByEmail(email: string) {
    return supabase
      .from('users')
      .select('*, companies(name, base_currency)')
      .eq('email', email)
      .is('deleted_at', null)
      .single();
  }

  async findById(id: string) {
    return supabase
      .from('users')
      .select('*, companies(name, base_currency)')
      .eq('id', id)
      .is('deleted_at', null)
      .single();
  }

  async findByCompany(companyId: string) {
    return supabase
      .from('users')
      .select('id, company_id, email, first_name, last_name, role, manager_id, is_active, last_login, created_at')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });
  }

  async updateLastLogin(id: string) {
    return supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', id);
  }
}

// ---- Notification Repository ----
export class NotificationRepository {
  async findByUser(userId: string, limit = 50) {
    return supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
  }

  async unreadCount(userId: string) {
    return supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
  }

  async createMany(notifications: Array<{
    user_id: string;
    expense_id: string;
    type: string;
    title: string;
    message: string;
  }>) {
    return supabase.from('notifications').insert(notifications);
  }

  async markRead(id: string, userId: string) {
    return supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);
  }

  async markAllRead(userId: string) {
    return supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);
  }
}

// ---- Audit Repository ----
export class AuditRepository {
  async log(data: {
    userId: string;
    entityType: string;
    entityId: string;
    action: string;
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const { error } = await supabase.from('audit_logs').insert({
      user_id: data.userId,
      entity_type: data.entityType,
      entity_id: data.entityId,
      action: data.action,
      old_values: data.oldValues || null,
      new_values: data.newValues || null,
      ip_address: data.ipAddress || '0.0.0.0',
      user_agent: data.userAgent || null,
    });
    if (error) logger.error('Audit log failed', { error, data });
  }
}

// ---- Approval Log Repository ----
export class ApprovalLogRepository {
  async findByExpense(expenseId: string) {
    return supabase
      .from('approval_logs')
      .select('*, users!approval_logs_approver_id_fkey(first_name, last_name)')
      .eq('expense_id', expenseId)
      .order('created_at', { ascending: true });
  }

  async create(data: {
    expense_id: string;
    approver_id: string;
    action: string;
    comments?: string;
    step_number: number;
  }) {
    return supabase.from('approval_logs').insert(data);
  }
}

// ---- Singleton instances ----
export const expenseRepo = new ExpenseRepository();
export const userRepo = new UserRepository();
export const notificationRepo = new NotificationRepository();
export const auditRepo = new AuditRepository();
export const approvalLogRepo = new ApprovalLogRepository();
