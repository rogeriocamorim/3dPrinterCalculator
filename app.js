// ============================================
// 3D Print Quote Generator - v2.0
// Database-like file storage with auto-save
// ============================================

// Application State
let appData = {
    printers: [],
    filaments: [],
    laborTasks: {
        pre: [],   // Array of { name, hours, minutes, rate }
        post: []
    }
};

// Database (File) Connection State
let fileHandle = null;
let isConnected = false;
let autoSaveTimeout = null;

// ID Counters
let printerIdCounter = 1;
let filamentIdCounter = 1;

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    initializeNavigation();
    initializeQuotePage();
    initializePrintersPage();
    initializeMaterialsPage();
    initializeDatabaseConnection();
    
    // Try to auto-connect on load
    await tryAutoConnect();
});

// ============================================
// Database Connection
// ============================================

function initializeDatabaseConnection() {
    const connectBtn = document.getElementById('connect-db-btn');
    const fileInput = document.getElementById('file-input');
    
    connectBtn.addEventListener('click', handleConnectClick);
    fileInput.addEventListener('change', handleFileInputChange);
}

async function handleConnectClick() {
    if (isConnected) {
        // Show file info or reconnect option
        const action = confirm(`Connected to: ${fileHandle?.name || 'database'}\n\nClick OK to disconnect and connect to a different file.`);
        if (action) {
            await disconnectDatabase();
            await connectToDatabase();
        }
    } else {
        await connectToDatabase();
    }
}

async function tryAutoConnect() {
    // Check if we have data in localStorage (fallback)
    const savedData = localStorage.getItem('3dPrintQuoteData');
    if (savedData) {
        try {
            appData = JSON.parse(savedData);
            updateIdCounters();
            renderAll();
        } catch (e) {
            console.error('Error loading from localStorage:', e);
        }
    }
    
    // Always show the database connection modal on first load
    // unless we're already connected (check localStorage flag)
    const wasConnected = localStorage.getItem('3dPrintQuoteConnected');
    if (!wasConnected) {
        // Show database connection modal immediately
        setTimeout(() => {
            showCreateDatabaseModal();
        }, 300);
    }
    
    // Load default data if empty
    if (appData.printers.length === 0 && appData.filaments.length === 0) {
        loadDefaultData();
    }
}

async function connectToDatabase() {
    if ('showOpenFilePicker' in window) {
        try {
            const [handle] = await window.showOpenFilePicker({
                types: [{
                    description: 'JSON Database',
                    accept: { 'application/json': ['.json'] }
                }],
                multiple: false
            });
            
            fileHandle = handle;
            await loadFromFile();
            setConnectionStatus(true);
            
        } catch (error) {
            if (error.name === 'AbortError') {
                // User cancelled - show create new option
                showCreateDatabaseModal();
            } else {
                console.error('Error connecting:', error);
                showNotification('Failed to connect to database', 'error');
            }
        }
    } else {
        // Fallback for browsers without File System Access API
        document.getElementById('file-input').click();
    }
}

function showCreateDatabaseModal() {
    // Create a modal for database options
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'db-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Database Connection</h3>
            <p>No file was selected. What would you like to do?</p>
            <div class="modal-buttons">
                <button class="btn-primary" id="create-new-db-btn">Create New Database</button>
                <button class="btn-secondary" id="open-existing-db-btn">Open Existing File</button>
                <button class="btn-cancel" id="cancel-db-btn">Continue Without File</button>
            </div>
            <p class="modal-note">Without a file, data is stored in browser only.</p>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Add event listeners
    document.getElementById('create-new-db-btn').addEventListener('click', async () => {
        closeModal();
        await createNewDatabase();
    });
    
    document.getElementById('open-existing-db-btn').addEventListener('click', async () => {
        closeModal();
        await connectToDatabase();
    });
    
    document.getElementById('cancel-db-btn').addEventListener('click', () => {
        closeModal();
        // Mark as "connected" to localStorage only so modal doesn't show again
        localStorage.setItem('3dPrintQuoteConnected', 'localStorage');
    });
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

function closeModal() {
    const modal = document.getElementById('db-modal');
    if (modal) modal.remove();
}

async function createNewDatabase() {
    if ('showSaveFilePicker' in window) {
        try {
            fileHandle = await window.showSaveFilePicker({
                suggestedName: '3d-print-database.json',
                types: [{
                    description: 'JSON Database',
                    accept: { 'application/json': ['.json'] }
                }]
            });
            
            // Save current data to new file
            await saveToFile();
            setConnectionStatus(true);
            showNotification('Database created successfully!', 'success');
            
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error creating database:', error);
                showNotification('Failed to create database file', 'error');
            }
        }
    } else {
        // Fallback: download file
        downloadDatabaseFile();
    }
}

function downloadDatabaseFile() {
    const dataStr = JSON.stringify(appData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '3d-print-database.json';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Database file downloaded. Load it to enable auto-save.', 'info');
}

async function handleFileInputChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        appData = data;
        updateIdCounters();
        renderAll();
        saveToLocalStorage();
        
        // Note: Without File System Access API, we can't auto-save back
        setConnectionStatus(false, 'read-only');
        showNotification('Data loaded (read-only mode)', 'warning');
        
    } catch (error) {
        showNotification('Error loading file: ' + error.message, 'error');
    }
    
    event.target.value = '';
}

