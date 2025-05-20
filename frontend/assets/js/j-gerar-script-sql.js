// Fetch database schema from JSON file
let databaseSchema = {};
let editor; // Variável global para o editor

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
        editor = ace.edit("sql-editor");
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
        setupEventListeners();

        // Set initial status
        updateStatus('Pronto', 'status');
    } catch (error) {
        console.error('Erro ao inicializar a aplicação:', error);
        updateStatus(`Erro: ${error.message}`, 'error');
    }
});

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

// Get selected GROUP BY columns
function getGroupByColumns() {
    const selected = Array.from(document.querySelectorAll('#groupby-columns-list input:checked'));
    return selected.map(el => `${el.dataset.table}.${el.dataset.column}`);
}

// Get defined variables
function getVariables() {
    const variables = [];
    document.querySelectorAll('.variable-row').forEach(row => {
        const name = row.querySelector('.variable-name').value;
        const type = row.querySelector('.variable-type').value;
        const value = row.querySelector('.variable-value').value;
        if (name) variables.push({ name, type, value });
    });
    return variables;
}

// Update selected counts display
function updateSelectedCounts() {
    document.getElementById('selected-tables-count').textContent =
        `${getSelectedTables().length} selecionados`;
    document.getElementById('selected-columns-count').textContent =
        `${getSelectedColumns().length} selecionados`;
}

// Update GROUP BY columns list
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

// Add variable field
function addVariableField() {
    const container = document.getElementById('variables-container');
    const row = document.createElement('div');
    row.className = 'variable-row';
    
    row.innerHTML = `
        <input type="text" class="form-control variable-name" placeholder="Nome da variável">
        <select class="form-control variable-type">
            <option value="string">String</option>
            <option value="int">Inteiro</option>
            <option value="date">Data</option>
            <option value="datetime">Data/Hora</option>
        </select>
        <input type="text" class="form-control variable-value" placeholder="Valor padrão">
        <button class="action-btn danger remove-variable"><i class="fas fa-times"></i></button>
    `;
    
    row.querySelector('.remove-variable').addEventListener('click', function() {
        row.remove();
    });
    
    container.appendChild(row);
}

// Map variable type to SQL type
function mapVariableType(type) {
    const types = {
        'string': 'VARCHAR(255)',
        'int': 'INT',
        'date': 'DATE',
        'datetime': 'DATETIME'
    };
    return types[type] || 'VARCHAR(255)';
}

// Format variable value for SQL
function formatVariableValue(variable) {
    if (variable.type === 'string') return `'${variable.value}'`;
    if (variable.type === 'date' || variable.type === 'datetime') return `'${variable.value}'`;
    return variable.value;
}

// Add variables declarations to SQL
function addVariablesToQuery(sql, variables) {
    if (!variables || variables.length === 0) return sql;
    
    let declarations = '';
    variables.forEach(v => {
        declarations += `DECLARE @${v.name} ${mapVariableType(v.type)} = ${formatVariableValue(v)};\n`;
    });
    
    return declarations + sql;
}

// Build SELECT clause for GROUP BY queries
function buildSelectWithGroupBy(columns, groupByColumns) {
    return columns.map(col => {
        const fullName = `${col.table}.${col.column}`;
        
        if (groupByColumns.includes(fullName)) {
            return fullName;
        }
        
        return `MAX(${fullName}) AS ${col.column}`;
    }).join(',\n       ');
}

