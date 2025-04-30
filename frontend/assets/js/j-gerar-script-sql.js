// Fetch database schema from JSON file
let databaseSchema = {};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async function () {
    try {
        // Fetch the JSON file
        const response = await fetch('../Dados.json');
        if (!response.ok) {
            throw new Error(`Erro ao carregar o arquivo JSON: ${response.status}`);
        }
        databaseSchema = await response.json();

        // Initialize ACE editor
        const editor = ace.edit("sql-editor");
        editor.setTheme("ace/theme/twilight");
        editor.session.setMode("ace/mode/sql");
        editor.setOptions({
            fontSize: "13px",
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true
        });

        // Populate tables and columns from the database schema
        populateTablesAndColumns();

        // Set up event listeners
        setupEventListeners(editor);

        // Set initial status
        updateStatus('Pronto', 'status');
    } catch (error) {
        console.error('Erro ao inicializar a aplicação:', error);
        updateStatus(`Erro: ${error.message}`, 'error');
    }
});

// The rest of the code remains unchanged
// Populate tables and columns lists
function populateTablesAndColumns() {
    const tablesList = document.getElementById('tables-list');
    const columnsList = document.getElementById('columns-list');

    // Clear existing content
    tablesList.innerHTML = '';
    columnsList.innerHTML = '';

    // Add tables to the list
    for (const tableName in databaseSchema) {
        const table = databaseSchema[tableName];

        // Create table button
        const tableBtn = document.createElement('button');
        tableBtn.className = 'table-btn tooltip';
        tableBtn.innerHTML = `<i class="fas fa-table"></i> ${tableName}`;
        tableBtn.dataset.tableName = tableName;

        // Add tooltip with description
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltiptext';
        tooltip.textContent = table.description || 'Nenhuma descrição disponível';
        tableBtn.appendChild(tooltip);

        // Add click event to select table and show its columns
        tableBtn.addEventListener('click', function () {
            this.classList.toggle('selected');
            updateSelectedCounts();
            populateColumnsForSelectedTables();
        });

        tablesList.appendChild(tableBtn);
    }

    // Initially no columns are shown
    columnsList.innerHTML = '<div class="no-columns">Selecione tabelas para visualizar suas colunas</div>';
}

// Populate columns for selected tables
function populateColumnsForSelectedTables() {
    const columnsList = document.getElementById('columns-list');
    const selectedTables = getSelectedTables();
    const previouslySelected = getSelectedColumns();

    // Clear existing columns
    columnsList.innerHTML = '';

    if (selectedTables.length === 0) {
        columnsList.innerHTML = '<div class="no-columns">Selecione tabelas para visualizar suas colunas</div>';
        return;
    }

    // Add columns from all selected tables
    selectedTables.forEach(tableName => {
        const table = databaseSchema[tableName];
        if (!table || !table.columns) return;

        // Add a header for the table
        const tableHeader = document.createElement('div');
        tableHeader.className = 'table-columns-header';
        tableHeader.textContent = tableName;
        columnsList.appendChild(tableHeader);

        // Add columns for this table
        for (const columnName in table.columns) {
            const columnInfo = table.columns[columnName];
            const fullName = `${tableName}.${columnName}`;

            // Verificar se esta coluna estava selecionada anteriormente
            const wasSelected = previouslySelected.some(col =>
                col.table === tableName && col.column === columnName);

            // Create column button
            const columnBtn = document.createElement('button');
            columnBtn.className = wasSelected ? 'column-btn selected tooltip' : 'column-btn tooltip';
            columnBtn.innerHTML = `${columnName} <span class="column-type">${columnInfo.type}</span>`;
            columnBtn.dataset.tableName = tableName;
            columnBtn.dataset.columnName = columnName;
            columnBtn.dataset.type = columnInfo.type;
            columnBtn.dataset.fullName = fullName;

            // Add tooltip with description
            const tooltip = document.createElement('span');
            tooltip.className = 'tooltiptext';
            tooltip.textContent = columnInfo.description || 'Nenhuma descrição disponível';
            columnBtn.appendChild(tooltip);

            // Add click event to select column
            columnBtn.addEventListener('click', function () {
                this.classList.toggle('selected');
                updateSelectedCounts();
            });

            columnsList.appendChild(columnBtn);
        }
    });

    updateSelectedCounts();
}

// Get currently selected tables
function getSelectedTables() {
    const selectedTableBtns = document.querySelectorAll('.table-btn.selected');
    return Array.from(selectedTableBtns).map(btn => btn.dataset.tableName);
}

