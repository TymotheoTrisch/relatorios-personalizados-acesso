const db = require('./db'); // Importa a conexão do arquivo db.js
const fs = require('fs'); // Para salvar em um arquivo TXT

async function gerarJsonDeTabelasEColunas() {
    try {
        console.log('Conectando ao banco de dados...');
        // Obtém a conexão do pool
        const pool = await db;

        console.log('Executando a query...');
        // Busca tabelas, colunas e tipos de dados
        const result = await pool.request().query(`
            SELECT 
                TABLE_NAME AS table_name, 
                COLUMN_NAME AS column_name, 
                DATA_TYPE AS data_type
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_CATALOG = 'AcessoTesteAlison'
            ORDER BY TABLE_NAME, ORDINAL_POSITION
        `);

        const rows = result.recordset;

        if (rows.length === 0) {
            console.log('Nenhum dado foi retornado pela query.');
            return;
        }

        console.log('Montando o conteúdo formatado...');
        // Monta o conteúdo formatado
        let resultadoFormatado = '';
        let tabelaAtual = '';
        rows.forEach(row => {
            const { table_name, column_name, data_type } = row;
            if (tabelaAtual !== table_name) {
                tabelaAtual = table_name;
                resultadoFormatado += `\nTabela: ${table_name}\n`;
                resultadoFormatado += 'Colunas:\n';
            }
            resultadoFormatado += `  - ${column_name} (${data_type})\n`;
        });

        console.log('Salvando o resultado no arquivo...');
        // Salva o resultado em um arquivo TXT
        fs.writeFileSync('tabelas_e_colunas.txt', resultadoFormatado.trim());
        console.log('Resultado salvo no arquivo tabelas_e_colunas.txt');

    } catch (error) {
        console.error('Erro ao buscar tabelas e colunas:', error);
    }
}

gerarJsonDeTabelasEColunas();
