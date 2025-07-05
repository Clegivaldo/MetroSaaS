import express from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { authenticateToken } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configurar diretórios de upload
const uploadsDir = join(__dirname, '../uploads');
const certificatesDir = join(uploadsDir, 'certificates');
const standardsDir = join(uploadsDir, 'standards');
const documentsDir = join(uploadsDir, 'documents');

[uploadsDir, certificatesDir, standardsDir, documentsDir].forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

// Configurar multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { type } = req.params;
    let uploadPath = uploadsDir;
    
    switch (type) {
      case 'certificates':
        uploadPath = certificatesDir;
        break;
      case 'standards':
        uploadPath = standardsDir;
        break;
      case 'documents':
        uploadPath = documentsDir;
        break;
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}_${originalName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  }
});

// Upload de arquivo
router.post('/:type', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const filePath = req.file.path.replace(/\\/g, '/');
    const relativePath = filePath.split('/uploads/')[1];

    res.json({
      message: 'Arquivo enviado com sucesso',
      path: `/uploads/${relativePath}`,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro no upload do arquivo' });
  }
});

export default router;