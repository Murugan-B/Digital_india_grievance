import crypto from 'crypto';
import { supabaseServer } from '../config/supabase.js';

const BUCKET_NAME = 'grievance-attachments';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
const MAX_IMAGES_PER_GRIEVANCE = 3;

// In-memory fallback repository when DB table is pending migration
const attachmentFallbackStore = [];

export class AttachmentService {
  /**
   * Validate image array before upload
   */
  static validateImages(images) {
    if (!images || !Array.isArray(images)) {
      return { valid: true, images: [] };
    }

    if (images.length > MAX_IMAGES_PER_GRIEVANCE) {
      throw new Error(`Maximum ${MAX_IMAGES_PER_GRIEVANCE} images allowed per grievance.`);
    }

    const validated = [];
    for (const [index, img] of images.entries()) {
      if (!img || typeof img !== 'object') {
        throw new Error(`Invalid image payload format at index ${index}.`);
      }

      const mimeType = (img.type || img.mime_type || '').toLowerCase().trim();
      if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        throw new Error(`Unsupported file type "${mimeType}". Allowed types: JPG, PNG, WEBP.`);
      }

      // Check declared size metadata
      const declaredSize = Number(img.size);
      if (!isNaN(declaredSize) && declaredSize > MAX_FILE_SIZE) {
        throw new Error(`Image "${img.name || 'image'}" exceeds maximum allowed size of 5 MB.`);
      }

      // Check size
      let buffer;
      if (img.data && typeof img.data === 'string') {
        const base64Data = img.data.replace(/^data:image\/[a-z]+;base64,/, '');
        buffer = Buffer.from(base64Data, 'base64');
      } else if (img.buffer && Buffer.isBuffer(img.buffer)) {
        buffer = img.buffer;
      } else {
        throw new Error(`No valid image data provided for image at index ${index}.`);
      }

      if (buffer.length > MAX_FILE_SIZE) {
        throw new Error(`Image "${img.name || 'image'}" exceeds maximum allowed size of 5 MB.`);
      }

      if (buffer.length === 0) {
        throw new Error(`Image "${img.name || 'image'}" is empty (0 bytes).`);
      }

      // Determine extension
      let ext = 'jpg';
      if (mimeType.includes('png')) ext = 'png';
      else if (mimeType.includes('webp')) ext = 'webp';
      else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';

      validated.push({
        buffer,
        originalFileName: (img.name || `image_${index + 1}.${ext}`).trim(),
        mimeType: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType,
        fileSize: buffer.length,
        ext,
      });
    }

    return { valid: true, images: validated };
  }

  /**
   * Ensure bucket exists
   */
  static async ensureBucket() {
    try {
      const { data: buckets } = await supabaseServer.storage.listBuckets();
      const exists = buckets && buckets.some((b) => b.name === BUCKET_NAME);
      if (!exists) {
        await supabaseServer.storage.createBucket(BUCKET_NAME, {
          public: false,
          fileSizeLimit: MAX_FILE_SIZE,
          allowedMimeTypes: ALLOWED_MIME_TYPES,
        });
      }
    } catch (err) {
      console.warn('[AttachmentService] ensureBucket warning:', err.message);
    }
  }

  /**
   * Upload single image buffer to Supabase Storage and create DB metadata
   */
  static async uploadImage({ grievanceId, userId, imageObj }) {
    await this.ensureBucket();

    const fileId = crypto.randomUUID();
    const storagePath = `grievances/${grievanceId}/${fileId}.${imageObj.ext}`;

    // 1. Upload to Supabase Storage
    const { error: uploadErr } = await supabaseServer.storage
      .from(BUCKET_NAME)
      .upload(storagePath, imageObj.buffer, {
        contentType: imageObj.mimeType,
        upsert: true,
      });

    if (uploadErr) {
      console.error('[AttachmentService] Storage upload error:', uploadErr.message);
      throw new Error(`Failed to upload attachment to storage: ${uploadErr.message}`);
    }

    // 2. Generate initial signed URL
    let signedUrl = '';
    try {
      const { data: signedData } = await supabaseServer.storage
        .from(BUCKET_NAME)
        .createSignedUrl(storagePath, 3600 * 24); // 24 hours
      if (signedData?.signedUrl) {
        signedUrl = signedData.signedUrl;
      }
    } catch (signedErr) {
      console.warn('[AttachmentService] Signed URL warning:', signedErr.message);
    }

    const attachmentRecord = {
      id: fileId,
      grievance_id: grievanceId,
      uploaded_by: userId,
      storage_path: storagePath,
      original_file_name: imageObj.originalFileName,
      mime_type: imageObj.mimeType,
      file_size: imageObj.fileSize,
      created_at: new Date().toISOString(),
    };

    // 3. Insert into public.grievance_attachments
    try {
      const { data, error } = await supabaseServer
        .from('grievance_attachments')
        .insert([attachmentRecord])
        .select()
        .single();

      if (!error && data) {
        return { ...data, signed_url: signedUrl };
      }
    } catch (dbErr) {
      // Fall through to memory store
    }

    // Memory store fallback
    attachmentFallbackStore.push(attachmentRecord);
    return { ...attachmentRecord, signed_url: signedUrl };
  }

  /**
   * Process multiple images for a grievance
   */
  static async processGrievanceAttachments(grievanceId, userId, images) {
    if (!images || !Array.isArray(images) || images.length === 0) {
      return [];
    }

    const { images: validatedList } = this.validateImages(images);
    const uploadedAttachments = [];

    for (const imageObj of validatedList) {
      const record = await this.uploadImage({
        grievanceId,
        userId,
        imageObj,
      });
      uploadedAttachments.push(record);
    }

    return uploadedAttachments;
  }

  /**
   * Retrieve all attachments for a grievance with signed URLs
   */
  static async getGrievanceAttachments(grievanceId) {
    let records = [];

    try {
      const { data, error } = await supabaseServer
        .from('grievance_attachments')
        .select('id, grievance_id, uploaded_by, storage_path, original_file_name, mime_type, file_size, created_at')
        .eq('grievance_id', grievanceId)
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        records = data;
      }
    } catch (err) {
      // Fall through
    }

    if (records.length === 0) {
      records = attachmentFallbackStore.filter((a) => a.grievance_id === grievanceId);
    }

    // Generate signed URLs for each
    const attachmentsWithUrls = await Promise.all(
      records.map(async (rec) => {
        let signedUrl = '';
        try {
          const { data: signedData } = await supabaseServer.storage
            .from(BUCKET_NAME)
            .createSignedUrl(rec.storage_path, 3600 * 24); // 24 hours
          if (signedData?.signedUrl) {
            signedUrl = signedData.signedUrl;
          }
        } catch (sErr) {
          console.warn('[AttachmentService] Signed URL warning for record:', rec.id, sErr.message);
        }

        return {
          ...rec,
          signed_url: signedUrl,
        };
      })
    );

    return attachmentsWithUrls;
  }
}
