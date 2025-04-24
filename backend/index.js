const express = require('express');
const app = express();
const cors = require('cors');
const fs = require('fs');
const path = require('path'); // Importa o módulo path para lidar com caminhos

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Aumenta o limite de tamanho da resposta
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Importa dinamicamente todas as rotas geradas
const routesPath = path.join(__dirname, 'routes'); // Caminho correto para o diretório routes
const routeFiles = fs.readdirSync(routesPath).filter(file => file.endsWith('.js'));
routeFiles.forEach(file => {
  const allTablesRoute = require('./routes/all-tables');
  app.use('/', allTablesRoute);
});

app.listen(3001, () => {
  console.log('API rodando na porta 3001');
});