async function loadFromFile() {
    if (!fileHandle) return;
    
    try {
        const file = await fileHandle.getFile();
        const text = await file.text();
        const data = JSON.parse(text);
        
        appData = data;
        updateIdCounters();
        renderAll();
        saveToLocalStorage();
        
        showNotification('Database connected!', 'success');
        
    } catch (error) {
        console.error('Error loading from file:', error);
        showNotification('Error loading database', 'error');
    }
}

async function saveToFile() {
    if (!fileHandle || !isConnected) {
        saveToLocalStorage();
        return;
    }
    
    try {
        const writable = await fileHandle.createWritable();
        await writable.write(JSON.stringify(appData, null, 2));
        await writable.close();
        
        // Also save to localStorage as backup
        saveToLocalStorage();
        
        // Visual feedback
        pulseConnectionStatus();
        
    } catch (error) {
        console.error('Error saving to file:', error);
        showNotification('Error saving to database', 'error');
        setConnectionStatus(false);
    }
}

function saveToLocalStorage() {
    localStorage.setItem('3dPrintQuoteData', JSON.stringify(appData));
}

function autoSave() {
    // Debounce auto-save
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(async () => {
        await saveToFile();
    }, 1000);
}

async function disconnectDatabase() {
    fileHandle = null;
    setConnectionStatus(false);
}

function setConnectionStatus(connected, mode = 'full') {
    isConnected = connected;
    const statusEl = document.getElementById('db-status');
    const textEl = statusEl.querySelector('.db-status-text');
    const btnEl = statusEl.querySelector('.db-status-btn');
    
    statusEl.classList.remove('connected', 'disconnected');
    
    if (connected) {
        statusEl.classList.add('connected');
        textEl.textContent = `Connected: ${fileHandle?.name || 'database.json'}`;
        btnEl.textContent = 'Connected';
        // Remember that we've connected (won't show modal next time)
        localStorage.setItem('3dPrintQuoteConnected', 'true');
    } else {
        statusEl.classList.add('disconnected');
        textEl.textContent = mode === 'read-only' ? 'Read-only mode (no auto-save)' : 'No database connected';
        btnEl.textContent = 'Connect';
        // Clear the connected flag
        localStorage.removeItem('3dPrintQuoteConnected');
    }
}

function pulseConnectionStatus() {
    const indicator = document.querySelector('.db-status-indicator');
    indicator.style.transform = 'scale(1.5)';
    setTimeout(() => {
        indicator.style.transform = 'scale(1)';
    }, 200);
}

function showConnectPrompt() {
    const statusBtn = document.getElementById('connect-db-btn');
    statusBtn.style.animation = 'pulse 1s ease-in-out 3';
}

function showNotification(message, type = 'info') {
    // Simple notification (could be enhanced with a toast system)
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// ============================================
// Navigation
// ============================================

function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const page = item.dataset.page;
            
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(`${page}-page`).classList.add('active');
        });
    });
}

// ============================================
// Quote Page
// ============================================

function initializeQuotePage() {
    // Add material button
    document.getElementById('add-material-btn').addEventListener('click', addQuoteMaterial);
    
    // Add extra cost button
    document.getElementById('add-extra-cost-btn').addEventListener('click', addExtraCost);
    
    // Pricing mode changes
    document.querySelectorAll('input[name="pricing-mode"]').forEach(radio => {
        radio.addEventListener('change', handlePricingModeChange);
    });

    // Pricing mode option styling
    document.querySelectorAll('.pricing-mode-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.pricing-mode-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
        });
    });
    
    // Collapsible sections
    document.querySelectorAll('.collapsible-header').forEach(header => {
        header.addEventListener('click', () => {
            header.closest('.collapsible').classList.toggle('collapsed');
        });
    });
    
    // Cost breakdown toggle
    const breakdownToggle = document.getElementById('cost-breakdown-toggle');
    const breakdownContent = document.getElementById('results-breakdown');
    if (breakdownToggle && breakdownContent) {
        breakdownToggle.addEventListener('click', () => {
            breakdownToggle.classList.toggle('expanded');
            breakdownContent.classList.toggle('expanded');
        });
    }
    
    // Auto-calculate on any input change
    document.getElementById('quote-page').addEventListener('input', debounce(calculateQuote, 100));
    document.getElementById('quote-page').addEventListener('change', calculateQuote);
    
    // Math breakdown toggles - use event delegation for dynamic content
    document.getElementById('results-breakdown').addEventListener('click', function(e) {
        const row = e.target.closest('.result-row.has-detail');
        if (row) {
            // Make sure the Cost Breakdown section is expanded first
            const breakdownToggle = document.getElementById('cost-breakdown-toggle');
            const breakdownContent = document.getElementById('results-breakdown');
            if (!breakdownToggle.classList.contains('expanded')) {
                breakdownToggle.classList.add('expanded');
                breakdownContent.classList.add('expanded');
            }
            
            row.classList.toggle('expanded');
            const mathEl = row.nextElementSibling;
            if (mathEl && mathEl.classList.contains('result-math')) {
                mathEl.classList.toggle('expanded');
            }
        }
    });
    
    // Initial material row
    addQuoteMaterial();
    
    // Initialize labor tasks from saved data
    initializeLaborTasks();
    
    // Initial calculation
    setTimeout(calculateQuote, 100);
}

