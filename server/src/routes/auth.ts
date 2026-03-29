import { Router, Response, Request } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import supabase from '../config/supabase.js';
import logger from '../config/logger.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '1234567890-dummyclientid.apps.googleusercontent.com');

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*, companies(name, base_currency)')
      .eq('email', email)
      .is('deleted_at', null)
      .single();

    if (error || !user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({ error: 'Account is deactivated. Contact your administrator.' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Update last_login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.company_id,
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as any
    );

    logger.info('User logged in', { userId: user.id, email: user.email, role: user.role });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        companyId: user.company_id,
        companyName: user.companies?.name,
        isActive: user.is_active,
        lastLogin: user.last_login,
        managerId: user.manager_id,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    logger.error('Login error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/google
router.post('/google', async (req: Request, res: Response): Promise<void> => {
  try {
    const { credential } = req.body; // Actually the access_token from frontend
    if (!credential) {
      res.status(400).json({ error: 'Google credential is required' });
      return;
    }

    // Fetch user info using the access token
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${credential}` }
    });

    if (!userInfoRes.ok) {
      res.status(401).json({ error: 'Invalid Google access token' });
      return;
    }

    const payload = (await userInfoRes.json()) as {
      email?: string;
      given_name?: string;
      family_name?: string;
    };
    
    if (!payload?.email) {
      res.status(400).json({ error: 'Invalid Google token payload' });
      return;
    }

    const email = payload.email;
    let { data: user, error } = await supabase
      .from('users')
      .select('*, companies(name, base_currency)')
      .eq('email', email)
      .is('deleted_at', null)
      .single();

    if (error || !user) {
      // User doesn't exist, create them
      // First find a default company
      const { data: company } = await supabase.from('companies').select('*').limit(1).single();
      
      const newUser = {
        email,
        first_name: payload.given_name || email.split('@')[0],
        last_name: payload.family_name || 'User',
        password_hash: await bcrypt.hash(Math.random().toString(36), 10), // Random password
        role: 'employee',
        company_id: company?.id || null, // Will depend on schema nullability
        is_active: true
      };

      const { data: createdUser, error: createError } = await supabase
        .from('users')
        .insert(newUser)
        .select('*, companies(name, base_currency)')
        .single();
        
      if (createError) {
        logger.error('Google signup error', { createError });
        res.status(500).json({ error: 'Failed to create user correctly. Setup might be required.' });
        return;
      }
      user = createdUser;
    }

    if (!user.is_active) {
      res.status(403).json({ error: 'Account is deactivated.' });
      return;
    }

    // Update last_login
    await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, companyId: user.company_id },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as any
    );

    logger.info('User logged in via Google', { userId: user.id, email: user.email });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        companyId: user.company_id,
        companyName: user.companies?.name,
        isActive: user.is_active,
        lastLogin: user.last_login,
        managerId: user.manager_id,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    logger.error('Google Auth error', { error });
    res.status(500).json({ error: 'Internal server error during Google auth' });
  }
});

// POST /api/auth/microsoft
router.post('/microsoft', async (req: Request, res: Response): Promise<void> => {
  try {
    const { credential } = req.body; // Actually the access_token from frontend MSAL
    if (!credential) {
      res.status(400).json({ error: 'Microsoft credential is required' });
      return;
    }

    // Fetch user info using the MSAL access token from Microsoft Graph API
    const userInfoRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${credential}` }
    });

    if (!userInfoRes.ok) {
      res.status(401).json({ error: 'Invalid Microsoft access token' });
      return;
    }

    const payload = (await userInfoRes.json()) as {
      userPrincipalName?: string;
      givenName?: string;
      surname?: string;
    };
    
    if (!payload?.userPrincipalName) {
      res.status(400).json({ error: 'Invalid Microsoft token payload' });
      return;
    }

    const email = payload.userPrincipalName;
    let { data: user, error } = await supabase
      .from('users')
      .select('*, companies(name, base_currency)')
      .eq('email', email)
      .is('deleted_at', null)
      .single();

    if (error || !user) {
      // User doesn't exist, create them
      // First find a default company
      const { data: company } = await supabase.from('companies').select('*').limit(1).single();
      
      const newUser = {
        email,
        first_name: payload.givenName || email.split('@')[0],
        last_name: payload.surname || 'User',
        password_hash: await bcrypt.hash(Math.random().toString(36), 10), // Random password
        role: 'employee',
        company_id: company?.id || null, // Will depend on schema nullability
        is_active: true
      };

      const { data: createdUser, error: createError } = await supabase
        .from('users')
        .insert(newUser)
        .select('*, companies(name, base_currency)')
        .single();
        
      if (createError) {
        logger.error('Microsoft signup error', { createError });
        res.status(500).json({ error: 'Failed to create user correctly. Setup might be required.' });
        return;
      }
      user = createdUser;
    }

    if (!user.is_active) {
      res.status(403).json({ error: 'Account is deactivated.' });
      return;
    }

    // Update last_login
    await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id);

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, companyId: user.company_id },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as any
    );

    logger.info('User logged in via Microsoft', { userId: user.id, email: user.email });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        companyId: user.company_id,
        companyName: user.companies?.name,
        isActive: user.is_active,
        lastLogin: user.last_login,
        managerId: user.manager_id,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    logger.error('Microsoft Auth error', { error });
    res.status(500).json({ error: 'Internal server error during Microsoft auth' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*, companies(name, base_currency)')
      .eq('id', req.user!.id)
      .is('deleted_at', null)
      .single();

    if (error || !user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      companyId: user.company_id,
      companyName: user.companies?.name,
      isActive: user.is_active,
      lastLogin: user.last_login,
      managerId: user.manager_id,
      createdAt: user.created_at,
    });
  } catch (error) {
    logger.error('Get me error', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
