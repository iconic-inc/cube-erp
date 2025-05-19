import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { BadRequestError } from '../api/core/errors';

const UPLOAD_FOLDER = 'public/uploads';
const TMP_FOLDER = path.join(__dirname, '../../tmp');

/**
 * Configure storage for different upload types
 * @param subfolder - Subfolder within uploads directory
 * @returns Multer storage configuration
 */
export const storage = (subfolder: string = '') => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      let uploadPath = UPLOAD_FOLDER;

      // For temp files (imports, exports, etc)
      if (subfolder.includes('import') || subfolder.includes('export')) {
        uploadPath = TMP_FOLDER;
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
        return;
      }

      // For regular uploads, create subfolder if needed
      if (subfolder) {
        uploadPath = `${UPLOAD_FOLDER}/${subfolder}`;
      }

      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      // Generate unique filename with original extension
      const fileExt = path.extname(file.originalname);
      const fileName = `${Date.now()}-${file.originalname
        .replace(fileExt, '')
        .replace(/\s+/g, '-')
        .toLowerCase()}${fileExt}`;
      cb(null, fileName);
    },
  });
};

/**
 * Filter files based on allowed file types
 * @param allowedTypes - Array of allowed file extensions without the dot
 * @returns File filter function for multer
 */
export const fileFilter = (allowedTypes: string[] = []) => {
  return (
    req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    if (!allowedTypes || allowedTypes.length === 0) {
      cb(null, true);
      return;
    }

    const fileExt = path.extname(file.originalname).toLowerCase().substring(1);

    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(
        new BadRequestError(
          `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
        )
      );
    }
  };
};

// Predefined storage configurations
export const diskStorage = multer({
  storage: storage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export const memoryStorage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Export the enhanced multer configurations
export default {
  storage,
  fileFilter,
  diskStorage,
  memoryStorage,
};
