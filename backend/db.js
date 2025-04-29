const sql = require('mssql');

const config = {
  user: 'sa',
  password: '_43690',
  server: 'localhost\\SQL2022',
  database: 'SecullumAcessoNet',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    rowCollectionOnRequestCompletion: true, // Garante que todas as linhas sejam retornadas
  },
};

module.exports = new sql.ConnectionPool(config).connect();
