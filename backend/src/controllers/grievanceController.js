import { GrievanceService } from '../services/grievanceService.js';
import { AIRoutingService } from '../services/aiRoutingService.js';
import { NotificationService } from '../services/notificationService.js';
import { AttachmentService } from '../services/attachmentService.js';

// UUID v4 format validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SUPPORTED_LANGUAGES = ['en', 'ta', 'hi', 'te', 'kn', 'ml'];

export class GrievanceController {
  /**
   * POST /api/grievances
   * Submits a new citizen grievance with strict validation and backend-enforced attributes.
   */
  static async submitGrievance(req, res, next) {
    try {
      const { subject, description, category, location, preferred_language, images } = req.body;

      // Validate images if provided (max 3, max 5MB each, JPG/PNG/WEBP)
      if (images !== undefined && images !== null) {
        try {
          AttachmentService.validateImages(images);
        } catch (valErr) {
          return res.status(400).json({
            success: false,
            message: valErr.message,
          });
        }
      }

      // 1. Validate Subject
      if (typeof subject !== 'string' || !subject.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Grievance subject is required and cannot be empty.',
        });
      }

      const cleanSubject = subject.trim();
      if (cleanSubject.length < 5) {
        return res.status(400).json({
          success: false,
          message: 'Grievance subject must be at least 5 characters.',
        });
      }

      if (cleanSubject.length > 250) {
        return res.status(400).json({
          success: false,
          message: 'Grievance subject must not exceed 250 characters.',
        });
      }

      // 2. Validate Description (supports Unicode & regional Indian languages)
      if (typeof description !== 'string' || !description.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Grievance description is required and cannot be empty.',
        });
      }

      const cleanDescription = description.trim();
      if (cleanDescription.length < 15) {
        return res.status(400).json({
          success: false,
          message: 'Grievance description must be at least 15 characters to provide adequate context.',
        });
      }

      if (cleanDescription.length > 5000) {
        return res.status(400).json({
          success: false,
          message: 'Grievance description must not exceed 5000 characters.',
        });
      }

      // 3. Validate Optional Category
      let cleanCategory = null;
      if (category !== undefined && category !== null) {
        if (typeof category !== 'string') {
          return res.status(400).json({
            success: false,
            message: 'Category must be a valid text string.',
          });
        }
        cleanCategory = category.trim();
        if (cleanCategory.length > 100) {
          return res.status(400).json({
            success: false,
            message: 'Category must not exceed 100 characters.',
          });
        }
        cleanCategory = cleanCategory || null;
      }

      // 4. Validate Optional Location
      let cleanLocation = null;
      if (location !== undefined && location !== null) {
        if (typeof location !== 'string') {
          return res.status(400).json({
            success: false,
            message: 'Location must be a valid text string.',
          });
        }
        cleanLocation = location.trim();
        if (cleanLocation.length > 250) {
          return res.status(400).json({
            success: false,
            message: 'Location must not exceed 250 characters.',
          });
        }
        cleanLocation = cleanLocation || null;
      }

      // 5. Validate Preferred Language
      let cleanLanguage = 'en';
      if (preferred_language !== undefined && preferred_language !== null) {
        if (typeof preferred_language !== 'string') {
          return res.status(400).json({
            success: false,
            message: 'Preferred language must be a valid language code.',
          });
        }
        const langCode = preferred_language.trim().toLowerCase();
        if (!SUPPORTED_LANGUAGES.includes(langCode)) {
          return res.status(400).json({
            success: false,
            message: `Unsupported preferred language. Supported codes: ${SUPPORTED_LANGUAGES.join(', ')}.`,
          });
        }
        cleanLanguage = langCode;
      }

      // 6. Create grievance using verified citizen ID and backend-controlled state
      const createdRecord = await GrievanceService.createGrievance(req.user.id, {
        subject: cleanSubject,
        description: cleanDescription,
        category: cleanCategory,
        location: cleanLocation,
        preferred_language: cleanLanguage,
      });

      // 7. Process evidence attachments if provided
      let attachments = [];
      if (images && Array.isArray(images) && images.length > 0) {
        try {
          attachments = await AttachmentService.processGrievanceAttachments(
            createdRecord.id,
            req.user.id,
            images
          );
        } catch (attachErr) {
          console.error('[GrievanceController] Attachment upload warning:', attachErr.message);
        }
      }

      // 8. Trigger Phase 8 AI Semantic Ticket Routing (uses text only, no raw images)
      let finalRecord = createdRecord;
      try {
        finalRecord = await AIRoutingService.processGrievanceRouting(createdRecord);
      } catch (routingErr) {
        console.error('[GrievanceController] AI routing error (safe fallback):', routingErr.message);
      }

      // 9. Generate Citizen Submission Notification (Phase 10)
      try {
        await NotificationService.notifyGrievanceSubmitted(createdRecord);
      } catch (notifErr) {
        console.warn('[GrievanceController] Notification creation warning (non-fatal):', notifErr.message);
      }

      return res.status(201).json({
        success: true,
        message: 'Grievance submitted successfully.',
        data: {
          ...finalRecord,
          attachments,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/grievances
   * Retrieves all grievances owned by the authenticated citizen.
   */
  static async getMyGrievances(req, res, next) {
    try {
      const grievances = await GrievanceService.getCitizenGrievances(req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Citizen grievances retrieved successfully.',
        data: grievances,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/grievances/:id
   * Retrieves a single grievance with strict ownership and UUID validation.
   */
  static async getGrievanceDetail(req, res, next) {
    try {
      const { id } = req.params;

      // 1. UUID format validation
      if (!id || typeof id !== 'string' || !UUID_REGEX.test(id.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid grievance ticket ID format. Please provide a valid UUID.',
        });
      }

      const cleanId = id.trim();
      const grievance = await GrievanceService.getGrievanceById(req.user.id, cleanId);

      // Return 404 for nonexistent OR unowned records to prevent enumeration
      if (!grievance) {
        return res.status(404).json({
          success: false,
          message: 'Grievance not found or you do not have permission to view it.',
        });
      }

      // Fetch attached evidence images
      const attachments = await AttachmentService.getGrievanceAttachments(cleanId);
      grievance.attachments = attachments || [];

      return res.status(200).json({
        success: true,
        message: 'Grievance retrieved successfully.',
        data: grievance,
      });
    } catch (err) {
      next(err);
    }
  }
}
