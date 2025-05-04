import db from './db'; // Importa o módulo de conexão
import { writeFileSync } from 'fs'; // Para salvar em um arquivo JSON

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

        console.log('Montando o JSON formatado...');
        // Monta o JSON formatado
        const resultadoJson = {};

        rows.forEach(row => {
            const { table_name, column_name, data_type } = row;

            if (!resultadoJson[table_name]) {
                resultadoJson[table_name] = {
                    description: `Tabela ${table_name}`,
                    columns: {}
                };
            }

            resultadoJson[table_name].columns[column_name] = {
                description: `Coluna ${column_name}`,
                type: data_type
            };
        });

        console.log('Salvando o resultado no arquivo JSON...');
        // Salva o resultado em um arquivo JSON
        writeFileSync('dados.json', JSON.stringify(resultadoJson, null, 4));
        console.log('Resultado salvo no arquivo dados.json');

    } catch (error) {
        console.error('Erro ao buscar tabelas e colunas:', error);
    }
}

gerarJsonDeTabelasEColunas();