// ============================================
// Labor Tasks
// ============================================

function initializeLaborTasks() {
    // Ensure laborTasks exists in appData
    if (!appData.laborTasks) {
        appData.laborTasks = { pre: [], post: [] };
    }
    
    renderLaborTasks();
}

function renderLaborTasks() {
    ['pre', 'post'].forEach(type => {
        const container = document.getElementById(`${type}-labor-list`);
        if (!container) return;
        
        const tasks = appData.laborTasks?.[type] || [];
        container.innerHTML = tasks.map((task, index) => `
            <div class="labor-task-item" data-type="${type}" data-index="${index}">
                <input type="text" class="labor-task-name" value="${escapeHtml(task.name || '')}" 
                    placeholder="${type === 'pre' ? 'Slicing, Modeling...' : 'Sanding, Painting...'}"
                    onchange="updateLaborTask('${type}', ${index}, 'name', this.value)">
                <input type="number" class="labor-task-hours" min="0" value="${task.hours || 0}" placeholder="0"
                    onchange="updateLaborTask('${type}', ${index}, 'hours', this.value)">
                <span class="time-separator">h</span>
                <input type="number" class="labor-task-minutes" min="0" max="59" value="${task.minutes || 0}" placeholder="0"
                    onchange="updateLaborTask('${type}', ${index}, 'minutes', this.value)">
                <span class="time-separator">m</span>
                <span class="rate-prefix">@</span>
                <input type="number" class="labor-rate-input" min="0" step="0.5" value="${task.rate || 20}" placeholder="$/h"
                    onchange="updateLaborTask('${type}', ${index}, 'rate', this.value)">
                <span class="time-separator">$/h</span>
                <button class="btn-delete-small" onclick="removeLaborTask('${type}', ${index})">×</button>
            </div>
        `).join('');
    });
}

function addLaborTask(type) {
    if (!appData.laborTasks) {
        appData.laborTasks = { pre: [], post: [] };
    }
    if (!appData.laborTasks[type]) {
        appData.laborTasks[type] = [];
    }
    
    appData.laborTasks[type].push({
        name: '',
        hours: 0,
        minutes: 0,
        rate: 20
    });
    
    renderLaborTasks();
    calculateQuote();
    autoSave();
}

function updateLaborTask(type, index, field, value) {
    if (!appData.laborTasks?.[type]?.[index]) return;
    
    if (field === 'hours' || field === 'minutes' || field === 'rate') {
        appData.laborTasks[type][index][field] = parseFloat(value) || 0;
    } else {
        appData.laborTasks[type][index][field] = value;
    }
    
    calculateQuote();
    autoSave();
}

function removeLaborTask(type, index) {
    if (!appData.laborTasks?.[type]) return;
    
    appData.laborTasks[type].splice(index, 1);
    renderLaborTasks();
    calculateQuote();
    autoSave();
}

function addQuoteMaterial() {
    const container = document.getElementById('materials-list');
    const div = document.createElement('div');
    div.className = 'crud-item';
    div.innerHTML = `
            <select class="material-select">
            <option value="">Select material...</option>
            </select>
        <input type="number" class="material-quantity" placeholder="0g" min="0" step="0.1">
        <button class="btn-delete" onclick="removeQuoteItem(this)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
        </button>
    `;
    container.appendChild(div);
    updateMaterialSelects();
    
    // Auto-select first material if available
    const newSelect = div.querySelector('.material-select');
    if (appData.filaments.length > 0 && newSelect) {
        newSelect.value = appData.filaments[0].id || appData.filaments[0].name;
    }
}

function addExtraCost() {
    const container = document.getElementById('extra-costs-list');
    const div = document.createElement('div');
    div.className = 'crud-item';
    div.innerHTML = `
        <input type="text" class="extra-cost-name" placeholder="Description...">
        <input type="number" class="extra-cost-value" placeholder="$0.00" min="0" step="0.01">
        <button class="btn-delete" onclick="removeQuoteItem(this)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
        </button>
    `;
    container.appendChild(div);
}

function removeQuoteItem(btn) {
    const item = btn.closest('.crud-item');
    item.classList.add('deleting');
    setTimeout(() => {
        item.remove();
        calculateQuote();
    }, 200);
}

function updateMaterialSelects() {
    const selects = document.querySelectorAll('.material-select');
    selects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Select material...</option>';
        appData.filaments.forEach(filament => {
            const option = document.createElement('option');
            // Use id if available, otherwise name
            option.value = filament.id || filament.name;
            option.textContent = `${filament.name} ($${(filament.pricePerKg || 0).toFixed(2)}/kg)`;
            select.appendChild(option);
        });
        if (currentValue) {
            // Try to restore selection
            select.value = currentValue;
            // If not found, try matching by name
            if (!select.value) {
                const match = appData.filaments.find(f => f.name === currentValue || f.id === currentValue);
                if (match) select.value = match.id || match.name;
            }
        }
    });
}

