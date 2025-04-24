const db = require('./db'); // Importa o módulo de conexão

async function testConnection() {
  try {
    const pool = await db; // Tenta conectar ao banco
    console.log('Conexão bem-sucedida ao banco de dados!');
    pool.close(); // Fecha a conexão após o teste
  } catch (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  }
}

testConnection();