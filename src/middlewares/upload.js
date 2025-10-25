import multer from 'multer';
import path from 'node:path';

const tempDir = path.resolve('src', 'temp');

const storage = multer.diskStorage({
  destination: tempDir,
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

export const upload = multer({ storage });