function updatePrinterSelect() {
    const select = document.getElementById('printer-select');
    const currentValue = select.value;
    select.innerHTML = '<option value="">Select a printer...</option>';
    appData.printers.forEach(printer => {
        const option = document.createElement('option');
        // Use id if available, otherwise name
        option.value = printer.id || printer.name;
        option.textContent = printer.name;
        select.appendChild(option);
    });
    if (currentValue) {
        // Try to restore selection
        select.value = currentValue;
        // If not found, try matching by name
        if (!select.value) {
            const match = appData.printers.find(p => p.name === currentValue || p.id === currentValue);
            if (match) select.value = match.id || match.name;
        }
    }
    
    // Auto-select first printer if only one exists and none selected
    if (!select.value && appData.printers.length === 1) {
        select.value = appData.printers[0].id || appData.printers[0].name;
    }
}

function handlePricingModeChange() {
    const mode = document.querySelector('input[name="pricing-mode"]:checked').value;
    
    document.getElementById('profit-percent-input').classList.toggle('hidden', mode !== 'profit-percent');
    document.getElementById('price-per-hour-input').classList.toggle('hidden', mode !== 'price-per-hour');
    document.getElementById('fixed-price-input').classList.toggle('hidden', mode !== 'fixed-price');
    
    calculateQuote();
}

function calculateQuote() {
    // Get print time
    const printDays = parseInt(document.getElementById('print-time-days').value) || 0;
    const printHours = parseInt(document.getElementById('print-time-hours').value) || 0;
    const printMinutes = parseInt(document.getElementById('print-time-minutes').value) || 0;
    const printTime = (printDays * 24) + printHours + (printMinutes / 60);
    
    // Get processing time and labor costs from saved tasks
    let processingTime = 0;
    let laborCost = 0;
    const laborTasksCalc = [];
    
    // Process all labor tasks from appData
    ['pre', 'post'].forEach(type => {
        const tasks = appData.laborTasks?.[type] || [];
        tasks.forEach(task => {
            const time = (task.hours || 0) + ((task.minutes || 0) / 60);
            const rate = task.rate || 0;
            const cost = time * rate;
            
            if (time > 0 || rate > 0) {
                processingTime += time;
                laborCost += cost;
                laborTasksCalc.push({ 
                    name: task.name || (type === 'pre' ? 'Pre-processing' : 'Post-processing'), 
                    time, 
                    rate, 
                    cost, 
                    type 
                });
            }
        });
    });
    
    const totalTime = printTime + processingTime;
    
    // Get printer (match by id OR name for backwards compatibility)
    const printerValue = document.getElementById('printer-select').value;
    const printer = appData.printers.find(p => p.id === printerValue || p.name === printerValue);

    // Calculate material costs
    let materialCost = 0;
    document.querySelectorAll('#materials-list .crud-item').forEach(item => {
        const selectEl = item.querySelector('.material-select');
        const filamentValue = selectEl?.value;
        const quantity = parseFloat(item.querySelector('.material-quantity')?.value) || 0;
        
        if (filamentValue && quantity > 0) {
            // Match by id OR name for backwards compatibility
            const filament = appData.filaments.find(f => f.id === filamentValue || f.name === filamentValue);
            if (filament) {
                materialCost += (quantity / 1000) * filament.pricePerKg;
            }
        }
    });
    
    // Calculate extra costs
    let extraCost = 0;
    document.querySelectorAll('#extra-costs-list .crud-item').forEach(item => {
        extraCost += parseFloat(item.querySelector('.extra-cost-value').value) || 0;
    });

    // Calculate electricity cost
    let electricityCost = 0;
    if (printer && printTime > 0) {
        electricityCost = printTime * (printer.kwPerHour || 0) * (printer.costPerKwh || 0);
    }
    
    // Calculate machine cost (depreciation + maintenance)
    let depreciationCost = 0;
    let maintenanceCost = 0;
    if (printer && printTime > 0) {
        // Depreciation
        if (printer.includeDepreciation !== false && printer.cost && printer.expectedLifetimeHours) {
            const depreciationPerHour = printer.cost / printer.expectedLifetimeHours;
            depreciationCost = depreciationPerHour * printTime;
        }
        
        // Scheduled maintenance tasks
        if (printer.maintenanceTasks && printer.maintenanceTasks.length > 0) {
            printer.maintenanceTasks.forEach(task => {
                if (task.cost > 0 && task.intervalHours > 0) {
                    const costPerHour = task.cost / task.intervalHours;
                    maintenanceCost += costPerHour * printTime;
                }
            });
        }
    }

    // Total machine cost (depreciation + maintenance)
    const totalMachineCost = depreciationCost + maintenanceCost;

    // Total cost
    const totalCost = materialCost + extraCost + electricityCost + totalMachineCost + laborCost;

    // Calculate final price based on mode
    const pricingMode = document.querySelector('input[name="pricing-mode"]:checked').value;
    let finalPrice = 0;
    let profitMargin = 0;
    let pricePerHour = 0;

    if (pricingMode === 'profit-percent') {
        const profitPercent = parseFloat(document.getElementById('profit-percent').value) || 0;
        finalPrice = totalCost * (1 + profitPercent / 100);
        profitMargin = profitPercent;
    } else if (pricingMode === 'price-per-hour') {
        pricePerHour = parseFloat(document.getElementById('price-per-hour').value) || 0;
        finalPrice = printTime * pricePerHour;
        profitMargin = totalCost > 0 ? ((finalPrice - totalCost) / totalCost) * 100 : 0;
    } else if (pricingMode === 'fixed-price') {
        finalPrice = parseFloat(document.getElementById('fixed-price').value) || 0;
        profitMargin = totalCost > 0 ? ((finalPrice - totalCost) / totalCost) * 100 : 0;
    }
    
    // Calculate derived values
    if (pricingMode !== 'price-per-hour') {
        pricePerHour = printTime > 0 ? finalPrice / printTime : 0;
    }

    // Update display
    document.getElementById('material-cost').textContent = formatCurrency(materialCost);
    document.getElementById('extra-cost').textContent = formatCurrency(extraCost);
    document.getElementById('electricity-cost').textContent = formatCurrency(electricityCost);
    document.getElementById('depreciation-cost').textContent = formatCurrency(totalMachineCost);
    document.getElementById('labor-cost').textContent = formatCurrency(laborCost);
    document.getElementById('total-cost').textContent = formatCurrency(totalCost);
    document.getElementById('total-cost-mini').textContent = formatCurrency(totalCost);
    document.getElementById('final-price').textContent = formatCurrency(finalPrice);
    document.getElementById('profit-margin-result').textContent = `${profitMargin.toFixed(1)}%`;
    document.getElementById('price-per-hour-result').textContent = formatCurrency(pricePerHour);
    document.getElementById('total-time-display').textContent = formatTime(totalTime);
    
    // Update math breakdowns
    updateMathBreakdowns(printer, printTime, laborTasksCalc, laborCost, materialCost, electricityCost, depreciationCost, maintenanceCost);
}

