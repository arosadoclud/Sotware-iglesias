import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate } from '../../middleware/auth.middleware';
import { uploadLogo } from './logo.controller';

const router = Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../../uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo_${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

router.post('/', authenticate, upload.single('logo'), uploadLogo);

export default router;
