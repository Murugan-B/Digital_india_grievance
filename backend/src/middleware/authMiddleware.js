import { supabaseServer, isServerSupabaseConfigured } from '../config/supabase.js';

/**
 * Middleware: Verifies Supabase Bearer token, fetches active user profile,
 * and attaches verified req.user and req.profile objects.
 */
export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Missing or invalid Authorization header.',
      });
    }

    const token = authHeader.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is empty.',
      });
    }

    if (!isServerSupabaseConfigured) {
      return res.status(500).json({
        success: false,
        message: 'Server database service is not configured.',
      });
    }

    // Validate Supabase access token against auth server
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session. Please sign in again.',
      });
    }

    // Retrieve user's verified profile record from the database
    const { data: profile, error: profileError } = await supabaseServer
      .from('profiles')
      .select('id, full_name, email, role, account_status, preferred_language, department, designation')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('[authMiddleware] Profile lookup error:', profileError.message);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify user profile.',
      });
    }

    if (!profile) {
      return res.status(401).json({
        success: false,
        message: 'User profile not found. Please complete registration.',
      });
    }

    // Account status validation
    if (profile.account_status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact portal administration.',
      });
    }

    // Attach immutable verified user and profile data
    req.user = user;
    req.profile = profile;

    next();
  } catch (err) {
    console.error('[authMiddleware] Unexpected authentication error:', err.message || err);
    return res.status(401).json({
      success: false,
      message: 'Authentication verification failed.',
    });
  }
}

/**
 * Middleware: Enforces that the authenticated user has the 'citizen' role
 * with an 'active' account status.
 */
export function requireCitizen(req, res, next) {
  if (!req.profile) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  if (req.profile.account_status !== 'active') {
    return res.status(403).json({
      success: false,
      message: 'Active account status is required to perform this action.',
    });
  }

  if (req.profile.role !== 'citizen') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. This endpoint is restricted to citizen accounts.',
    });
  }

  next();
}

/**
 * Middleware: Enforces that the authenticated user is an active official
 * (or admin) with an assigned department.
 */
export function requireOfficial(req, res, next) {
  if (!req.profile) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  if (req.profile.account_status === 'pending') {
    return res.status(403).json({
      success: false,
      message: 'Your official account is pending administrative verification.',
    });
  }

  if (req.profile.account_status !== 'active') {
    return res.status(403).json({
      success: false,
      message: 'Active account status is required to access official resources.',
    });
  }

  if (req.profile.role !== 'official' && req.profile.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Official departmental credentials required.',
    });
  }

  if (!req.profile.department && req.profile.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'No government department is assigned to your official account.',
    });
  }

  next();
}

/**
 * Middleware: Enforces that the authenticated user has the 'admin' role
 * with an 'active' account status.
 */
export function requireAdmin(req, res, next) {
  if (!req.profile) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  if (req.profile.account_status === 'pending') {
    return res.status(403).json({
      success: false,
      message: 'Your administrator account is pending approval.',
    });
  }

  if (req.profile.account_status !== 'active') {
    return res.status(403).json({
      success: false,
      message: 'Active administrator account status is required.',
    });
  }

  if (req.profile.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden. Administrator credentials required.',
    });
  }

  next();
}