function updateMathBreakdowns(printer, printTime, laborTasks, laborCost, materialCost, electricityCost, depreciationCost, maintenanceCost) {
    // Material Math
    let materialMath = '';
    document.querySelectorAll('#materials-list .crud-item').forEach(item => {
        const selectEl = item.querySelector('.material-select');
        const filamentValue = selectEl?.value;
        const quantity = parseFloat(item.querySelector('.material-quantity')?.value) || 0;
        
        if (filamentValue && quantity > 0) {
            const filament = appData.filaments.find(f => f.id === filamentValue || f.name === filamentValue);
            if (filament) {
                const cost = (quantity / 1000) * filament.pricePerKg;
                materialMath += `
                    <div class="math-line">
                        <span class="math-label">${filament.name}</span>
                        <span class="math-value">${quantity}g × $${filament.pricePerKg}/kg</span>
                    </div>
                    <div class="math-line formula">
                        <span class="math-label">= ${quantity}g ÷ 1000 × $${filament.pricePerKg}</span>
                        <span class="math-value">${formatCurrency(cost)}</span>
                    </div>
                `;
            }
        }
    });
    document.getElementById('material-math').innerHTML = materialMath || '<div class="math-line"><span class="math-label">No materials added</span></div>';
    
    // Electricity Math
    let electricityMath = '';
    if (printer && printTime > 0) {
        const kwh = printer.kwPerHour || 0;
        const rate = printer.costPerKwh || 0;
        electricityMath = `
            <div class="math-line">
                <span class="math-label">Print Time</span>
                <span class="math-value">${printTime.toFixed(2)} hours</span>
            </div>
            <div class="math-line">
                <span class="math-label">Power</span>
                <span class="math-value">${kwh} kW</span>
            </div>
            <div class="math-line">
                <span class="math-label">Rate</span>
                <span class="math-value">$${rate}/kWh</span>
            </div>
            <div class="math-line formula">
                <span class="math-label">= ${printTime.toFixed(2)}h × ${kwh}kW × $${rate}</span>
                <span class="math-value">${formatCurrency(electricityCost)}</span>
            </div>
        `;
    } else {
        electricityMath = '<div class="math-line"><span class="math-label">Select a printer</span></div>';
    }
    document.getElementById('electricity-math').innerHTML = electricityMath;
    
    // Depreciation/Machine Math
    let depreciationMath = '';
    if (printer && printTime > 0) {
        const totalMachineCost = depreciationCost + maintenanceCost;
        
        if (printer.includeDepreciation !== false && printer.cost && printer.expectedLifetimeHours) {
            const lifetimeHours = printer.expectedLifetimeHours;
            const depPerHour = printer.cost / lifetimeHours;
            
            depreciationMath = `
                <div class="math-line">
                    <span class="math-label">Depreciation</span>
                    <span class="math-value">${formatCurrency(printer.cost)} ÷ ${lifetimeHours.toLocaleString()}h × ${printTime.toFixed(2)}h = ${formatCurrency(depreciationCost)}</span>
                </div>
            `;
        }
        
        // Add maintenance tasks breakdown
        if (printer.maintenanceTasks && printer.maintenanceTasks.length > 0) {
            printer.maintenanceTasks.forEach(task => {
                if (task.cost > 0 && task.intervalHours > 0) {
                    const costPerHour = task.cost / task.intervalHours;
                    const taskCost = costPerHour * printTime;
                    depreciationMath += `
                        <div class="math-line">
                            <span class="math-label">${escapeHtml(task.name) || 'Maintenance'}</span>
                            <span class="math-value">${formatCurrency(task.cost)} ÷ ${task.intervalHours}h × ${printTime.toFixed(2)}h = ${formatCurrency(taskCost)}</span>
                        </div>
                    `;
                }
            });
        }
        
        if (depreciationMath) {
            depreciationMath += `
                <div class="math-line formula">
                    <span class="math-label">Total Machine Cost</span>
                    <span class="math-value">${formatCurrency(totalMachineCost)}</span>
                </div>
            `;
        } else {
            depreciationMath = '<div class="math-line"><span class="math-label">Machine costs disabled</span></div>';
        }
    } else {
        depreciationMath = '<div class="math-line"><span class="math-label">Select a printer</span></div>';
    }
    document.getElementById('depreciation-math').innerHTML = depreciationMath;
    
    // Labor Math
    let laborMath = '';
    if (laborTasks.length > 0) {
        laborTasks.forEach(task => {
            const taskName = task.name || (task.type === 'pre' ? 'Pre-processing' : 'Post-processing');
            laborMath += `
                <div class="math-line">
                    <span class="math-label">${escapeHtml(taskName)}</span>
                    <span class="math-value">${task.time.toFixed(2)}h × ${formatCurrency(task.rate)} = ${formatCurrency(task.cost)}</span>
                </div>
            `;
        });
        laborMath += `
            <div class="math-line formula">
                <span class="math-label">Total Labor</span>
                <span class="math-value">${formatCurrency(laborCost)}</span>
            </div>
        `;
    } else {
        laborMath = '<div class="math-line"><span class="math-label">No labor tasks with time</span></div>';
    }
    document.getElementById('labor-math').innerHTML = laborMath;
}

