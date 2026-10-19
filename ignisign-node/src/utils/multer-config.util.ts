import * as multer from 'multer';
import * as path from 'path';

const UPLOAD_TMP = 'uploads_tmp/';

// SECURITY: Define allowed file types for uploads
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// SECURITY: Maximum file size (15MB)
const MAX_FILE_SIZE = 15 * 1024 * 1024;

// SECURITY: File filter to validate uploads
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check MIME type
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`));
  }
};

// Secure multer configuration
export const secureUpload = multer({
  dest: UPLOAD_TMP,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Limit to 1 file per request
  },
  fileFilter: fileFilter,
});

export { UPLOAD_TMP };