// Get currently selected columns
function getSelectedColumns() {
    const selectedColumnBtns = document.querySelectorAll('.column-btn.selected');
    return Array.from(selectedColumnBtns).map(btn => ({
        table: btn.dataset.tableName,
        column: btn.dataset.columnName,
        type: btn.dataset.type,
        fullName: btn.dataset.fullName
    }));
}

// Update selected counts display
function updateSelectedCounts() {
    document.getElementById('selected-tables-count').textContent =
        `${getSelectedTables().length} selecionados`;
    document.getElementById('selected-columns-count').textContent =
        `${getSelectedColumns().length} selecionados`;
}

// Set up all event listeners
function setupEventListeners(editor) {
    // Table search functionality
    document.getElementById('table-search').addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase();
        const tableButtons = document.querySelectorAll('.table-btn');

        tableButtons.forEach(btn => {
            const tableName = btn.dataset.tableName.toLowerCase();
            if (tableName.includes(searchTerm)) {
                btn.style.display = 'block';
            } else {
                btn.style.display = 'none';
            }
        });
    });

    // Generate SQL button
    document.getElementById('generate-sql').addEventListener('click', function () {
        generateSQL(editor);
    });

    // Format SQL button
    document.getElementById('format-sql').addEventListener('click', function () {
        updateStatus('Formatando SQL...', 'status');

        try {
            const editor = ace.edit("sql-editor");
            const currentValue = editor.getValue();

            if (!currentValue.trim()) {
                updateStatus('Nenhum SQL para formatar', 'warning');
                return;
            }

            // Para SQL Server (incluindo funções específicas como TOP, OVER, etc.)
            const formattedSQL = sqlFormatter.format(currentValue, {
                language: 'tsql', // Tipo SQL Server
                indent: '  ',     // 2 espaços
                keywordCase: 'upper',
                logicalOperatorNewline: 'before' // Operadores lógicos em nova linha
            });

            editor.setValue(formattedSQL);
            updateStatus('SQL formatado com sucesso', 'success');

        } catch (error) {
            console.error('Erro ao formatar SQL:', error);
            updateStatus('Erro ao formatar SQL', 'error');
        }
    });

    // Clear SQL button
    document.getElementById('clear-sql').addEventListener('click', function () {
        editor.setValue('');
        updateStatus('Editor limpo', 'success');
    });

    // Execute SQL button
    document.getElementById('execute-sql').addEventListener('click', function () {
        executeSQL(editor);
    });

    // Cancel Query button
    document.getElementById('cancel-query').addEventListener('click', function () {
        // In a real app, this would cancel a running query
        updateStatus('Query cancelada', 'warning');
    });

    // Show description when hovering over table or column
    document.addEventListener('mouseover', function (e) {
        const target = e.target.closest('.tooltip');
        if (target) {
            const tooltip = target.querySelector('.tooltiptext');
            if (tooltip) {
                document.getElementById('description-box').textContent = tooltip.textContent;
            }
        }
    });

    document.getElementById('advanced-toggle').addEventListener('click', function () {
        this.classList.toggle('active');
        document.getElementById('advanced-content').classList.toggle('expanded');
    });

    document.getElementById('use-groupby').addEventListener('change', function () {
        document.getElementById('groupby-columns-container').style.display =
            this.checked ? 'block' : 'none';
        if (this.checked) {
            updateGroupByColumnsList();
        }
    });

    document.getElementById('apply-advanced').addEventListener('click', function () {
        updateStatus('Configurações avançadas aplicadas', 'success');
    });

    document.getElementById('generate-advanced-sql').addEventListener('click', function () {
        generateAdvancedSQL(editor);
    });
}

// Adicione estas novas funções:
function updateGroupByColumnsList() {
    const container = document.getElementById('groupby-columns-list');
    const selectedColumns = getSelectedColumns();

    container.innerHTML = '';

    selectedColumns.forEach(col => {
        const item = document.createElement('div');
        item.className = 'groupby-column-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `groupby-${col.table}-${col.column}`;
        checkbox.dataset.table = col.table;
        checkbox.dataset.column = col.column;

        const label = document.createElement('label');
        label.htmlFor = `groupby-${col.table}-${col.column}`;
        label.textContent = `${col.table}.${col.column}`;
        label.style.marginLeft = '5px';

        item.appendChild(checkbox);
        item.appendChild(label);
        container.appendChild(item);
    });
}

