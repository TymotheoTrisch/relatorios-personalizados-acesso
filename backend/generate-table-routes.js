const fs = require('fs');
const path = require('path');
const tables = [
  "agenda_comunicacao", "agenda_comunicacao_equips", "agenda_tarefas", "agenda_visitas", "ambientes",
  "ambientes_empresas", "ambientes_vagas_lista", "apartamentos", "arquivo_fotos", "blocos",
  "bloqueios_extras", "bloqueios_extras_grupo", "boxes", "caixas_correios", "cameras",
  "chaves", "chaves_registros", "classificacao_historico", "classificacoes", "comunicados",
  "config_etiqueta", "configs", "consumo_conta_corrente", "consumo_produtos", "consumo_tipos_produtos",
  "correspondencias", "criptografia_numeros", "depositos", "elevadores_andares", "elevadores_configs",
  "elevadores_tarefas", "empresas", "equipamentos", "equipamentos_consistencia", "equipamentos_funcoes",
  "equipamentos_modelos", "equips_especiais", "estado_civil", "estado_historico", "estruturas",
  "etiquetas_itens", "etiquetas_itens_principal", "etiquetas_principal", "eventos_acessos",
  "eventos_acessos_complementos", "eventos_envios", "eventos_imagens", "eventos_registros",
  "exportacao_pessoas_layout", "feriados", "feriados_empresas", "filtro1", "filtro2", "filtro3",
  "filtro4", "filtro5", "fornecedores", "fotos_cadastro", "grau_parentesco", "grupos",
  "grupos_restricoes_classif", "grupos_restricoes_empresa", "grupos_restricoes_equips",
  "grupos_restricoes_hor", "grupos_restricoes_niveis", "horarios", "horarios_itens",
  "horarios_itens_equips", "horarios_itens_equips_t_min", "importar_reservas", "integracao_biometrias",
  "integracao_bloqueios_extras", "integracao_config", "integracao_externa", "integracao_horarios",
  "integracao_mensagens", "layout_acesso_pessoal", "Layout_Importacao_Pessoa", "liberacoes_extras",
  "liberacoes_extras_grupo", "liberacoes_manuais", "locais", "logs", "logs_acoes", "mensagens",
  "movimentacoes_notas_fiscais", "movimentacoes_objetos", "niveis", "niveis_itens", "nivel_historico",
  "numeros_especiais", "numeros_historico", "numeros_validos", "ocorrencias", "ocorrencias_pessoas",
  "ordem_servico", "paineis", "pen_app_tar_realizadas", "pendencias_app", "perguntas_adicionais",
  "pessoas", "pessoas_apartamentos", "pessoas_boxes", "pessoas_caixas_correios", "pessoas_chaves",
  "pessoas_dependentes", "pessoas_depositos", "pessoas_digitais", "pessoas_digitais_envios",
  "pessoas_documentos", "pessoas_hor_funcoes", "pessoas_niveis", "pessoas_padroes", "pessoas_respostas",
  "pessoas_varios_numeros", "pessoas_veiculos", "plantas_baixas", "plantas_baixas_itens",
  "portaria_campos", "processos", "processos_itens", "refeicoes_layout", "registro_sistema",
  "registro_sistema_config", "rel_personalizados", "rel_personalizados_parametros", "reservas_faixas",
  "reservas_locais", "restricoes_cadastros", "servicos_logs", "sirenes", "solicitacoes_app",
  "telas_pessoas", "tempo_entre_acessos", "tipos_documentos", "tipos_ocorrencias", "tipos_refeicoes",
  "tipos_refeicoes_faixas", "tipos_refeicoes_grupo", "usuarios", "usuarios_mensagens", "usuarios_menus",
  "usuarios_restricoes_classif", "usuarios_restricoes_empresa", "usuarios_restricoes_equips",
  "usuarios_restricoes_hor", "usuarios_restricoes_niveis", "veiculos"
];

tables.forEach(table => {
  const content = `
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/${table}', async (req, res) => {
  try {
    const pool = await db;
    const result = await pool.request().query(\`SELECT TOP 100 * FROM [${table}]\`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
`;

  // Ajuste o caminho para salvar os arquivos no diretório correto
  const routesDir = path.join(__dirname, 'routes'); // Caminho para o diretório 'routes'
  if (!fs.existsSync(routesDir)) {
    fs.mkdirSync(routesDir); // Cria o diretório 'routes' se ele não existir
  }
  fs.writeFileSync(path.join(routesDir, `${table}.js`), content.trim());
});

console.log('Arquivos de rotas gerados com sucesso!');