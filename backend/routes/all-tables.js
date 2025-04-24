const express = require('express');
const router = express.Router();
const db = require('../db');
const path = require('path');

router.use('/uploads', express.static(path.join(__dirname, 'uploads')));

router.get('/all-tables', async (req, res) => {
    try {
        const pool = await db;

        // Consulta para obter os nomes das tabelas
        const tablesResult = await pool.request().query(`
          SELECT name AS tableName FROM sys.tables ORDER BY name
        `);

        const tables = tablesResult.recordset;

        const response = [];

        // Itera sobre cada tabela para obter as colunas e os dados
        for (const table of tables) {
            const tableName = table.tableName;

            // Consulta para obter as colunas da tabela
            const columnsResult = await pool.request()
                .input('table', tableName)
                .query(`
                  SELECT c.name AS columnName, ty.name AS dataType
                  FROM sys.tables t
                  JOIN sys.columns c ON t.object_id = c.object_id
                  JOIN sys.types ty ON c.user_type_id = ty.user_type_id
                  WHERE t.name = @table
                  ORDER BY c.column_id
                `);

            const columns = columnsResult.recordset;

            // Consulta para obter os dados da tabela com formatação
            const dataResult = await pool.request().query(`
              SELECT 
                ${columns.map(column => {
                  if (column.dataType === 'datetime' || column.dataType === 'date' || column.dataType === 'smalldatetime') {
                    return `FORMAT([${column.columnName}], 'dd/MM/yyyy') AS [${column.columnName}]`;
                  } else {
                    return `[${column.columnName}]`;
                  }
                }).join(', ')}
              FROM [${tableName}]
            `);

            const data = dataResult.recordset;

            // Adiciona as informações da tabela ao resultado
            response.push({
                tableName,
                columns,
                data,
            });
        }

        res.json(response);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;