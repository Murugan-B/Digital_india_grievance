export class AuthController {
  /**
   * GET /api/auth/profile
   * Returns the server-verified profile of the authenticated user.
   */
  static async getProfile(req, res, next) {
    try {
      if (!req.profile) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
      }

      return res.status(200).json({
        success: true,
        data: req.profile,
      });
    } catch (err) {
      next(err);
    }
  }
}