function toggleMath(row) {
    row.classList.toggle('expanded');
    const mathEl = row.nextElementSibling;
    if (mathEl && mathEl.classList.contains('result-math')) {
        mathEl.classList.toggle('expanded');
    }
}

// Make toggleMath globally accessible
window.toggleMath = toggleMath;

// ============================================
// Printers Page (CRUD)
// ============================================

function initializePrintersPage() {
    document.getElementById('add-printer-btn').addEventListener('click', createPrinter);
}

function createPrinter() {
    const id = `printer-${printerIdCounter++}`;
    const newPrinter = {
        id,
        name: 'New Printer',
        kwPerHour: 0.2,
        costPerKwh: 0.12,
        cost: 0,
        expectedLifetimeHours: 5000,
        includeDepreciation: true,
        maintenanceTasks: []  // Array of { name, cost, intervalHours }
    };
    
    appData.printers.push(newPrinter);
    renderPrinters();
    updatePrinterSelect();
    autoSave();
    
    // Focus on the name input of the new printer
    setTimeout(() => {
        const cards = document.querySelectorAll('.item-card');
        const lastCard = cards[cards.length - 1];
        const nameInput = lastCard.querySelector('.printer-name');
        nameInput.focus();
        nameInput.select();
    }, 100);
}

function updatePrinter(id, field, value) {
    const printer = appData.printers.find(p => p.id === id);
    if (printer) {
        if (['kwPerHour', 'costPerKwh', 'cost', 'expectedLifetimeHours', 'repairCostPerHour', 'maintenanceCost', 'maintenanceInterval'].includes(field)) {
            printer[field] = parseFloat(value) || 0;
        } else if (field === 'includeDepreciation') {
            printer[field] = value;
            // Re-render to update disabled states
            renderPrinters();
        } else {
            printer[field] = value;
        }
        updatePrinterSelect();
        calculateQuote();
        autoSave();
    }
}

function deletePrinter(id) {
    if (!confirm('Delete this printer?')) return;
    
    const card = document.querySelector(`.item-card[data-id="${id}"]`);
    if (card) {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
    }
    
    setTimeout(() => {
        appData.printers = appData.printers.filter(p => p.id !== id);
        renderPrinters();
        updatePrinterSelect();
        calculateQuote();
        autoSave();
    }, 200);
}

