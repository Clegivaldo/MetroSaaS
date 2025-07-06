const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const auth = require('../middleware/auth');

const router = express.Router();
const db = new sqlite3.Database(path.join(__dirname, '../database/database.db'));

// Listar calibrações
router.get('/', auth, (req, res) => {
  const sql = `
    SELECT c.*, ce.name as equipment_name, cl.name as client_name,
           u.name as technician_name
    FROM calibrations c
    LEFT JOIN client_equipment ce ON c.equipment_id = ce.id
    LEFT JOIN clients cl ON ce.client_id = cl.id
    LEFT JOIN users u ON c.technician_id = u.id
    ORDER BY c.created_at DESC
  `;
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Criar nova calibração
router.post('/', auth, (req, res) => {
  const {
    equipment_id,
    technician_id,
    standards_used,
    environmental_conditions,
    measurement_points,
    observations
  } = req.body;
  
  const sql = `
    INSERT INTO calibrations (
      equipment_id, technician_id, standards_used, 
      environmental_conditions, measurement_points, 
      observations, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'em_andamento', datetime('now'))
  `;
  
  db.run(sql, [
    equipment_id,
    technician_id,
    JSON.stringify(standards_used),
    JSON.stringify(environmental_conditions),
    JSON.stringify(measurement_points),
    observations
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, success: true });
  });
});

// Atualizar calibração
router.put('/:id', auth, (req, res) => {
  const { id } = req.params;
  const {
    standards_used,
    environmental_conditions,
    measurement_points,
    observations,
    status
  } = req.body;
  
  const sql = `
    UPDATE calibrations SET
      standards_used = ?, environmental_conditions = ?,
      measurement_points = ?, observations = ?, status = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `;
  
  db.run(sql, [
    JSON.stringify(standards_used),
    JSON.stringify(environmental_conditions),
    JSON.stringify(measurement_points),
    observations,
    status,
    id
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
});

// Assinar calibração
router.post('/:id/sign', auth, (req, res) => {
  const { id } = req.params;
  const { signature_data } = req.body;
  
  const sql = `
    UPDATE calibrations SET
      signature_data = ?, signed_by = ?, signed_at = datetime('now'),
      status = 'assinada'
    WHERE id = ?
  `;
  
  db.run(sql, [signature_data, req.user.id, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
});

module.exports = router;