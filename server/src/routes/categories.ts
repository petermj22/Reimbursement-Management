import { Router, Response } from 'express';
import supabase from '../config/supabase.js';
import logger from '../config/logger.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/categories
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .eq('company_id', req.user!.companyId)
      .order('name');

    if (error) {
      res.status(500).json({ error: 'Failed to fetch categories' });
      return;
    }

    const categories = (data || []).map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      isActive: c.is_active,
    }));

    res.json(categories);
  } catch (error) {
    logger.error('Categories fetch error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/categories
router.post('/', authenticate, authorize('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;

    const { data, error } = await supabase
      .from('expense_categories')
      .insert({ company_id: req.user!.companyId, name, description })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: 'Failed to create category' });
      return;
    }

    res.status(201).json({ id: data.id, name: data.name, description: data.description, isActive: data.is_active });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/categories/:id
router.patch('/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, isActive } = req.body;
    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data, error } = await supabase
      .from('expense_categories')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('company_id', req.user!.companyId)
      .select()
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }

    res.json({ id: data.id, name: data.name, description: data.description, isActive: data.is_active });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- APPROVAL RULES ---

// GET /api/categories/approval-rules (using categories router for simplicity)
router.get('/approval-rules', authenticate, authorize('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('approval_rules')
      .select('*')
      .eq('company_id', req.user!.companyId)
      .order('min_amount');

    if (error) {
      res.status(500).json({ error: 'Failed to fetch approval rules' });
      return;
    }

    const rules = (data || []).map(r => ({
      id: r.id,
      name: r.name,
      minAmount: parseFloat(r.min_amount),
      maxAmount: parseFloat(r.max_amount),
      approvalType: r.approval_type,
      requiredApprovalPercentage: r.required_approval_percentage,
      isManagerApprovalRequired: r.is_manager_approval_required,
      isActive: r.is_active,
    }));

    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
