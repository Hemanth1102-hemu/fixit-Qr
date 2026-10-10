import { supabase, isSupabaseConfigured, createUserClient } from '../lib/supabase.js';

export const SRMIST_DOMAIN = '@srmist.edu.in';

/**
 * Validates if an email address belongs to the official SRMIST institutional domain
 */
export function isSrmistEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase().endsWith(SRMIST_DOMAIN);
}

/**
 * Middleware: Verify Supabase JWT token, enforce @srmist.edu.in institutional domain,
 * and attach verified profile & role from trusted database state
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Missing or malformed Authorization header with Bearer token'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!isSupabaseConfigured) {
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Backend database credentials are not configured. Please check .env file.'
      });
    }

    // Verify token with Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired session token. Please sign in again.'
      });
    }

    // 1. ENFORCE SRMIST INSTITUTIONAL DOMAIN RESTRICTION
    const allowNonSrmist = process.env.ALLOW_NON_SRMIST_EMAILS === 'true';
    if (!allowNonSrmist && !isSrmistEmail(user.email)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized Domain',
        message: `Access is strictly restricted to verified SRMIST institutional accounts (${SRMIST_DOMAIN}). Unauthorized email: ${user.email}`
      });
    }

    // 2. FETCH VERIFIED PROFILE FROM TRUSTED DATABASE RECORD
    // Do NOT trust user role supplied by client request
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, is_active')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'User profile not found in campus database. Contact an administrator.'
      });
    }

    // 3. CHECK ACCOUNT ACTIVATION STATUS
    if (!profile.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Account Inactive',
        message: 'Your SRMIST maintenance account has been deactivated. Contact the estate maintenance office.'
      });
    }

    // Attach verified identity to request
    req.user = user;
    req.profile = profile;
    req.accessToken = token;
    req.userClient = createUserClient(token);

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware: Enforce role-based access control based on trusted database profile
 * @param  {...string} allowedRoles Allowed roles (e.g. 'admin', 'technician')
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.profile) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.profile.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Action requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: ${req.profile.role}`
      });
    }

    next();
  };
}