function renderPrinters() {
    const container = document.getElementById('printers-list');
    
    if (appData.printers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
                    <rect x="6" y="14" width="12" height="8"/>
                </svg>
                <p>No printers added yet</p>
                <button class="btn-primary" onclick="createPrinter()">Add Your First Printer</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = appData.printers.map(printer => `
        <div class="item-card" data-id="${printer.id}">
            <div class="item-card-header">
                <div class="item-card-title">
                    <input type="text" class="printer-name" value="${escapeHtml(printer.name)}"
                        onchange="updatePrinter('${printer.id}', 'name', this.value)"
                        oninput="updatePrinter('${printer.id}', 'name', this.value)">
                </div>
                <button class="btn-delete" onclick="deletePrinter('${printer.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                </button>
            </div>
            <div class="item-card-section">
                <label class="section-title">Electricity</label>
                <div class="item-card-fields">
                    <div class="item-field">
                        <label>Power (kW)</label>
                        <input type="number" value="${printer.kwPerHour || 0}" step="0.01" min="0"
                            onchange="updatePrinter('${printer.id}', 'kwPerHour', this.value)">
                    </div>
                    <div class="item-field">
                        <label>$/kWh</label>
                        <input type="number" value="${printer.costPerKwh || 0}" step="0.01" min="0"
                            onchange="updatePrinter('${printer.id}', 'costPerKwh', this.value)">
                    </div>
                </div>
            </div>
            <div class="item-card-section">
                <div class="section-header">
                    <label class="section-title">Machine Costs</label>
                    <label class="toggle-switch">
                        <input type="checkbox" ${printer.includeDepreciation !== false ? 'checked' : ''}
                            onchange="updatePrinter('${printer.id}', 'includeDepreciation', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div class="item-card-fields ${printer.includeDepreciation === false ? 'disabled' : ''}">
                    <div class="item-field">
                        <label>Cost ($)</label>
                        <input type="number" value="${printer.cost || ''}" step="1" min="0" placeholder="3700"
                            onchange="updatePrinter('${printer.id}', 'cost', this.value)"
                            ${printer.includeDepreciation === false ? 'disabled' : ''}>
                    </div>
                    <div class="item-field">
                        <label>Lifetime (hrs)</label>
                        <input type="number" value="${printer.expectedLifetimeHours || ''}" step="100" min="0" placeholder="5000"
                            onchange="updatePrinter('${printer.id}', 'expectedLifetimeHours', this.value)"
                            ${printer.includeDepreciation === false ? 'disabled' : ''}>
                    </div>
                </div>
            </div>
            <div class="item-card-section">
                <label class="section-title">Scheduled Maintenance</label>
                <p class="section-description">Add recurring maintenance costs (grease, belts, etc.)</p>
                <div class="maintenance-list" id="maintenance-${printer.id}">
                    ${renderMaintenanceTasks(printer)}
                </div>
                <button class="btn-add" onclick="addMaintenanceTask('${printer.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 5v14M5 12h14"/>
                    </svg>
                    Add Maintenance Task
                </button>
            </div>
        </div>
    `).join('');
}

// ============================================
// Printer Maintenance Tasks
// ============================================

function renderMaintenanceTasks(printer) {
    const tasks = printer.maintenanceTasks || [];
    if (tasks.length === 0) {
        return '<p class="empty-hint">No maintenance tasks yet</p>';
    }
    
    return tasks.map((task, index) => `
        <div class="maintenance-item">
            <input type="text" class="maintenance-name" value="${escapeHtml(task.name)}" placeholder="Task name"
                onchange="updateMaintenanceTask('${printer.id}', ${index}, 'name', this.value)">
            <input type="number" class="maintenance-cost" value="${task.cost || ''}" placeholder="$" min="0" step="0.01"
                onchange="updateMaintenanceTask('${printer.id}', ${index}, 'cost', this.value)">
            <span class="maintenance-separator">every</span>
            <input type="number" class="maintenance-interval" value="${task.intervalHours || ''}" placeholder="hrs" min="1" step="1"
                onchange="updateMaintenanceTask('${printer.id}', ${index}, 'intervalHours', this.value)">
            <span class="maintenance-unit">h</span>
            <button class="btn-delete-small" onclick="removeMaintenanceTask('${printer.id}', ${index})">×</button>
        </div>
    `).join('');
}

function addMaintenanceTask(printerId) {
    const printer = appData.printers.find(p => p.id === printerId);
    if (!printer) return;
    
    if (!printer.maintenanceTasks) {
        printer.maintenanceTasks = [];
    }
    
    printer.maintenanceTasks.push({
        name: '',
        cost: 0,
        intervalHours: 1000
    });
    
    renderPrinters();
    calculateQuote();
    autoSave();
}

function updateMaintenanceTask(printerId, taskIndex, field, value) {
    const printer = appData.printers.find(p => p.id === printerId);
    if (!printer || !printer.maintenanceTasks || !printer.maintenanceTasks[taskIndex]) return;
    
    if (field === 'cost' || field === 'intervalHours') {
        printer.maintenanceTasks[taskIndex][field] = parseFloat(value) || 0;
    } else {
        printer.maintenanceTasks[taskIndex][field] = value;
    }
    
    calculateQuote();
    autoSave();
}

function removeMaintenanceTask(printerId, taskIndex) {
    const printer = appData.printers.find(p => p.id === printerId);
    if (!printer || !printer.maintenanceTasks) return;
    
    printer.maintenanceTasks.splice(taskIndex, 1);
    renderPrinters();
    calculateQuote();
    autoSave();
}

// ============================================
// Materials Page (CRUD)
// ============================================

function initializeMaterialsPage() {
    document.getElementById('add-filament-btn').addEventListener('click', createFilament);
}

function createFilament() {
    const id = `filament-${filamentIdCounter++}`;
    const newFilament = {
        id,
        name: 'New Material',
        pricePerKg: 20.00
    };
    
    appData.filaments.push(newFilament);
    renderFilaments();
    updateMaterialSelects();
    autoSave();
    
    // Focus on the name input
    setTimeout(() => {
        const cards = document.querySelectorAll('#filaments-list .item-card');
        const lastCard = cards[cards.length - 1];
        const nameInput = lastCard.querySelector('.filament-name');
        nameInput.focus();
        nameInput.select();
    }, 100);
}

function updateFilament(id, field, value) {
    const filament = appData.filaments.find(f => f.id === id);
    if (filament) {
        if (field === 'pricePerKg') {
            filament[field] = parseFloat(value) || 0;
        } else {
            filament[field] = value;
        }
        updateMaterialSelects();
        calculateQuote();
        autoSave();
    }
}

function deleteFilament(id) {
    if (!confirm('Delete this material?')) return;
    
    const card = document.querySelector(`.item-card[data-id="${id}"]`);
    if (card) {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9)';
    }
    
    setTimeout(() => {
        appData.filaments = appData.filaments.filter(f => f.id !== id);
        renderFilaments();
        updateMaterialSelects();
        calculateQuote();
        autoSave();
    }, 200);
}

