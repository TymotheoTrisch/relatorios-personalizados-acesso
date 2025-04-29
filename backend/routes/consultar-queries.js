const express = require('express');
const router = express.Router();

// Rota para executar SQL
router.post('/execute-sql', async (req, res) => {
  const { sqlQuery } = req.body;
  
  try {
    // Conectar ao banco de dados
    const pool = await db;
    
    // Executar a query
    const result = await pool.request().query(sqlQuery);
    
    // Retornar os resultados
    res.json(result.recordset);
  } catch (err) {
    console.error('Erro ao executar SQL:', err);
    res.status(500).json({ error: err.message });
  } finally {
    // Fechar a conexão
    sql.close();
  }
});

module.exports = router;