const express = require('express');
const router = express.Router();
const db = require('../db');

// Rota para listar todas as tabelas
router.get('/tables', async (req, res) => {
  try {
    const pool = await db;
    const result = await pool.request().query(`
      SELECT name AS tableName FROM sys.tables ORDER BY name
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota para listar colunas de uma tabela específica
router.get('/columns/:tableName', async (req, res) => {
  const { tableName } = req.params;
  try {
    const pool = await db;
    const result = await pool.request().query(`
      SELECT COLUMN_NAME AS columnName, DATA_TYPE AS dataType
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${tableName}'
      ORDER BY ORDINAL_POSITION
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota para executar o SQL gerado
router.post('/execute-sql', async (req, res) => {
  const { sqlQuery } = req.body;
  try {
    const pool = await db;
    const result = await pool.request().query(sqlQuery);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;