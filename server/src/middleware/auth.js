import { supabase, isSupabaseConfigured, createUserClient } from '../lib/supabase.js';

/**
 * Middleware: Verify Supabase JWT token and attach verified profile
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

    // Verify token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or expired session token'
      });
    }

    // Fetch verified profile from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, is_active')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'User profile not found in campus database'
      });
    }

    if (!profile.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Account Inactive',
        message: 'Your campus account has been deactivated. Contact an administrator.'
      });
    }

    // Attach to request
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
 * Middleware: Enforce role-based access control
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
