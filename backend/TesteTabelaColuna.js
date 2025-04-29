const db = require('./db'); // Importa a conexão do arquivo db.js
const fs = require('fs'); // Para salvar em um arquivo TXT

async function gerarJsonDeTabelasEColunas() {
    try {
        // Obtém a conexão do pool
        const pool = await db;

        // Busca tabelas e colunas
        const result = await pool.request().query(`
            SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_CATALOG = 'SecullumAcessoNet'
            ORDER BY TABLE_NAME, ORDINAL_POSITION
        `);

        const rows = result.recordset;

        // Monta o conteúdo formatado
        let resultadoFormatado = '';
        let tabelaAtual = '';
        rows.forEach(row => {
            const { table_name, column_name } = row;
            if (tabelaAtual !== table_name) {
                tabelaAtual = table_name;
                resultadoFormatado += `\nTabela: ${table_name}\n`;
                resultadoFormatado += 'Colunas:\n';
            }
            resultadoFormatado += `  - ${column_name}\n`;
        });

        // Salva o resultado em um arquivo TXT
        fs.writeFileSync('tabelas_e_colunas.txt', resultadoFormatado.trim());
        console.log('Resultado salvo no arquivo tabelas_e_colunas.txt');

    } catch (error) {
        console.error('Erro ao buscar tabelas e colunas:', error);
    }
}

gerarJsonDeTabelasEColunas();