// Generate SQL from selected tables and columns with formatting
function generateSQL(editor) {
    const selectedTables = getSelectedTables();
    const selectedColumns = getSelectedColumns();

    if (selectedTables.length === 0) {
        updateStatus('Selecione pelo menos uma tabela', 'error');
        return;
    }

    if (selectedColumns.length === 0) {
        updateStatus('Selecione pelo menos uma coluna', 'error');
        return;
    }

    // Contador para colunas com mesmo nome
    const columnCounts = {};
    selectedColumns.forEach(col => {
        columnCounts[col.column] = (columnCounts[col.column] || 0) + 1;
    });

    // Start building the SQL query
    let sql = 'SELECT ';

    // Add columns with SQL formatting
    sql += selectedColumns.map(col => {
        // Se houver colunas com mesmo nome, adiciona o nome da tabela como sufixo
        const columnAlias = columnCounts[col.column] > 1 ?
            `${col.column}_${col.table}` :
            col.column;

        switch (col.type.toLowerCase()) {
            case 'date':
                return `CONVERT(VARCHAR(10), ${col.fullName}, 103) AS ${columnAlias}`;
            case 'time':
                return `CONVERT(VARCHAR(8), ${col.fullName}, 108) AS ${columnAlias}`;
            case 'datetime':
            case 'datetime2':
            case 'smalldatetime':
            case 'timestamp':
                return `CONVERT(VARCHAR(10), ${col.fullName}, 103) + ' ' + CONVERT(VARCHAR(8), ${col.fullName}, 108) AS ${columnAlias}`;
            case 'boolean':
            case 'bool':
                return `CASE WHEN ${col.fullName} = 1 THEN 'TRUE' ELSE 'FALSE' END AS ${columnAlias}`;
            case 'decimal':
            case 'numeric':
            case 'float':
                return `CAST(${col.fullName} AS VARCHAR) AS ${columnAlias}`;
            default:
                return `${col.fullName} AS ${columnAlias}`;
        }
    }).join(', ');

    // Restante do código permanece igual...
    // Add FROM clause with primary table
    sql += `\nFROM ${selectedTables[0]}`;

    // Add JOINs for additional tables
    if (selectedTables.length > 1) {
        for (let i = 1; i < selectedTables.length; i++) {
            sql += `\nINNER JOIN ${selectedTables[i]} ON ${selectedTables[0]}.id = ${selectedTables[i]}.id`;
        }
    }

    sql += ';';

    // Set the SQL in the editor
    editor.setValue(sql);

    updateStatus('SQL gerado com sucesso', 'success');
}

// Adicionar esta função para gerar queries mais complexas
function generateAdvancedSQL(editor) {
    const selectedTables = getSelectedTables();
    const selectedColumns = getSelectedColumns();

    if (selectedTables.length === 0 || selectedColumns.length === 0) {
        updateStatus('Selecione tabelas e colunas', 'error');
        return;
    }

    // Obter parâmetros avançados
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const nameFilter = document.getElementById('name-filter').value;
    const whereClause = document.getElementById('where-clause').value;
    const havingClause = document.getElementById('having-clause').value;
    const useGroupBy = document.getElementById('use-groupby').checked;
    const joinType = document.getElementById('join-type').value;

    // Construir a query
    let sql = 'SELECT ';

    // Adicionar colunas
    sql += selectedColumns.map(col => {
        const columnAlias = `${col.table}_${col.column}`;

        switch (col.type.toLowerCase()) {
            case 'date':
                return `CONVERT(VARCHAR(10), ${col.table}.${col.column}, 103) AS ${columnAlias}`;
            case 'time':
                return `CONVERT(VARCHAR(8), ${col.table}.${col.column}, 108) AS ${columnAlias}`;
            case 'datetime':
            case 'datetime2':
            case 'smalldatetime':
            case 'timestamp':
                return `CONVERT(VARCHAR(10), ${col.table}.${col.column}, 103) + ' ' + CONVERT(VARCHAR(8), ${col.table}.${col.column}, 108) AS ${columnAlias}`;
            case 'boolean':
            case 'bool':
                return `CASE WHEN ${col.table}.${col.column} = 1 THEN 'TRUE' ELSE 'FALSE' END AS ${columnAlias}`;
            case 'decimal':
            case 'numeric':
            case 'float':
                return `CAST(${col.table}.${col.column} AS VARCHAR) AS ${columnAlias}`;
            default:
                return `${col.table}.${col.column} AS ${columnAlias}`;
        }
    }).join(',\n       ');

    // FROM e JOINs
    sql += `\nFROM ${selectedTables[0]}`;

    // Adicionar JOINs para tabelas adicionais
    for (let i = 1; i < selectedTables.length; i++) {
        sql += `\n${joinType} JOIN ${selectedTables[i]} ON ${selectedTables[0]}.id = ${selectedTables[i]}.id`;
    }

    // WHERE
    let whereConditions = [];

    if (startDate && endDate) {
        whereConditions.push(`data BETWEEN '${startDate}' AND '${endDate}'`);
    }

    if (nameFilter) {
        whereConditions.push(`nome LIKE '%${nameFilter}%'`);
    }

    if (whereClause) {
        whereConditions.push(whereClause);
    }

    if (whereConditions.length > 0) {
        sql += `\nWHERE ${whereConditions.join(' AND ')}`;
    }

    // GROUP BY
    if (useGroupBy) {
        const groupByColumns = Array.from(document.querySelectorAll('#groupby-columns-list input:checked'))
            .map(el => `${el.dataset.table}.${el.dataset.column}`);

        if (groupByColumns.length > 0) {
            sql += `\nGROUP BY ${groupByColumns.join(', ')}`;

            // HAVING
            if (havingClause) {
                sql += `\nHAVING ${havingClause}`;
            }
        }
    }

    // ORDER BY (simplificado - pode ser melhorado)
    sql += `\nORDER BY ${selectedTables[0]}.id`;

    editor.setValue(sql);
    updateStatus('SQL avançado gerado com sucesso', 'success');
}