// Build standard SELECT clause
function buildSelectClause(columns) {
    const columnCounts = {};
    columns.forEach(col => {
        columnCounts[col.column] = (columnCounts[col.column] || 0) + 1;
    });

    return columns.map(col => {
        const columnAlias = columnCounts[col.column] > 1 ?
            `${col.column}_${col.table}` : col.column;

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
}

// Generate SQL from selected tables and columns
function generateSQL() {
    const selectedTables = getSelectedTables();
    const selectedColumns = getSelectedColumns();
    const useGroupBy = document.getElementById('use-groupby').checked;

    if (selectedTables.length === 0) {
        updateStatus('Selecione pelo menos uma tabela', 'error');
        return;
    }

    if (selectedColumns.length === 0) {
        updateStatus('Selecione pelo menos uma coluna', 'error');
        return;
    }

    let sql = 'SELECT ';
    
    if (useGroupBy) {
        const groupByColumns = getGroupByColumns();
        sql += buildSelectWithGroupBy(selectedColumns, groupByColumns);
    } else {
        sql += buildSelectClause(selectedColumns);
    }

    sql += `\nFROM ${selectedTables[0]}`;

    // Add JOINs for additional tables
    if (selectedTables.length > 1) {
        const joinType = document.getElementById('join-type').value;
        for (let i = 1; i < selectedTables.length; i++) {
            sql += `\n${joinType} JOIN ${selectedTables[i]} ON ${selectedTables[0]}.id = ${selectedTables[i]}.id`;
        }
    }

    // Add WHERE conditions
    const whereClause = document.getElementById('where-clause').value;
    if (whereClause) {
        sql += `\nWHERE ${whereClause}`;
    }

    // Add GROUP BY if enabled
    if (useGroupBy) {
        const groupByColumns = getGroupByColumns();
        if (groupByColumns.length > 0) {
            sql += `\nGROUP BY ${groupByColumns.join(', ')}`;
            
            // Add HAVING clause if specified
            const havingClause = document.getElementById('having-clause').value;
            if (havingClause) {
                sql += `\nHAVING ${havingClause}`;
            }
        }
    }

    // Add ORDER BY
    sql += `\nORDER BY ${selectedTables[0]}.id`;

    // Add variables if any
    const variables = getVariables();
    sql = addVariablesToQuery(sql, variables);

    editor.setValue(sql);
    updateStatus('SQL gerado com sucesso', 'success');
}

// Generate advanced SQL with all options
function generateAdvancedSQL() {
    generateSQL();
}

// Apply advanced settings
function applyAdvancedSettings() {
    const variables = getVariables();
    const settings = {
        variables,
        whereClause: document.getElementById('where-clause').value,
        havingClause: document.getElementById('having-clause').value,
        groupBy: document.getElementById('use-groupby').checked,
        joinType: document.getElementById('join-type').value
    };
    
    // Atualiza a pré-visualização ou aplica configurações
    updateStatus(`${variables.length} variável(s) definida(s) | ${settings.whereClause ? 'WHERE aplicado' : ''}`, 'success');
    return settings;
}

// Execute SQL query
async function executeSQL() {
    const sql = editor.getValue();

    if (!sql.trim()) {
        updateStatus('Nenhum SQL para executar', 'error');
        return;
    }

    updateStatus('Executando query...', 'status');
    const startTime = performance.now();

    try {
        const response = await fetch('http://localhost:3001/api/sql-generator/execute-sql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sqlQuery: sql })
        });

        const data = await response.json();
        
        if (!response.ok) {
            const errorMsg = data.error?.originalError || data.error?.message || 'Erro desconhecido';
            throw new Error(errorMsg);
        }

        displayQueryResults(data);
        updateStatus('Query executada com sucesso', 'success');
        logExecutionTime(startTime, data.length);
    } catch (error) {
        handleQueryError(error, startTime);
    }
}

// Display query results
function displayQueryResults(results) {
    const resultsContainer = document.getElementById('query-results');

    if (!results || results.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">Nenhum resultado encontrado</div>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'result-table';

    // Create header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    Object.keys(results[0]).forEach(key => {
        const th = document.createElement('th');
        th.textContent = key;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table body
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
    resultsContainer.innerHTML = '';
    resultsContainer.appendChild(table);
}

// Handle query execution error
function handleQueryError(error, startTime) {
    console.error('Erro ao executar query:', error);
    
    const endTime = performance.now();
    const executionTime = endTime - startTime;

    document.getElementById('query-results').innerHTML = `
        <div class="error-message">
            <h4>Erro na execução da query:</h4>
            <pre>${error.message}</pre>
        </div>
    `;
    
    updateStatus(`Erro: ${error.message}`, 'error');
    document.getElementById('query-time').textContent = `Tempo até o erro: ${executionTime.toFixed(2)}ms`;
}

// Log execution time
function logExecutionTime(startTime, rowCount, isError = false) {
    const endTime = performance.now();
    const executionTime = endTime - startTime;
    
    document.getElementById('query-time').textContent = `Tempo de execução: ${executionTime.toFixed(2)}ms`;
    document.getElementById('results-count').textContent = `${rowCount} linha(s) retornada(s)`;
    
    if (isError) {
        document.getElementById('query-time').textContent = `Tempo até o erro: ${executionTime.toFixed(2)}ms`;
    }
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

    document.getElementById('global-status').textContent = message;
}

// Set up all event listeners
function setupEventListeners() {
    // Table search
    document.getElementById('table-search').addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase();
        document.querySelectorAll('.table-btn').forEach(btn => {
            btn.style.display = btn.dataset.tableName.toLowerCase().includes(searchTerm) ? 'block' : 'none';
        });
    });

    // Basic buttons
    document.getElementById('generate-sql').addEventListener('click', generateSQL);
    document.getElementById('format-sql').addEventListener('click', formatSQL);
    document.getElementById('clear-sql').addEventListener('click', () => editor.setValue(''));
    document.getElementById('execute-sql').addEventListener('click', executeSQL);
    document.getElementById('cancel-query').addEventListener('click', () => updateStatus('Query cancelada', 'warning'));

    // Advanced options
    document.getElementById('advanced-toggle').addEventListener('click', function() {
        this.classList.toggle('active');
        document.getElementById('advanced-content').classList.toggle('expanded');
    });

    document.getElementById('use-groupby').addEventListener('change', function() {
        document.getElementById('groupby-columns-container').style.display = this.checked ? 'block' : 'none';
        if (this.checked) updateGroupByColumnsList();
    });

    document.getElementById('apply-advanced').addEventListener('click', applyAdvancedSettings);
    document.getElementById('generate-advanced-sql').addEventListener('click', generateAdvancedSQL);
    document.getElementById('add-variable').addEventListener('click', addVariableField);

    // Tooltips
    document.addEventListener('mouseover', function (e) {
        const target = e.target.closest('.tooltip');
        if (target) {
            const tooltip = target.querySelector('.tooltiptext');
            if (tooltip) {
                document.getElementById('description-box').textContent = tooltip.textContent;
            }
        }
    });
}

// Format SQL
function formatSQL() {
    updateStatus('Formatando SQL...', 'status');

    try {
        const currentValue = editor.getValue();
        if (!currentValue.trim()) {
            updateStatus('Nenhum SQL para formatar', 'warning');
            return;
        }

        const formattedSQL = sqlFormatter.format(currentValue, {
            language: 'tsql',
            indent: '  ',
            keywordCase: 'upper',
            logicalOperatorNewline: 'before'
        });

        editor.setValue(formattedSQL);
        updateStatus('SQL formatado com sucesso', 'success');
    } catch (error) {
        console.error('Erro ao formatar SQL:', error);
        updateStatus('Erro ao formatar SQL', 'error');
    }
}