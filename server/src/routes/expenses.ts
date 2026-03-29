import { Router, Response } from 'express';
import multer from 'multer';
import supabase from '../config/supabase.js';
import logger from '../config/logger.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { emitExpenseSubmitted, emitExpenseApproved, emitExpenseRejected, emitExpensePaid } from '../services/socketService.js';
import { dispatchEmailJob, dispatchOcrJob } from '../services/queueService.js';
import { auditRepo } from '../services/repositories.js';

const router = Router();
const upload = multer();

// GET /api/expenses — list expenses (filtered by role)
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, category_id, search, page = '1', limit = '20' } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = supabase
      .from('expenses')
      .select(`
        *,
        users!expenses_employee_id_fkey(first_name, last_name, email),
        expense_categories(name)
      `, { count: 'exact' })
      .eq('company_id', req.user!.companyId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit as string) - 1);

    // Employees only see their own expenses
    if (req.user!.role === 'employee') {
      query = query.eq('employee_id', req.user!.id);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (category_id && category_id !== 'all') {
      query = query.eq('category_id', category_id);
    }
    if (search) {
      query = query.or(`description.ilike.%${search}%,merchant_name.ilike.%${search}%`);
    }

    const { data, count, error } = await query;

    if (error) {
      logger.error('Expenses fetch error', { error });
      res.status(500).json({ error: 'Failed to fetch expenses' });
      return;
    }

    const formatted = (data || []).map(e => ({
      id: e.id,
      employeeId: e.employee_id,
      employeeName: e.users ? `${e.users.first_name} ${e.users.last_name}` : 'Unknown',
      categoryId: e.category_id,
      categoryName: e.expense_categories?.name || 'Uncategorized',
      amount: parseFloat(e.amount),
      currency: e.currency,
      amountInBaseCurrency: e.amount_in_base_currency ? parseFloat(e.amount_in_base_currency) : parseFloat(e.amount),
      description: e.description,
      expenseDate: e.expense_date,
      receiptUrl: e.receipt_url,
      merchantName: e.merchant_name,
      status: e.status,
      currentApprovalStep: e.current_approval_step,
      totalApprovalSteps: e.total_approval_steps,
      isOcrProcessed: e.is_ocr_processed,
      ocrConfidence: e.ocr_confidence ? parseFloat(e.ocr_confidence) : null,
      submittedAt: e.submitted_at,
      approvedAt: e.approved_at,
      rejectedAt: e.rejected_at,
      paidAt: e.paid_at,
      createdAt: e.created_at,
    }));

    res.json({ expenses: formatted, total: count, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (error) {
    logger.error('Expenses list error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/expenses/:id — get single expense
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: expense, error } = await supabase
      .from('expenses')
      .select(`
        *,
        users!expenses_employee_id_fkey(first_name, last_name, email),
        expense_categories(name)
      `)
      .eq('id', req.params.id)
      .eq('company_id', req.user!.companyId)
      .is('deleted_at', null)
      .single();

    if (error || !expense) {
      res.status(404).json({ error: 'Expense not found' });
      return;
    }

    // Employees can only view their own
    if (req.user!.role === 'employee' && expense.employee_id !== req.user!.id) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Get approval logs
    const { data: logs } = await supabase
      .from('approval_logs')
      .select('*, users!approval_logs_approver_id_fkey(first_name, last_name)')
      .eq('expense_id', req.params.id)
      .order('created_at', { ascending: true });

    res.json({
      id: expense.id,
      employeeId: expense.employee_id,
      employeeName: expense.users ? `${expense.users.first_name} ${expense.users.last_name}` : 'Unknown',
      categoryId: expense.category_id,
      categoryName: expense.expense_categories?.name || 'Uncategorized',
      amount: parseFloat(expense.amount),
      currency: expense.currency,
      amountInBaseCurrency: expense.amount_in_base_currency ? parseFloat(expense.amount_in_base_currency) : parseFloat(expense.amount),
      description: expense.description,
      expenseDate: expense.expense_date,
      receiptUrl: expense.receipt_url,
      merchantName: expense.merchant_name,
      status: expense.status,
      currentApprovalStep: expense.current_approval_step,
      totalApprovalSteps: expense.total_approval_steps,
      isOcrProcessed: expense.is_ocr_processed,
      ocrConfidence: expense.ocr_confidence ? parseFloat(expense.ocr_confidence) : null,
      submittedAt: expense.submitted_at,
      approvedAt: expense.approved_at,
      rejectedAt: expense.rejected_at,
      paidAt: expense.paid_at,
      createdAt: expense.created_at,
      approvalLogs: (logs || []).map(l => ({
        id: l.id,
        expenseId: l.expense_id,
        approverId: l.approver_id,
        approverName: l.users ? `${l.users.first_name} ${l.users.last_name}` : 'Unknown',
        action: l.action,
        comments: l.comments,
        stepNumber: l.step_number,
        createdAt: l.created_at,
      })),
    });
  } catch (error) {
    logger.error('Expense detail error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/expenses — create expense
router.post('/', authenticate, upload.single('receipt'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { description, amount, currency, categoryId, expenseDate, merchantName, status } = req.body;

    if (!description || !amount || !currency || !categoryId || !expenseDate) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Determine approval steps based on amount
    const { data: rules } = await supabase
      .from('approval_rules')
      .select('*')
      .eq('company_id', req.user!.companyId)
      .eq('is_active', true)
      .lte('min_amount', amount)
      .gte('max_amount', amount)
      .order('priority', { ascending: false })
      .limit(1);

    const rule = rules?.[0];
    const totalSteps = rule ? (amount > 1000 ? 2 : 1) : 1;
    const finalStatus = status === 'draft' ? 'draft' : 'pending';

    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        company_id: req.user!.companyId,
        employee_id: req.user!.id,
        category_id: categoryId,
        amount,
        currency,
        amount_in_base_currency: amount,
        description,
        expense_date: expenseDate,
        merchant_name: merchantName,
        status: finalStatus,
        current_approval_step: 0,
        total_approval_steps: finalStatus === 'draft' ? 0 : totalSteps,
        submitted_at: finalStatus === 'pending' ? new Date().toISOString() : null,
        is_ocr_processed: false,
      })
      .select()
      .single();

    if (error) {
      logger.error('Expense creation error', { error });
      res.status(500).json({ error: 'Failed to create expense' });
      return;
    }

    // Queue OCR Processing if file uploaded
    if (req.file) {
      const base64 = req.file.buffer.toString('base64');
      await dispatchOcrJob(expense.id, req.user!.companyId, base64);
      logger.info('Queued OCR processing', { expenseId: expense.id });
    }

    // Create notification for managers if submitted + real-time push
    if (finalStatus === 'pending') {
      const { data: managers } = await supabase
        .from('users')
        .select('id, email')
        .eq('company_id', req.user!.companyId)
        .in('role', ['manager', 'admin'])
        .is('deleted_at', null);

      if (managers) {
        const notifications = managers.map(m => ({
          user_id: m.id,
          expense_id: expense.id,
          type: 'expense_submitted',
          title: 'New Expense Submitted',
          message: `${req.user!.email} submitted a $${amount} expense: ${description}`,
        }));
        await supabase.from('notifications').insert(notifications);

        // Real-time WebSocket push to each manager
        managers.forEach(m => {
          emitExpenseSubmitted(m.id, {
            id: expense.id,
            description,
            amount,
            employeeName: req.user!.email,
          });
        });
      }
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: req.user!.id,
      entity_type: 'expense',
      entity_id: expense.id,
      action: 'created',
      new_values: expense,
      ip_address: req.ip || '0.0.0.0',
    });

    logger.info('Expense created', { expenseId: expense.id, userId: req.user!.id });
    res.status(201).json(expense);
  } catch (error) {
    logger.error('Expense create error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/expenses/:id/approve — approve expense
router.patch('/:id/approve', authenticate, authorize('admin', 'manager'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { comments } = req.body;

    const { data: expense, error: fetchError } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', req.params.id)
      .eq('company_id', req.user!.companyId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !expense) {
      res.status(404).json({ error: 'Expense not found or not pending' });
      return;
    }

    const newStep = expense.current_approval_step + 1;
    const isFullyApproved = newStep >= expense.total_approval_steps;

    // Create approval log
    await supabase.from('approval_logs').insert({
      expense_id: expense.id,
      approver_id: req.user!.id,
      action: 'approved',
      comments: comments || null,
      step_number: newStep,
    });

    // Update expense
    const updateData: Record<string, any> = {
      current_approval_step: newStep,
    };
    if (isFullyApproved) {
      updateData.status = 'approved';
      updateData.approved_at = new Date().toISOString();
    }

    const { data: updated, error: updateError } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) {
      res.status(500).json({ error: 'Failed to update expense' });
      return;
    }

    // Notify employee
    await supabase.from('notifications').insert({
      user_id: expense.employee_id,
      expense_id: expense.id,
      type: isFullyApproved ? 'expense_approved' : 'expense_step_approved',
      title: isFullyApproved ? 'Expense Approved' : 'Approval Step Completed',
      message: isFullyApproved
        ? `Your expense "$${expense.amount}" has been fully approved`
        : `Step ${newStep}/${expense.total_approval_steps} approved for "$${expense.amount}"`,
    });

    // Real-time WebSocket push
    emitExpenseApproved(expense.employee_id, {
      id: expense.id,
      description: expense.description,
      amount: parseFloat(expense.amount),
      approverName: req.user!.email,
      fullyApproved: isFullyApproved,
    });

    // Email notification
    const { data: employee } = await supabase.from('users').select('email').eq('id', expense.employee_id).single();
    if (employee) {
      dispatchEmailJob(employee.email, `Expense ${isFullyApproved ? 'Approved' : 'Step Approved'}`, {
        expenseDescription: expense.description,
        amount: parseFloat(expense.amount),
        currency: expense.currency,
        action: isFullyApproved ? 'Approved' : `Step ${newStep} Approved`,
        actionBy: req.user!.email,
        comments: comments,
      }).catch(err => logger.error('Email dispatch failed', { err }));
    }

    // Audit log
    await auditRepo.log({
      userId: req.user!.id,
      entityType: 'expense',
      entityId: expense.id,
      action: 'approved',
      oldValues: { status: expense.status, step: expense.current_approval_step },
      newValues: { status: updated.status, step: newStep },
      ipAddress: req.ip || undefined,
      userAgent: req.get('user-agent') || undefined,
    });

    logger.info('Expense approved', { expenseId: expense.id, step: newStep, fullyApproved: isFullyApproved });
    res.json({ message: isFullyApproved ? 'Expense fully approved' : `Step ${newStep} approved`, expense: updated });
  } catch (error) {
    logger.error('Approve error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/expenses/:id/reject — reject expense
router.patch('/:id/reject', authenticate, authorize('admin', 'manager'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { comments } = req.body;

    const { data: expense, error: fetchError } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', req.params.id)
      .eq('company_id', req.user!.companyId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !expense) {
      res.status(404).json({ error: 'Expense not found or not pending' });
      return;
    }

    // Create approval log
    await supabase.from('approval_logs').insert({
      expense_id: expense.id,
      approver_id: req.user!.id,
      action: 'rejected',
      comments: comments || 'No reason provided',
      step_number: expense.current_approval_step + 1,
    });

    // Update expense
    const { data: updated } = await supabase
      .from('expenses')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .select()
      .single();

    // Notify employee
    await supabase.from('notifications').insert({
      user_id: expense.employee_id,
      expense_id: expense.id,
      type: 'expense_rejected',
      title: 'Expense Rejected',
      message: `Your expense "$${expense.amount}" was rejected: ${comments || 'No reason provided'}`,
    });

    // Real-time WebSocket push
    emitExpenseRejected(expense.employee_id, {
      id: expense.id,
      description: expense.description,
      amount: parseFloat(expense.amount),
      approverName: req.user!.email,
      reason: comments || 'No reason provided',
    });

    // Email notification
    const { data: empRej } = await supabase.from('users').select('email').eq('id', expense.employee_id).single();
    if (empRej) {
      dispatchEmailJob(empRej.email, 'Expense Rejected', {
        expenseDescription: expense.description,
        amount: parseFloat(expense.amount),
        currency: expense.currency,
        action: 'Rejected',
        actionBy: req.user!.email,
        comments: comments || 'No reason provided',
      }).catch(err => logger.error('Email dispatch failed', { err }));
    }

    logger.info('Expense rejected', { expenseId: expense.id, userId: req.user!.id });
    res.json({ message: 'Expense rejected', expense: updated });
  } catch (error) {
    logger.error('Reject error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/expenses/:id/pay — mark as paid
router.patch('/:id/pay', authenticate, authorize('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: updated, error } = await supabase
      .from('expenses')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('company_id', req.user!.companyId)
      .eq('status', 'approved')
      .select()
      .single();

    if (error || !updated) {
      res.status(404).json({ error: 'Expense not found or not approved' });
      return;
    }

    await supabase.from('notifications').insert({
      user_id: updated.employee_id,
      expense_id: updated.id,
      type: 'expense_paid',
      title: 'Expense Paid',
      message: `Your expense "$${updated.amount}" has been paid`,
    });

    // Real-time WebSocket push
    emitExpensePaid(updated.employee_id, {
      id: updated.id,
      amount: parseFloat(updated.amount),
    });

    // Email notification
    const { data: empPay } = await supabase.from('users').select('email').eq('id', updated.employee_id).single();
    if (empPay) {
      dispatchEmailJob(empPay.email, 'Payment Processed', {
        expenseDescription: updated.description,
        amount: parseFloat(updated.amount),
        currency: updated.currency,
        action: 'Paid',
      }).catch(err => logger.error('Email dispatch failed', { err }));
    }

    logger.info('Expense paid', { expenseId: updated.id });
    res.json({ message: 'Expense marked as paid', expense: updated });
  } catch (error) {
    logger.error('Pay error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