// Adicionar ao setupEventListeners
document.getElementById('generate-advanced-sql').addEventListener('click', function () {
    generateAdvancedSQL(editor);
});

// Execute SQL (now with real database connection)
async function executeSQL(editor) {
    const sql = editor.getValue();

    if (!sql.trim()) {
        updateStatus('Nenhum SQL para executar', 'error');
        return;
    }

    updateStatus('Executando query...', 'status');

    // Inicia o contador de tempo
    const startTime = performance.now(); // ou Date.now()

    try {
        // Call backend API to execute the query
        const response = await fetch('http://localhost:3001/api/sql-generator/execute-sql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sqlQuery: sql }),
        });

        if (!response.ok) {
            throw new Error(`Erro no servidor: ${response.status}`);
        }

        const results = await response.json();

        // Calcula o tempo decorrido
        const endTime = performance.now(); // ou Date.now()
        const executionTime = endTime - startTime;

        // Display results without additional formatting
        displayQueryResults(results);

        updateStatus('Query executada com sucesso', 'success');
        document.getElementById('query-time').textContent = `Tempo de execução: ${executionTime.toFixed(2)}ms`;
        document.getElementById('results-count').textContent = `${results.length} linhas`;
    } catch (error) {
        // Calcula o tempo mesmo em caso de erro
        const endTime = performance.now();
        const executionTime = endTime - startTime;

        console.error('Erro ao executar query:', error);
        updateStatus(`Erro: ${error.message}`, 'error');
        document.getElementById('query-results').innerHTML =
            `<div class="error-message">Erro ao executar query: ${error.message}</div>`;
        document.getElementById('query-time').textContent = `Tempo até o erro: ${executionTime.toFixed(2)}ms`;
    }
}

// Display query results without additional formatting
function displayQueryResults(results) {
    const resultsContainer = document.getElementById('query-results');

    if (!results || results.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">Nenhum resultado encontrado</div>';
        return;
    }

    // Create table
    const table = document.createElement('table');
    table.className = 'result-table';

    // Create header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    // Add headers based on the keys of the first result
    Object.keys(results[0]).forEach(key => {
        const th = document.createElement('th');
        th.textContent = key;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table body with data rows
    const tbody = document.createElement('tbody');

    results.forEach(row => {
        const tr = document.createElement('tr');

        Object.values(row).forEach(value => {
            const td = document.createElement('td');
            td.textContent = value === null ? 'NULL' : value;
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);

    // Clear previous results and add the new table
    resultsContainer.innerHTML = '';
    resultsContainer.appendChild(table);
}

// Update status message
function updateStatus(message, type = 'status') {
    const statusElement = document.getElementById('query-status');
    statusElement.textContent = message;
    statusElement.className = 'status-message';

    if (type === 'success') {
        statusElement.classList.add('success');
    } else if (type === 'error') {
        statusElement.classList.add('error');
    } else if (type === 'warning') {
        statusElement.classList.add('warning');
    }

    // Also update global status
    document.getElementById('global-status').textContent = message;
}