const express = require('express');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const extract = require('extract-zip');
const auth = require('../middleware/auth');

const router = express.Router();

// Criar backup manual
router.post('/create', auth, async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup-${timestamp}.zip`;
    const backupPath = path.join(__dirname, '../backups', backupName);
    
    const output = fs.createWriteStream(backupPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
      res.json({ 
        success: true, 
        filename: backupName,
        size: archive.pointer() 
      });
    });
    
    archive.on('error', (err) => {
      throw err;
    });
    
    archive.pipe(output);
    
    // Adicionar banco de dados
    archive.file(path.join(__dirname, '../database/database.db'), { name: 'database.db' });
    
    // Adicionar uploads
    archive.directory(path.join(__dirname, '../uploads'), 'uploads');
    
    archive.finalize();
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar backups
router.get('/list', auth, (req, res) => {
  const backupDir = path.join(__dirname, '../backups');
  
  if (!fs.existsSync(backupDir)) {
    return res.json([]);
  }
  
  const files = fs.readdirSync(backupDir)
    .filter(file => file.endsWith('.zip'))
    .map(file => {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        created: stats.mtime
      };
    })
    .sort((a, b) => b.created - a.created);
    
  res.json(files);
});

// Restaurar backup
router.post('/restore/:filename', auth, async (req, res) => {
  try {
    const { filename } = req.params;
    const backupPath = path.join(__dirname, '../backups', filename);
    
    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ error: 'Backup não encontrado' });
    }
    
    const tempDir = path.join(__dirname, '../temp-restore');
    
    // Extrair backup
    await extract(backupPath, { dir: tempDir });
    
    // Restaurar banco de dados
    const dbSource = path.join(tempDir, 'database.db');
    const dbTarget = path.join(__dirname, '../database/database.db');
    
    if (fs.existsSync(dbSource)) {
      fs.copyFileSync(dbSource, dbTarget);
    }
    
    // Restaurar uploads
    const uploadsSource = path.join(tempDir, 'uploads');
    const uploadsTarget = path.join(__dirname, '../uploads');
    
    if (fs.existsSync(uploadsSource)) {
      fs.rmSync(uploadsTarget, { recursive: true, force: true });
      fs.cpSync(uploadsSource, uploadsTarget, { recursive: true });
    }
    
    // Limpar temp
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    res.json({ success: true });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;