function renderFilaments() {
    const container = document.getElementById('filaments-list');
    
    if (appData.filaments.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <circle cx="12" cy="12" r="3"/>
                </svg>
                <p>No materials added yet</p>
                <button class="btn-primary" onclick="createFilament()">Add Your First Material</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = appData.filaments.map(filament => `
        <div class="item-card" data-id="${filament.id}">
            <div class="item-card-header">
                <div class="item-card-title">
                    <input type="text" class="filament-name" value="${escapeHtml(filament.name)}"
                        onchange="updateFilament('${filament.id}', 'name', this.value)"
                        oninput="updateFilament('${filament.id}', 'name', this.value)">
                </div>
                <button class="btn-delete" onclick="deleteFilament('${filament.id}')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                </button>
            </div>
            <div class="item-card-fields">
                <div class="item-field full-width">
                <label>Price per kg ($)</label>
                    <input type="number" value="${filament.pricePerKg}" step="0.01" min="0"
                        onchange="updateFilament('${filament.id}', 'pricePerKg', this.value)">
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// Utility Functions
// ============================================

function formatCurrency(value) {
    return '$' + value.toFixed(2);
}

function formatTime(hours) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function updateIdCounters() {
    // Ensure all printers have IDs and maintenanceTasks array
    appData.printers.forEach((printer, index) => {
        if (!printer.id) {
            printer.id = `printer-${index + 1}`;
        }
        if (!printer.maintenanceTasks) {
            printer.maintenanceTasks = [];
        }
    });
    
    // Ensure all filaments have IDs
    appData.filaments.forEach((filament, index) => {
        if (!filament.id) {
            filament.id = `filament-${index + 1}`;
        }
    });
    
    // Ensure laborTasks exists
    if (!appData.laborTasks) {
        appData.laborTasks = { pre: [], post: [] };
    }
    if (!appData.laborTasks.pre) appData.laborTasks.pre = [];
    if (!appData.laborTasks.post) appData.laborTasks.post = [];
    
    // Update printer ID counter
    const maxPrinterId = Math.max(0, ...appData.printers.map(p => {
        const match = p.id?.match(/printer-(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }));
    printerIdCounter = maxPrinterId + 1;
    
    // Update filament ID counter
    const maxFilamentId = Math.max(0, ...appData.filaments.map(f => {
        const match = f.id?.match(/filament-(\d+)/);
        return match ? parseInt(match[1]) : 0;
    }));
    filamentIdCounter = maxFilamentId + 1;
}

function renderAll() {
    renderPrinters();
    renderFilaments();
    renderLaborTasks();
    updatePrinterSelect();
    updateMaterialSelects();
    // Delay calculation to ensure DOM is updated
    setTimeout(calculateQuote, 50);
}

function loadDefaultData() {
    appData = {
        printers: [
            {
                id: 'printer-1',
                name: 'Ender 3 Pro',
                kwPerHour: 0.22,
                costPerKwh: 0.12,
                cost: 200,
                expectedLifetimeHours: 5000,
                includeDepreciation: true,
                maintenanceTasks: []
            }
        ],
        filaments: [
            { id: 'filament-1', name: 'PLA', pricePerKg: 20.00 },
            { id: 'filament-2', name: 'ABS', pricePerKg: 25.00 },
            { id: 'filament-3', name: 'PETG', pricePerKg: 28.00 }
        ],
        laborTasks: {
            pre: [],
            post: []
        }
    };
    
    printerIdCounter = 2;
    filamentIdCounter = 4;
    
    renderAll();
    saveToLocalStorage();
}

