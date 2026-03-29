import { Router, Response } from 'express';
import supabase from '../config/supabase.js';
import logger from '../config/logger.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/analytics/dashboard
router.get('/dashboard', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;
    const isEmployee = req.user!.role === 'employee';

    // Build base query filters
    let expQuery = supabase
      .from('expenses')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null);

    if (isEmployee) {
      expQuery = expQuery.eq('employee_id', req.user!.id);
    }

    const { data: expenses } = await expQuery;

    const allExpenses = expenses || [];

    const totalExpenses = allExpenses.length;
    const pendingApprovals = allExpenses.filter(e => e.status === 'pending').length;
    const approvedExpenses = allExpenses.filter(e => e.status === 'approved' || e.status === 'paid');
    const approvedAmount = approvedExpenses.reduce((s, e) => s + parseFloat(e.amount), 0);
    const rejectedCount = allExpenses.filter(e => e.status === 'rejected').length;
    const averageExpense = totalExpenses > 0 ? allExpenses.reduce((s, e) => s + parseFloat(e.amount), 0) / totalExpenses : 0;

    // Monthly trend (last 6 months)
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const monthlyTrend = months.map((month, i) => {
      const monthExpenses = allExpenses.filter(e => {
        const d = new Date(e.expense_date);
        return d.getMonth() === (9 + i) % 12;
      });
      return {
        month,
        amount: monthExpenses.reduce((s, e) => s + parseFloat(e.amount), 0),
        count: monthExpenses.length,
      };
    });

    // Category breakdown
    const categoryMap: Record<string, number> = {};
    for (const e of allExpenses) {
      const catId = e.category_id || 'uncategorized';
      categoryMap[catId] = (categoryMap[catId] || 0) + parseFloat(e.amount);
    }

    const { data: categories } = await supabase
      .from('expense_categories')
      .select('id, name')
      .eq('company_id', companyId);

    const totalAmount = allExpenses.reduce((s, e) => s + parseFloat(e.amount), 0);
    const categoryBreakdown = Object.entries(categoryMap).map(([catId, amount]) => ({
      category: categories?.find(c => c.id === catId)?.name || 'Other',
      amount,
      percentage: totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0,
    }));

    // Status distribution
    const statusMap: Record<string, number> = {};
    for (const e of allExpenses) {
      statusMap[e.status] = (statusMap[e.status] || 0) + 1;
    }
    const statusDistribution = Object.entries(statusMap).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
    }));

    // Recent activity from audit logs
    const { data: auditData } = await supabase
      .from('approval_logs')
      .select('*, users!approval_logs_approver_id_fkey(first_name, last_name)')
      .order('created_at', { ascending: false })
      .limit(5);

    const recentActivity = (auditData || []).map(a => ({
      id: a.id,
      type: a.action === 'approved' ? 'expense_approved' : a.action === 'rejected' ? 'expense_rejected' : 'expense_submitted',
      description: `Expense ${a.action} by ${a.users?.first_name} ${a.users?.last_name}`,
      timestamp: a.created_at,
      user: `${a.users?.first_name} ${a.users?.last_name}`,
    }));

    res.json({
      totalExpenses,
      pendingApprovals,
      approvedAmount,
      rejectedCount,
      averageExpense,
      monthlyTrend,
      categoryBreakdown,
      statusDistribution,
      recentActivity,
    });
  } catch (error) {
    logger.error('Dashboard analytics error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/top-spenders
router.get('/top-spenders', authenticate, authorize('admin', 'manager'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: expenses } = await supabase
      .from('expenses')
      .select('employee_id, amount, users!expenses_employee_id_fkey(first_name, last_name)')
      .eq('company_id', req.user!.companyId)
      .is('deleted_at', null);

    const spenderMap: Record<string, { name: string; amount: number; count: number }> = {};
    for (const e of expenses || []) {
      const key = e.employee_id;
      if (!spenderMap[key]) {
        spenderMap[key] = {
          name: e.users ? `${(e.users as any).first_name} ${(e.users as any).last_name}` : 'Unknown',
          amount: 0,
          count: 0,
        };
      }
      spenderMap[key].amount += parseFloat(e.amount as any);
      spenderMap[key].count++;
    }

    const topSpenders = Object.values(spenderMap)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    res.json(topSpenders);
  } catch (error) {
    logger.error('Top spenders error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
