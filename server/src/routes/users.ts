import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import supabase from '../config/supabase.js';
import logger from '../config/logger.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/users
router.get('/', authenticate, authorize('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, company_id, email, first_name, last_name, role, manager_id, is_active, last_login, created_at')
      .eq('company_id', req.user!.companyId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
      return;
    }

    const users = (data || []).map(u => ({
      id: u.id,
      companyId: u.company_id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      role: u.role,
      managerId: u.manager_id,
      isActive: u.is_active,
      lastLogin: u.last_login,
      createdAt: u.created_at,
    }));

    res.json(users);
  } catch (error) {
    logger.error('Users list error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users
router.post('/', authenticate, authorize('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, role, managerId } = req.body;

    if (!email || !password || !firstName || !lastName || !role) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from('users')
      .insert({
        company_id: req.user!.companyId,
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        role,
        manager_id: managerId || null,
      })
      .select('id, email, first_name, last_name, role, is_active, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        res.status(409).json({ error: 'Email already exists' });
        return;
      }
      res.status(500).json({ error: 'Failed to create user' });
      return;
    }

    logger.info('User created', { userId: data.id, email });
    res.status(201).json({
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      role: data.role,
      isActive: data.is_active,
      createdAt: data.created_at,
    });
  } catch (error) {
    logger.error('User create error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/users/:id
router.patch('/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, role, managerId, isActive } = req.body;
    const updateData: Record<string, any> = {};
    if (firstName !== undefined) updateData.first_name = firstName;
    if (lastName !== undefined) updateData.last_name = lastName;
    if (role !== undefined) updateData.role = role;
    if (managerId !== undefined) updateData.manager_id = managerId;
    if (isActive !== undefined) updateData.is_active = isActive;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('company_id', req.user!.companyId)
      .select('id, email, first_name, last_name, role, is_active, manager_id, created_at')
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    logger.info('User updated', { userId: data.id });
    res.json({
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      role: data.role,
      isActive: data.is_active,
      managerId: data.manager_id,
      createdAt: data.created_at,
    });
  } catch (error) {
    logger.error('User update error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/users/:id (soft delete)
router.delete('/:id', authenticate, authorize('admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('company_id', req.user!.companyId);

    if (error) {
      res.status(500).json({ error: 'Failed to delete user' });
      return;
    }

    logger.info('User soft-deleted', { userId: req.params.id });
    res.json({ message: 'User deleted' });
  } catch (error) {
    logger.error('User delete error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
