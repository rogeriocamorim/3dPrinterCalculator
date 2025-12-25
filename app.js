// ============================================
// 3D Print Quote Generator - v2.0
// Database-like file storage with auto-save
// ============================================

// Application State
let appData = {
    currency: "USD",  // Global currency setting
    printers: [],
    filaments: [],
    laborTasks: {
        pre: [],   // Array of { name, hours, minutes, rate }
        post: []
    }
};

// ============================================
// Currency Definitions
// ============================================

const CURRENCIES = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
    { code: "BRL", symbol: "R$", name: "Brazilian Real" },
    { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "KRW", symbol: "₩", name: "South Korean Won" },
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
    { code: "ZAR", symbol: "R", name: "South African Rand" },
    { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
    { code: "ILS", symbol: "₪", name: "Israeli Shekel" },
    { code: "PLN", symbol: "zł", name: "Polish Zloty" },
    { code: "SEK", symbol: "kr", name: "Swedish Krona" },
    { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
    { code: "CLP", symbol: "CLP$", name: "Chilean Peso" },
    { code: "COP", symbol: "COP$", name: "Colombian Peso" },
    { code: "ARS", symbol: "AR$", name: "Argentine Peso" }
];

// Database (File) Connection State
let fileHandle = null;
let isConnected = false;
let autoSaveTimeout = null;

// Current .3mf file reference for quote embedding
let current3mfFile = null;
let current3mfFileName = null;

// ID Counters
let printerIdCounter = 1;
let filamentIdCounter = 1;

// IndexedDB for storing file handle (Chrome/Edge only)
const DB_NAME = '3dPrintQuoteDB';
const STORE_NAME = 'fileHandles';

// ============================================
// Printer Presets Database
// ============================================

const PRINTER_PRESETS = [
    // Bambu Lab (Updated 2025)
    { name: "H2D", brand: "Bambu Lab", power: 0.45, lifetime: 10000, cost: 1999 },
    { name: "X1 Carbon Combo", brand: "Bambu Lab", power: 0.35, lifetime: 8000, cost: 1449 },
    { name: "X1E", brand: "Bambu Lab", power: 0.38, lifetime: 10000, cost: 1699 },
    { name: "P1S Combo", brand: "Bambu Lab", power: 0.30, lifetime: 7000, cost: 949 },
    { name: "P1P", brand: "Bambu Lab", power: 0.28, lifetime: 7000, cost: 599 },
    { name: "A1", brand: "Bambu Lab", power: 0.22, lifetime: 5000, cost: 399 },
    { name: "A1 Mini", brand: "Bambu Lab", power: 0.18, lifetime: 5000, cost: 299 },
    // Creality (Updated 2025)
    { name: "K2 Plus Combo", brand: "Creality", power: 0.45, lifetime: 8000, cost: 1299 },
    { name: "K1 Max", brand: "Creality", power: 0.38, lifetime: 7000, cost: 699 },
    { name: "K1C", brand: "Creality", power: 0.35, lifetime: 7000, cost: 499 },
    { name: "K1", brand: "Creality", power: 0.35, lifetime: 7000, cost: 449 },
    { name: "Ender 3 V3", brand: "Creality", power: 0.25, lifetime: 5000, cost: 199 },
    { name: "Ender 3 V3 KE", brand: "Creality", power: 0.28, lifetime: 5000, cost: 249 },
    { name: "Ender 3 V3 SE", brand: "Creality", power: 0.22, lifetime: 5000, cost: 179 },
    { name: "Ender 3 Pro / V2", brand: "Creality", power: 0.22, lifetime: 5000, cost: 200 },
    { name: "CR-10 / CR-10S", brand: "Creality", power: 0.28, lifetime: 6000, cost: 450 },
    // Prusa (Updated 2025)
    { name: "Core One", brand: "Prusa", power: 0.30, lifetime: 8000, cost: 1199 },
    { name: "MK4S Assembled", brand: "Prusa", power: 0.15, lifetime: 8000, cost: 1099 },
    { name: "MK4S Kit", brand: "Prusa", power: 0.15, lifetime: 8000, cost: 799 },
    { name: "MK3S+", brand: "Prusa", power: 0.12, lifetime: 8000, cost: 800 },
    { name: "Mini+", brand: "Prusa", power: 0.08, lifetime: 6000, cost: 430 },
    { name: "XL (Single)", brand: "Prusa", power: 0.35, lifetime: 10000, cost: 1999 },
    { name: "XL (5 Toolheads)", brand: "Prusa", power: 0.50, lifetime: 10000, cost: 3499 },
    // Qidi (New Brand 2025)
    { name: "Q1 Pro", brand: "Qidi", power: 0.35, lifetime: 6000, cost: 469 },
    { name: "X-Max 3", brand: "Qidi", power: 0.40, lifetime: 7000, cost: 799 },
    { name: "X-Plus 3", brand: "Qidi", power: 0.38, lifetime: 7000, cost: 599 },
    // Anycubic (Updated 2025)
    { name: "Kobra 3 Combo", brand: "Anycubic", power: 0.35, lifetime: 6000, cost: 599 },
    { name: "Kobra 2 Pro", brand: "Anycubic", power: 0.28, lifetime: 5000, cost: 299 },
    { name: "Kobra 2", brand: "Anycubic", power: 0.25, lifetime: 5000, cost: 270 },
    // Elegoo (Updated 2025)
    { name: "Neptune 4 Max", brand: "Elegoo", power: 0.32, lifetime: 6000, cost: 469 },
    { name: "Neptune 4 Pro", brand: "Elegoo", power: 0.28, lifetime: 6000, cost: 259 },
    { name: "Neptune 4 Plus", brand: "Elegoo", power: 0.30, lifetime: 6000, cost: 349 },
    { name: "Neptune 3 Pro", brand: "Elegoo", power: 0.24, lifetime: 5000, cost: 260 },
    // Flashforge (Updated 2025)
    { name: "Adventurer 5M Pro", brand: "Flashforge", power: 0.32, lifetime: 6000, cost: 499 },
    { name: "Adventurer 5M", brand: "Flashforge", power: 0.28, lifetime: 6000, cost: 379 },
    // Ankermake (New Brand)
    { name: "M5C", brand: "Ankermake", power: 0.25, lifetime: 5000, cost: 299 },
    { name: "M5", brand: "Ankermake", power: 0.28, lifetime: 5000, cost: 499 },
    // Sovol (Updated 2025)
    { name: "SV08", brand: "Sovol", power: 0.35, lifetime: 6000, cost: 499 },
    { name: "SV07 Plus", brand: "Sovol", power: 0.32, lifetime: 5000, cost: 449 },
    { name: "SV06", brand: "Sovol", power: 0.24, lifetime: 5000, cost: 260 },
    // Artillery
    { name: "Sidewinder X2", brand: "Artillery", power: 0.30, lifetime: 5000, cost: 400 },
    { name: "Genius Pro", brand: "Artillery", power: 0.24, lifetime: 5000, cost: 280 },
    // Voron (DIY)
    { name: "Voron 2.4", brand: "Voron (DIY)", power: 0.35, lifetime: 10000, cost: 1500 },
    { name: "Voron Trident", brand: "Voron (DIY)", power: 0.32, lifetime: 10000, cost: 1200 },
    // Ultimaker (Updated 2025)
    { name: "S6 Secure", brand: "Ultimaker", power: 0.35, lifetime: 10000, cost: 4500 },
    { name: "S8 Secure", brand: "Ultimaker", power: 0.40, lifetime: 10000, cost: 6000 },
    { name: "S5 Pro Bundle", brand: "Ultimaker", power: 0.35, lifetime: 10000, cost: 7500 },
    // Resin Printers (Updated 2025)
    { name: "Saturn 4 Ultra", brand: "Elegoo (Resin)", power: 0.07, lifetime: 3000, cost: 549 },
    { name: "Saturn 3", brand: "Elegoo (Resin)", power: 0.06, lifetime: 3000, cost: 450 },
    { name: "Mars 5 Ultra", brand: "Elegoo (Resin)", power: 0.05, lifetime: 3000, cost: 289 },
    { name: "Mars 3 Pro", brand: "Elegoo (Resin)", power: 0.05, lifetime: 3000, cost: 250 },
    { name: "Photon Mono M7 Pro", brand: "Anycubic (Resin)", power: 0.06, lifetime: 3000, cost: 449 },
    { name: "Photon Mono M5s", brand: "Anycubic (Resin)", power: 0.05, lifetime: 3000, cost: 299 },
    { name: "Sonic Mini 8K", brand: "Phrozen (Resin)", power: 0.06, lifetime: 3000, cost: 350 },
    // Custom
    { name: "Custom / Other", brand: "Other", power: null, lifetime: null, cost: null }
];

// ============================================
// Regional Electricity Rates
// ============================================

const ELECTRICITY_RATES = [
    // North America (Updated December 2025)
    { region: "USA (Average)", rate: 0.18, currency: "USD" },
    { region: "USA - California", rate: 0.32, currency: "USD" },
    { region: "USA - Texas", rate: 0.14, currency: "USD" },
    { region: "USA - New York", rate: 0.22, currency: "USD" },
    { region: "USA - Florida", rate: 0.15, currency: "USD" },
    { region: "USA - Hawaii", rate: 0.42, currency: "USD" },
    { region: "USA - Idaho", rate: 0.12, currency: "USD" },
    { region: "USA - Washington", rate: 0.11, currency: "USD" },
    { region: "Canada (Average)", rate: 0.12, currency: "CAD" },
    { region: "Canada - Ontario", rate: 0.15, currency: "CAD" },
    { region: "Canada - Quebec", rate: 0.08, currency: "CAD" },
    { region: "Canada - British Columbia", rate: 0.13, currency: "CAD" },
    { region: "Canada - Alberta", rate: 0.16, currency: "CAD" },
    { region: "Mexico", rate: 0.09, currency: "MXN" },
    // Europe (Updated December 2025)
    { region: "UK", rate: 0.30, currency: "GBP" },
    { region: "Germany", rate: 0.35, currency: "EUR" },
    { region: "France", rate: 0.20, currency: "EUR" },
    { region: "Spain", rate: 0.24, currency: "EUR" },
    { region: "Italy", rate: 0.28, currency: "EUR" },
    { region: "Netherlands", rate: 0.29, currency: "EUR" },
    { region: "Belgium", rate: 0.30, currency: "EUR" },
    { region: "Portugal", rate: 0.22, currency: "EUR" },
    { region: "Poland", rate: 0.18, currency: "PLN" },
    { region: "Sweden", rate: 0.20, currency: "SEK" },
    { region: "Norway", rate: 0.12, currency: "NOK" },
    { region: "Switzerland", rate: 0.22, currency: "EUR" },
    { region: "Austria", rate: 0.26, currency: "EUR" },
    { region: "Ireland", rate: 0.32, currency: "EUR" },
    // Asia Pacific (Updated December 2025)
    { region: "Australia", rate: 0.28, currency: "AUD" },
    { region: "New Zealand", rate: 0.24, currency: "NZD" },
    { region: "Japan", rate: 0.27, currency: "JPY" },
    { region: "South Korea", rate: 0.12, currency: "KRW" },
    { region: "Singapore", rate: 0.20, currency: "SGD" },
    { region: "India", rate: 0.09, currency: "INR" },
    { region: "China", rate: 0.08, currency: "USD" },
    { region: "Hong Kong", rate: 0.15, currency: "USD" },
    { region: "Taiwan", rate: 0.10, currency: "USD" },
    // South America (Updated December 2025)
    { region: "Brazil", rate: 0.16, currency: "BRL" },
    { region: "Argentina", rate: 0.06, currency: "ARS" },
    { region: "Chile", rate: 0.16, currency: "CLP" },
    { region: "Colombia", rate: 0.14, currency: "COP" },
    // Middle East & Africa
    { region: "South Africa", rate: 0.14, currency: "ZAR" },
    { region: "UAE", rate: 0.09, currency: "AED" },
    { region: "Israel", rate: 0.17, currency: "ILS" },
    { region: "Saudi Arabia", rate: 0.05, currency: "USD" },
    // Custom
    { region: "Custom / Other", rate: null, currency: null }
];

// ============================================
// Initialization
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Check browser compatibility first
    checkBrowserCompatibility();
    
    // Initialize landing page
    initializeLandingPage();
    
    // Check if user has already used the app (skip landing and wizard)
    const hasUsedBefore = localStorage.getItem('3dPrintQuoteHasUsedApp');
    if (hasUsedBefore) {
        // Skip landing and wizard, go directly to app
        hideLandingPage();
        showMainApp();
        initializeApp();
        await tryAutoConnect();
    }
});

function initializeLandingPage() {
    const getStartedBtn = document.getElementById('get-started-btn');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', async () => {
            // Hide landing and show onboarding wizard
            hideLandingPage();
            showOnboardingWizard();
        });
    }
}

// ============================================
// Onboarding Wizard
// ============================================

let currentWizardStep = 1;

function showOnboardingWizard() {
    const wizard = document.getElementById('onboarding-wizard');
    if (wizard) {
        wizard.style.display = 'flex';
        initializeWizardHandlers();
        showWizardStep(1);
    }
}

function hideOnboardingWizard() {
    const wizard = document.getElementById('onboarding-wizard');
    if (wizard) {
        wizard.style.opacity = '0';
        wizard.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            wizard.style.display = 'none';
        }, 300);
    }
}

function initializeWizardHandlers() {
    // Populate preset dropdowns
    populateWizardPresets();
    
    // Step 1: Storage
    document.getElementById('wizard-create-file')?.addEventListener('click', async () => {
        await wizardCreateFile();
    });
    
    document.getElementById('wizard-open-file')?.addEventListener('click', async () => {
        await wizardOpenFile();
    });
    
    document.getElementById('wizard-skip-storage')?.addEventListener('click', () => {
        // Skip storage, use localStorage only
        wizardSkipStorage();
    });
    
    // Step 2: Currency
    document.getElementById('wizard-currency')?.addEventListener('change', (e) => {
        handleWizardCurrencyChange(e.target.value);
    });
    
    // Step 2: Printer Preset
    document.getElementById('wizard-printer-preset')?.addEventListener('change', (e) => {
        handleWizardPrinterPreset(e.target.value);
    });
    
    // Step 2: Region Preset
    document.getElementById('wizard-region-preset')?.addEventListener('change', (e) => {
        handleWizardRegionPreset(e.target.value);
    });
    
    // Step 2: Printer
    document.getElementById('wizard-add-printer')?.addEventListener('click', () => {
        wizardAddPrinter();
    });
    
    document.getElementById('wizard-skip-printer')?.addEventListener('click', () => {
        showWizardStep(3);
    });
    
    // Step 3: Material
    document.getElementById('wizard-finish')?.addEventListener('click', () => {
        wizardAddMaterial();
        completeOnboarding();
    });
    
    document.getElementById('wizard-skip-material')?.addEventListener('click', () => {
        completeOnboarding();
    });
    
    // Custom material name toggle
    document.getElementById('wizard-material-type')?.addEventListener('change', (e) => {
        const customRow = document.getElementById('wizard-custom-material-row');
        if (customRow) {
            customRow.style.display = e.target.value === 'Other' ? 'block' : 'none';
        }
    });
}

// ============================================
// Preset Helper Functions
// ============================================

function populateWizardPresets() {
    // Populate currency dropdown
    const currencyEl = document.getElementById('wizard-currency');
    if (currencyEl) {
        currencyEl.innerHTML = generateCurrencyOptions();
        currencyEl.value = appData.currency || 'USD';
    }
    
    // Populate printer preset dropdown
    const printerPresetEl = document.getElementById('wizard-printer-preset');
    if (printerPresetEl) {
        printerPresetEl.innerHTML = '<option value="">-- Choose a printer model --</option>' + generatePrinterPresetOptions();
    }
    
    // Populate region preset dropdown
    const regionPresetEl = document.getElementById('wizard-region-preset');
    if (regionPresetEl) {
        regionPresetEl.innerHTML = '<option value="">-- Select your region --</option>' + generateRegionPresetOptions();
    }
    
    // Update currency labels
    updateCurrencyLabels();
}

function generateCurrencyOptions() {
    let html = '';
    CURRENCIES.forEach(currency => {
        html += `<option value="${currency.code}">${currency.symbol} - ${currency.name} (${currency.code})</option>`;
    });
    return html;
}

function generatePrinterPresetOptions() {
    // Group by brand
    const brands = {};
    PRINTER_PRESETS.forEach(preset => {
        if (!brands[preset.brand]) {
            brands[preset.brand] = [];
        }
        brands[preset.brand].push(preset);
    });
    
    let html = '';
    Object.keys(brands).forEach(brand => {
        html += `<optgroup label="${brand}">`;
        brands[brand].forEach(preset => {
            const powerInfo = preset.power ? ` (${preset.power} kW)` : '';
            html += `<option value="${preset.name}">${preset.name}${powerInfo}</option>`;
        });
        html += '</optgroup>';
    });
    
    return html;
}

function generateRegionPresetOptions() {
    let html = '';
    ELECTRICITY_RATES.forEach(rate => {
        if (rate.rate) {
            const currency = CURRENCIES.find(c => c.code === rate.currency) || { symbol: '$' };
            html += `<option value="${rate.region}">${rate.region} (${currency.symbol}${rate.rate}/kWh)</option>`;
        } else {
            html += `<option value="${rate.region}">${rate.region}</option>`;
        }
    });
    return html;
}

function handleWizardPrinterPreset(presetName) {
    const preset = PRINTER_PRESETS.find(p => p.name === presetName);
    if (!preset || !preset.power) return;
    
    // Fill in the form fields
    document.getElementById('wizard-printer-name').value = preset.name;
    document.getElementById('wizard-printer-power').value = preset.power;
    if (preset.cost) {
        document.getElementById('wizard-printer-cost').value = preset.cost;
    }
    if (preset.lifetime) {
        document.getElementById('wizard-printer-lifetime').value = preset.lifetime;
    }
}

function handleWizardRegionPreset(regionName) {
    const rate = ELECTRICITY_RATES.find(r => r.region === regionName);
    if (!rate || !rate.rate) return;
    
    document.getElementById('wizard-printer-electricity').value = rate.rate;
    
    // Auto-update currency based on region
    if (rate.currency) {
        const currencyEl = document.getElementById('wizard-currency');
        if (currencyEl) {
            currencyEl.value = rate.currency;
            handleWizardCurrencyChange(rate.currency);
        }
    }
}

function handleWizardCurrencyChange(currencyCode) {
    appData.currency = currencyCode;
    updateCurrencyLabels();
    saveToLocalStorage();
    if (isConnected) autoSave();
}

function updateCurrencyLabels() {
    const symbol = getCurrencySymbol();
    
    // Update all currency labels in the wizard and app
    document.querySelectorAll('.currency-label').forEach(el => {
        el.textContent = symbol;
    });
    
    // Update the region dropdown display format
    const regionPresetEl = document.getElementById('wizard-region-preset');
    if (regionPresetEl) {
        regionPresetEl.innerHTML = '<option value="">-- Select your region --</option>' + generateRegionPresetOptions();
    }
}

function applyPrinterPreset(printerId, presetName) {
    const preset = PRINTER_PRESETS.find(p => p.name === presetName);
    if (!preset || !preset.power) return;
    
    const printer = appData.printers.find(p => p.id === printerId);
    if (!printer) return;
    
    // Update printer with preset values
    printer.name = preset.name;
    printer.kwPerHour = preset.power;
    if (preset.cost) printer.cost = preset.cost;
    if (preset.lifetime) printer.expectedLifetimeHours = preset.lifetime;
    
    // Re-render and save
    renderPrinters();
    updatePrinterSelect();
    calculateQuote();
    autoSave();
}

function applyRegionPreset(printerId, regionName) {
    const rate = ELECTRICITY_RATES.find(r => r.region === regionName);
    if (!rate || !rate.rate) return;
    
    const printer = appData.printers.find(p => p.id === printerId);
    if (!printer) return;
    
    printer.costPerKwh = rate.rate;
    
    // Re-render and save
    renderPrinters();
    calculateQuote();
    autoSave();
}

function showWizardStep(step) {
    currentWizardStep = step;
    
    // Update step visibility
    document.querySelectorAll('.wizard-step').forEach(el => {
        el.classList.remove('active');
    });
    const stepEl = document.getElementById(`wizard-step-${step}`);
    if (stepEl) {
        stepEl.classList.add('active');
    }
    
    // Update progress indicator
    document.querySelectorAll('.progress-step').forEach(el => {
        const stepNum = parseInt(el.dataset.step);
        el.classList.remove('active', 'completed');
        if (stepNum < step) {
            el.classList.add('completed');
        } else if (stepNum === step) {
            el.classList.add('active');
        }
    });
    
    // Update progress lines
    document.querySelectorAll('.progress-line').forEach((line, index) => {
        if (index < step - 1) {
            line.classList.add('completed');
        } else {
            line.classList.remove('completed');
        }
    });
}

async function wizardCreateFile() {
    if ('showSaveFilePicker' in window) {
        try {
            fileHandle = await window.showSaveFilePicker({
                suggestedName: '3d-print-database.json',
                types: [{
                    description: 'JSON Database',
                    accept: { 'application/json': ['.json'] }
                }]
            });
            
            // Initialize with empty data
            appData = {
                printers: [],
                filaments: [],
                laborTasks: { pre: [], post: [] }
            };
            
            await saveToFile();
            isConnected = true;
            await storeFileHandle(fileHandle);
            
            // Move to next step
            showWizardStep(2);
            
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error creating file:', error);
                alert('Error creating file. Please try again.');
            }
        }
    } else {
        // Fallback for Firefox
        wizardSkipStorage();
    }
}

async function wizardOpenFile() {
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
            
            // Load existing data
            const file = await fileHandle.getFile();
            const text = await file.text();
            appData = JSON.parse(text);
            updateIdCounters();
            
            isConnected = true;
            await storeFileHandle(handle);
            
            // If file has printers/materials, skip those steps
            if (appData.printers?.length > 0 && appData.filaments?.length > 0) {
                completeOnboarding();
            } else if (appData.printers?.length > 0) {
                showWizardStep(3);
            } else {
                showWizardStep(2);
            }
            
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error opening file:', error);
                alert('Error opening file. Please try again.');
            }
        }
    } else {
        // Fallback for Firefox - use file input
        document.getElementById('file-input')?.click();
    }
}

function wizardSkipStorage() {
    // Use localStorage only
    isConnected = false;
    appData = {
        printers: [],
        filaments: [],
        laborTasks: { pre: [], post: [] }
    };
    saveToLocalStorage();
    showWizardStep(2);
}

function wizardAddPrinter() {
    const name = document.getElementById('wizard-printer-name')?.value || 'My 3D Printer';
    const power = parseFloat(document.getElementById('wizard-printer-power')?.value) || 0.22;
    const electricity = parseFloat(document.getElementById('wizard-printer-electricity')?.value) || 0.12;
    const cost = parseFloat(document.getElementById('wizard-printer-cost')?.value) || 0;
    const lifetime = parseFloat(document.getElementById('wizard-printer-lifetime')?.value) || 5000;
    
    const id = `printer-${printerIdCounter++}`;
    const newPrinter = {
        id,
        name,
        kwPerHour: power,
        costPerKwh: electricity,
        cost,
        expectedLifetimeHours: lifetime,
        includeDepreciation: true,
        maintenanceTasks: []
    };
    
    appData.printers.push(newPrinter);
    saveToLocalStorage();
    if (isConnected) saveToFile();
    
    showWizardStep(3);
}

function wizardAddMaterial() {
    let name = document.getElementById('wizard-material-type')?.value || 'PLA';
    if (name === 'Other') {
        name = document.getElementById('wizard-material-custom')?.value || 'Custom Material';
    }
    const price = parseFloat(document.getElementById('wizard-material-price')?.value) || 20;
    
    const id = `filament-${filamentIdCounter++}`;
    const newFilament = {
        id,
        name,
        pricePerKg: price
    };
    
    appData.filaments.push(newFilament);
    saveToLocalStorage();
    if (isConnected) saveToFile();
}

function completeOnboarding() {
    // Mark as completed
    localStorage.setItem('3dPrintQuoteHasUsedApp', 'true');
    
    // Hide wizard and show main app
    hideOnboardingWizard();
    showMainApp();
    
    // Initialize app
    initializeApp();
    
    // Update connection status
    setConnectionStatus(isConnected, isConnected ? 'full' : 'limited');
    
    // Render all data
    renderAll();
}

function hideLandingPage() {
    const landingPage = document.getElementById('landing-page');
    
    if (landingPage) {
        landingPage.style.opacity = '0';
        landingPage.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            landingPage.style.display = 'none';
        }, 300);
    }
}

function showMainApp() {
    const appContainer = document.querySelector('.app-container');
    const dbStatus = document.getElementById('db-status');
    
    if (appContainer) {
        appContainer.style.display = '';
        appContainer.style.opacity = '0';
        setTimeout(() => {
            appContainer.style.opacity = '1';
            appContainer.style.transition = 'opacity 0.3s ease';
        }, 50);
    }
    
    if (dbStatus) {
        dbStatus.style.display = '';
    }
}

function initializeApp() {
    initializeNavigation();
    initializeQuotePage();
    initializePrintersPage();
    initializeMaterialsPage();
    initializeDatabaseConnection();
    initializeGlobalCurrencySelector();
}

function initializeGlobalCurrencySelector() {
    const currencySelect = document.getElementById('global-currency-select');
    if (!currencySelect) return;
    
    // Populate options
    currencySelect.innerHTML = generateCurrencyOptions();
    currencySelect.value = appData.currency || 'USD';
}

function handleGlobalCurrencyChange(currencyCode) {
    appData.currency = currencyCode;
    
    // Update all currency labels
    updateCurrencyLabels();
    
    // Re-render all components to update dynamic labels
    renderPrinters();
    renderFilaments();
    renderLaborTasks();
    calculateQuote();
    
    // Save
    saveToLocalStorage();
    if (isConnected) autoSave();
    
    showNotification(`Currency changed to ${currencyCode}`, 'success');
}

function checkBrowserCompatibility() {
    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const hasFileSystemAccess = 'showOpenFilePicker' in window;
    
    // Store for later use
    window.browserSupport = {
        isFirefox,
        isSafari,
        hasFileSystemAccess,
        canPersistHandle: hasFileSystemAccess && !isFirefox && !isSafari
    };
    
    // Show browser notice on landing page if limited support
    if (!hasFileSystemAccess || isFirefox) {
        const notice = document.getElementById('browser-notice');
        if (notice) {
            notice.classList.add('visible');
        }
        console.log('[Browser] Limited browser detected - showing compatibility notice');
    }
}

// ============================================
// Database Connection
// ============================================

function initializeDatabaseConnection() {
    const connectBtn = document.getElementById('connect-db-btn');
    const fileInput = document.getElementById('file-input');
    
    if (connectBtn) connectBtn.addEventListener('click', handleConnectClick);
    if (fileInput) fileInput.addEventListener('change', handleFileInputChange);
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
    
    // Try to restore file handle from IndexedDB (Chrome/Edge only)
    if (window.browserSupport?.canPersistHandle) {
        try {
            const storedHandle = await getStoredFileHandle();
            if (storedHandle) {
                // Verify we still have permission
                const permission = await storedHandle.queryPermission({ mode: 'readwrite' });
                if (permission === 'granted') {
                    fileHandle = storedHandle;
                    await loadFromFile();
                    setConnectionStatus(true);
                    console.log('[Database] Auto-connected to stored file handle');
                    return; // Successfully auto-connected
                } else if (permission === 'prompt') {
                    // Try to request permission
                    const newPermission = await storedHandle.requestPermission({ mode: 'readwrite' });
                    if (newPermission === 'granted') {
                        fileHandle = storedHandle;
                        await loadFromFile();
                        setConnectionStatus(true);
                        console.log('[Database] Re-authorized stored file handle');
                        return;
                    }
                }
            }
        } catch (e) {
            console.log('[Database] Could not restore file handle:', e.message);
        }
    }
    
    // If not auto-connected, show the reconnect modal for returning users
    // (New users go through the wizard, not here)
    if (!isConnected) {
        setTimeout(() => {
            showReconnectModal();
        }, 300);
    }
    
    // Load default data if empty
    if (appData.printers.length === 0 && appData.filaments.length === 0) {
        loadDefaultData();
    }
}

// ============================================
// IndexedDB for File Handle Persistence
// ============================================

function openIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
}

async function storeFileHandle(handle) {
    if (!window.browserSupport?.canPersistHandle) return;
    
    try {
        const db = await openIndexedDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(handle, 'currentFile');
        await new Promise((resolve, reject) => {
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
        });
        console.log('[IndexedDB] File handle stored');
    } catch (e) {
        console.error('[IndexedDB] Error storing file handle:', e);
    }
}

async function getStoredFileHandle() {
    if (!window.browserSupport?.canPersistHandle) return null;
    
    try {
        const db = await openIndexedDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get('currentFile');
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error('[IndexedDB] Error getting file handle:', e);
        return null;
    }
}

async function clearStoredFileHandle() {
    if (!window.browserSupport?.canPersistHandle) return;
    
    try {
        const db = await openIndexedDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete('currentFile');
        await new Promise((resolve, reject) => {
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
        });
        console.log('[IndexedDB] File handle cleared');
    } catch (e) {
        console.error('[IndexedDB] Error clearing file handle:', e);
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
            
            // Store handle for next session (Chrome/Edge only)
            await storeFileHandle(handle);
            
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
        // Fallback for Firefox and browsers without File System Access API
        document.getElementById('file-input').click();
    }
}

function showCreateDatabaseModal() {
    // Remove existing modal if present
    const existingModal = document.getElementById('db-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Check browser compatibility
    const isFirefox = window.browserSupport?.isFirefox;
    const hasFileSystemAccess = window.browserSupport?.hasFileSystemAccess;
    
    // Firefox-specific notice
    let browserNotice = '';
    if (isFirefox || !hasFileSystemAccess) {
        browserNotice = `
            <p class="modal-warning">⚠️ <strong>Limited Browser Support:</strong> Your browser doesn't support auto-save. You'll need to manually download and re-upload your file to save changes.</p>
        `;
    }
    
    // Create a modal for database options
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'db-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>📁 Local Storage File</h3>
            <p class="modal-description">This app uses a <strong>local JSON file (.json)</strong> to save your printer and material settings on your computer. This is not a cloud database — your data stays private and local.</p>
            <p class="modal-benefit">💡 Once connected, you won't need to re-enter your printer specs and material prices every time!</p>
            ${browserNotice}
            <p class="modal-note">⚠️ This is <strong>not</strong> a .3mf or .gcode.3mf file. Saved quotes (.gcode.3mf) can be loaded later using the "Load Quote" button.</p>
            <div class="modal-buttons">
                <button class="btn-primary" id="create-new-db-btn">${hasFileSystemAccess ? 'Create New File' : 'Download Template'}</button>
                <button class="btn-secondary" id="open-existing-db-btn">${hasFileSystemAccess ? 'Open Existing File' : 'Upload Existing File'}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Add event listeners
    document.getElementById('create-new-db-btn').addEventListener('click', async () => {
        await createNewDatabase();
        // Only close modal if file was successfully created
        if (isConnected) {
            closeModal();
        }
    });
    
    document.getElementById('open-existing-db-btn').addEventListener('click', async () => {
        await connectToDatabase();
        // Only close modal if file was successfully connected
        if (isConnected) {
            closeModal();
        }
    });
    
    // Prevent closing on backdrop click - user must select a file
    // modal.addEventListener('click', (e) => {
    //     if (e.target === modal) closeModal();
    // });
}

function showReconnectModal() {
    // Remove existing modal if present
    const existingModal = document.getElementById('db-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const hasFileSystemAccess = window.browserSupport?.hasFileSystemAccess;
    
    // Create a simpler reconnect modal for returning users
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'db-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>📁 Reconnect Storage</h3>
            <p class="modal-description">Please reconnect to your settings file to continue with auto-save.</p>
            <div class="modal-buttons">
                <button class="btn-primary" id="open-existing-db-btn">${hasFileSystemAccess ? 'Open Settings File' : 'Upload Settings File'}</button>
                <button class="btn-secondary" id="create-new-db-btn">${hasFileSystemAccess ? 'Create New File' : 'Start Fresh'}</button>
            </div>
            <div class="modal-skip">
                <button class="btn-text" id="continue-without-file">Continue without file (browser storage only)</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Add event listeners
    document.getElementById('open-existing-db-btn').addEventListener('click', async () => {
        await connectToDatabase();
        if (isConnected) {
            closeModal();
        }
    });
    
    document.getElementById('create-new-db-btn').addEventListener('click', async () => {
        await createNewDatabase();
        if (isConnected) {
            closeModal();
        }
    });
    
    document.getElementById('continue-without-file')?.addEventListener('click', () => {
        setConnectionStatus(false, 'limited');
        closeModal();
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
            
            // Store handle for next session (Chrome/Edge only)
            await storeFileHandle(fileHandle);
            
        } catch (error) {
            if (error.name === 'AbortError') {
                // User cancelled - show modal again
                if (!isConnected && !document.getElementById('db-modal')) {
                    showCreateDatabaseModal();
                }
            } else {
                console.error('Error creating database:', error);
                showNotification('Failed to create database file', 'error');
                // Show modal again on error
                if (!isConnected && !document.getElementById('db-modal')) {
                    showCreateDatabaseModal();
                }
            }
        }
    } else {
        // Fallback for Firefox: download file and set as connected in read-only-ish mode
        downloadDatabaseFile();
        // For Firefox, mark as connected but in limited mode
        setConnectionStatus(true, 'limited');
        closeModal();
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
    if (!file) {
        // User cancelled - show modal again
        if (!isConnected && !document.getElementById('db-modal')) {
            showCreateDatabaseModal();
        }
        return;
    }
    
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        appData = data;
        updateIdCounters();
        renderAll();
        saveToLocalStorage();
        
        // For Firefox/Safari: connected but with manual save
        setConnectionStatus(true, 'limited');
        showNotification('Data loaded! Note: Use "Export" button to save changes.', 'info');
        closeModal();
        
    } catch (error) {
        showNotification('Error loading file: ' + error.message, 'error');
        // Show modal again on error
        if (!isConnected && !document.getElementById('db-modal')) {
            showCreateDatabaseModal();
        }
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
    await clearStoredFileHandle();
    setConnectionStatus(false);
}

function setConnectionStatus(connected, mode = 'full') {
    isConnected = connected;
    const statusEl = document.getElementById('db-status');
    if (!statusEl) return;
    
    const textEl = statusEl.querySelector('.db-status-text');
    const btnEl = statusEl.querySelector('.db-status-btn');
    
    statusEl.classList.remove('connected', 'disconnected', 'limited');
    
    if (connected) {
        statusEl.classList.add('connected');
        if (mode === 'limited') {
            statusEl.classList.add('limited');
            textEl.textContent = 'Connected (manual save mode)';
            btnEl.textContent = 'Export';
            btnEl.onclick = downloadDatabaseFile;
        } else {
            textEl.textContent = `Connected: ${fileHandle?.name || 'database.json'}`;
            btnEl.textContent = 'Connected';
            btnEl.onclick = handleConnectClick;
        }
        localStorage.setItem('3dPrintQuoteConnected', 'true');
        // Close modal if it's open
        closeModal();
    } else {
        statusEl.classList.add('disconnected');
        textEl.textContent = 'No database connected';
        btnEl.textContent = 'Connect';
        btnEl.onclick = handleConnectClick;
        // Clear the connected flag
        localStorage.removeItem('3dPrintQuoteConnected');
        // Show modal again if disconnected
        if (!document.getElementById('db-modal')) {
            showCreateDatabaseModal();
        }
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
    
    // .3mf file upload handler
    const gcodeUpload = document.getElementById('gcode-upload');
    if (gcodeUpload) {
        gcodeUpload.addEventListener('change', handle3mfUpload);
    }
    
    // Save quote button
    const saveQuoteBtn = document.getElementById('save-quote-btn');
    if (saveQuoteBtn) {
        saveQuoteBtn.addEventListener('click', saveQuote);
    }
    
    // Load quote button
    const loadQuoteBtn = document.getElementById('load-quote-btn');
    const quoteLoadInput = document.getElementById('quote-load-input');
    if (loadQuoteBtn && quoteLoadInput) {
        loadQuoteBtn.addEventListener('click', () => quoteLoadInput.click());
        quoteLoadInput.addEventListener('change', handleLoadQuote);
    }
    
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
// .3mf File Upload and Parsing
// ============================================

async function handle3mfUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const statusEl = document.getElementById('upload-status');
    
    // Validate file extension - only .gcode.3mf files work
    if (!file.name.endsWith('.gcode.3mf') && !file.name.endsWith('.3mf')) {
        statusEl.textContent = 'Error: Only .gcode.3mf files are supported. Please export from your slicer.';
        statusEl.className = 'upload-status error';
        setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = 'upload-status';
        }, 5000);
        event.target.value = '';
        return;
    }
    
    // Warn if it's a regular .3mf file (not .gcode.3mf)
    if (file.name.endsWith('.3mf') && !file.name.endsWith('.gcode.3mf')) {
        statusEl.textContent = 'Warning: This appears to be a regular .3mf file. Only .gcode.3mf files contain print data.';
        statusEl.className = 'upload-status error';
    } else {
        statusEl.textContent = 'Parsing file...';
        statusEl.className = 'upload-status processing';
    }
    
    try {
        // Check if JSZip is available
        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip library not loaded. Please refresh the page.');
        }
        
        // Read file as array buffer and store reference
        const arrayBuffer = await file.arrayBuffer();
        current3mfFile = arrayBuffer;
        current3mfFileName = file.name;
        
        // Load as ZIP using JSZip
        const zip = await JSZip.loadAsync(arrayBuffer);
        
        // Check for embedded quote data
        if (zip.files['Metadata/quote.json']) {
            try {
                const quoteDataStr = await zip.files['Metadata/quote.json'].async('text');
                const quoteData = JSON.parse(quoteDataStr);
                loadQuoteFromData(quoteData);
                statusEl.textContent = 'File loaded with saved quote!';
                statusEl.className = 'upload-status success';
                setTimeout(() => {
                    statusEl.textContent = '';
                    statusEl.className = 'upload-status';
                }, 3000);
                // Keep file reference for saving back to same file
                return; // Don't parse G-code if quote data exists
            } catch (e) {
                console.warn('Could not load embedded quote data:', e);
            }
        }
        
        // Find the G-code file (usually in Metadata/plate_1.gcode or similar)
        let gcodeFile = null;
        let gcodePath = null;
        
        // Try common paths
        const possiblePaths = [
            'Metadata/plate_1.gcode',
            'Metadata/plate_2.gcode',
            'Metadata/plate_3.gcode',
            'Metadata/*.gcode'
        ];
        
        for (const path of possiblePaths) {
            if (path.includes('*')) {
                // Search for any .gcode file in Metadata
                const files = Object.keys(zip.files).filter(f => 
                    f.startsWith('Metadata/') && f.endsWith('.gcode')
                );
                if (files.length > 0) {
                    gcodePath = files[0];
                    gcodeFile = zip.files[gcodePath];
                    break;
                }
            } else if (zip.files[path]) {
                gcodePath = path;
                gcodeFile = zip.files[path];
                break;
            }
        }
        
        if (!gcodeFile) {
            throw new Error('G-code file not found in .3mf archive. This file may not be a .gcode.3mf file. Please export "Plate Slice File" from your slicer.');
        }
        
        // Read G-code content
        const gcodeContent = await gcodeFile.async('text');
        
        // Parse print time
        const timeMatch = gcodeContent.match(/model printing time:\s*(\d+)h\s*(\d+)m\s*(\d+)s/i);
        if (timeMatch) {
            const hours = parseInt(timeMatch[1]) || 0;
            const minutes = parseInt(timeMatch[2]) || 0;
            const seconds = parseInt(timeMatch[3]) || 0;
            
            // Convert to days, hours, minutes
            const totalMinutes = hours * 60 + minutes + Math.round(seconds / 60);
            const days = Math.floor(totalMinutes / (24 * 60));
            const remainingMinutes = totalMinutes % (24 * 60);
            const finalHours = Math.floor(remainingMinutes / 60);
            const finalMinutes = remainingMinutes % 60;
            
            document.getElementById('print-time-days').value = days;
            document.getElementById('print-time-hours').value = finalHours;
            document.getElementById('print-time-minutes').value = finalMinutes;
        }
        
        // Parse filament data
        const filamentLengthMatch = gcodeContent.match(/total filament length\s*\[mm\]\s*:\s*([\d.,\s]+)/i);
        const filamentWeightMatch = gcodeContent.match(/total filament weight\s*\[g\]\s*:\s*([\d.,\s]+)/i);
        
        if (filamentLengthMatch || filamentWeightMatch) {
            // Clear existing materials
            const materialsList = document.getElementById('materials-list');
            materialsList.innerHTML = '';
            
            // Parse filament weights (more accurate than length)
            if (filamentWeightMatch) {
                const weights = filamentWeightMatch[1].split(',').map(w => parseFloat(w.trim())).filter(w => !isNaN(w) && w > 0);
                
                // Parse filament colors/types if available
                const colorMatch = gcodeContent.match(/filament_colour\s*=\s*([^;]+)/i);
                const colors = colorMatch ? colorMatch[1].split(';')[0].split(',').map(c => c.trim()) : [];
                
                // Add a material entry for each filament
                weights.forEach((weight, index) => {
                    addQuoteMaterial();
                    const materialItems = materialsList.querySelectorAll('.crud-item');
                    const lastItem = materialItems[materialItems.length - 1];
                    
                    // Set quantity (weight in grams)
                    const quantityInput = lastItem.querySelector('.material-quantity');
                    if (quantityInput) {
                        quantityInput.value = weight.toFixed(2);
                    }
                    
                });
            } else if (filamentLengthMatch) {
                // Fallback to length if weight not available
                const lengths = filamentLengthMatch[1].split(',').map(l => parseFloat(l.trim())).filter(l => !isNaN(l) && l > 0);
                
                // Convert length to approximate weight (assuming 1.75mm diameter, 1.26 g/cm³ density)
                // Volume = π * (diameter/2)² * length
                // Weight = volume * density
                const diameter = 1.75; // mm
                const density = 1.26; // g/cm³
                
                lengths.forEach((length) => {
                    const volumeCm3 = (Math.PI * Math.pow(diameter / 20, 2) * length / 10); // Convert to cm³
                    const weight = volumeCm3 * density;
                    
                    addQuoteMaterial();
                    const materialItems = materialsList.querySelectorAll('.crud-item');
                    const lastItem = materialItems[materialItems.length - 1];
                    
                    const quantityInput = lastItem.querySelector('.material-quantity');
                    if (quantityInput) {
                        quantityInput.value = weight.toFixed(2);
                    }
                });
            }
            
            // Update all material selects after adding materials
            updateMaterialSelects();
        }
        
        // Recalculate quote
        calculateQuote();
        
        statusEl.textContent = 'File loaded successfully!';
        statusEl.className = 'upload-status success';
        
        // Clear status after 3 seconds
        setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = 'upload-status';
        }, 3000);
        
    } catch (error) {
        console.error('Error parsing .3mf file:', error);
        statusEl.textContent = `Error: ${error.message}`;
        statusEl.className = 'upload-status error';
        
        setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = 'upload-status';
        }, 5000);
    }
    
    // Reset file input
    event.target.value = '';
}

// ============================================
// Quote Save/Load Functions
// ============================================

function collectQuoteData() {
    // Get printer selection
    const printerSelect = document.getElementById('printer-select');
    const printerId = printerSelect?.value || null;
    const printer = appData.printers.find(p => p.id === printerId);
    
    // Get print time
    const days = parseInt(document.getElementById('print-time-days')?.value) || 0;
    const hours = parseInt(document.getElementById('print-time-hours')?.value) || 0;
    const minutes = parseInt(document.getElementById('print-time-minutes')?.value) || 0;
    const totalMinutes = days * 24 * 60 + hours * 60 + minutes;
    const printTime = totalMinutes / 60; // in hours
    
    // Get materials
    const materials = [];
    document.querySelectorAll('#materials-list .crud-item').forEach(item => {
        const selectEl = item.querySelector('.material-select');
        const quantityInput = item.querySelector('.material-quantity');
        const materialId = selectEl?.value;
        const quantity = parseFloat(quantityInput?.value) || 0;
        
        if (materialId && quantity > 0) {
            const filament = appData.filaments.find(f => f.id === materialId || f.name === materialId);
            if (filament) {
                materials.push({
                    materialId: filament.id || filament.name,
                    materialName: filament.name,
                    quantity: quantity,
                    pricePerKg: filament.pricePerKg
                });
            }
        }
    });
    
    // Get extra costs
    const extraCosts = [];
    document.querySelectorAll('#extra-costs-list .crud-item').forEach(item => {
        const nameInput = item.querySelector('.extra-cost-name');
        const valueInput = item.querySelector('.extra-cost-value');
        const name = nameInput?.value || '';
        const value = parseFloat(valueInput?.value) || 0;
        
        if (name && value > 0) {
            extraCosts.push({ name, value });
        }
    });
    
    // Get labor tasks
    const laborTasks = {
        pre: appData.laborTasks?.pre || [],
        post: appData.laborTasks?.post || []
    };
    
    // Get pricing mode
    const pricingMode = document.querySelector('input[name="pricing-mode"]:checked')?.value || 'profit-percent';
    const profitPercent = parseFloat(document.getElementById('profit-percent')?.value) || 0;
    const pricePerHour = parseFloat(document.getElementById('price-per-hour')?.value) || 0;
    const fixedPrice = parseFloat(document.getElementById('fixed-price')?.value) || 0;
    
    // Get calculated values
    const finalPrice = parseFloat(document.getElementById('final-price')?.textContent.replace(/[^0-9.]/g, '')) || 0;
    const totalCost = parseFloat(document.getElementById('total-cost')?.textContent.replace(/[^0-9.]/g, '')) || 0;
    
    return {
        timestamp: new Date().toISOString(),
        printer: printer ? {
            id: printer.id,
            name: printer.name
        } : null,
        printTime: {
            days,
            hours,
            minutes,
            totalHours: printTime
        },
        materials,
        extraCosts,
        laborTasks,
        pricing: {
            mode: pricingMode,
            profitPercent,
            pricePerHour,
            fixedPrice
        },
        calculated: {
            finalPrice,
            totalCost
        }
    };
}

async function saveQuote() {
    try {
        const quoteData = collectQuoteData();
        
        if (current3mfFile && current3mfFileName) {
            // Embed quote in .3mf file
            await saveQuoteTo3mf(quoteData, current3mfFile, current3mfFileName);
        } else {
            // Save as JSON file
            await saveQuoteToJson(quoteData);
        }
    } catch (error) {
        console.error('Error saving quote:', error);
        alert('Error saving quote: ' + error.message);
    }
}

async function saveQuoteTo3mf(quoteData, arrayBuffer, fileName) {
    if (typeof JSZip === 'undefined') {
        throw new Error('JSZip library not loaded');
    }
    
    // Load existing ZIP
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    // Add quote data as JSON
    zip.file('Metadata/quote.json', JSON.stringify(quoteData, null, 2));
    
    // Generate new .3mf file
    const blob = await zip.generateAsync({ type: 'blob' });
    
    // Download the file with -withQuote suffix before extension
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Preserve the full extension (.gcode.3mf or .3mf) and add -withQuote before it
    let downloadName;
    if (fileName.endsWith('.gcode.3mf')) {
        downloadName = fileName.replace('.gcode.3mf', '-withQuote.gcode.3mf');
    } else if (fileName.endsWith('.3mf')) {
        downloadName = fileName.replace('.3mf', '-withQuote.3mf');
    } else {
        // Fallback: add -withQuote before the last extension
        const lastDot = fileName.lastIndexOf('.');
        if (lastDot > 0) {
            downloadName = fileName.slice(0, lastDot) + '-withQuote' + fileName.slice(lastDot);
        } else {
            downloadName = fileName + '-withQuote.3mf';
        }
    }
    
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show success message
    const statusEl = document.getElementById('upload-status');
    if (statusEl) {
        statusEl.textContent = 'Quote saved to .3mf file!';
        statusEl.className = 'upload-status success';
        setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = 'upload-status';
        }, 3000);
    }
}

async function saveQuoteToJson(quoteData) {
    // Create JSON blob
    const jsonStr = JSON.stringify(quoteData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `quote_${timestamp}.json`;
    
    // Download the file
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Show success message
    const statusEl = document.getElementById('upload-status');
    if (statusEl) {
        statusEl.textContent = 'Quote saved as JSON file!';
        statusEl.className = 'upload-status success';
        setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = 'upload-status';
        }, 3000);
    }
}

async function handleLoadQuote(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const statusEl = document.getElementById('upload-status');
    if (statusEl) {
        statusEl.textContent = 'Loading quote...';
        statusEl.className = 'upload-status processing';
    }
    
    try {
        if (file.name.endsWith('.3mf')) {
            // Handle .3mf file - use existing upload handler
            // Create a synthetic event for handle3mfUpload
            const syntheticEvent = {
                target: {
                    files: [file],
                    value: ''
                }
            };
            await handle3mfUpload(syntheticEvent);
        } else if (file.name.endsWith('.json')) {
            // Handle JSON file
            const text = await file.text();
            const quoteData = JSON.parse(text);
            loadQuoteFromData(quoteData);
            
            if (statusEl) {
                statusEl.textContent = 'Quote loaded successfully!';
                statusEl.className = 'upload-status success';
                setTimeout(() => {
                    statusEl.textContent = '';
                    statusEl.className = 'upload-status';
                }, 3000);
            }
        } else {
            throw new Error('Unsupported file type. Please use .3mf or .json files.');
        }
    } catch (error) {
        console.error('Error loading quote:', error);
        if (statusEl) {
            statusEl.textContent = `Error: ${error.message}`;
            statusEl.className = 'upload-status error';
            setTimeout(() => {
                statusEl.textContent = '';
                statusEl.className = 'upload-status';
            }, 5000);
        }
    }
    
    // Reset file input
    event.target.value = '';
}

function loadQuoteFromData(quoteData) {
    // Load printer
    if (quoteData.printer) {
        const printerSelect = document.getElementById('printer-select');
        if (printerSelect) {
            printerSelect.value = quoteData.printer.id;
        }
    }
    
    // Load print time
    if (quoteData.printTime) {
        document.getElementById('print-time-days').value = quoteData.printTime.days || 0;
        document.getElementById('print-time-hours').value = quoteData.printTime.hours || 0;
        document.getElementById('print-time-minutes').value = quoteData.printTime.minutes || 0;
    }
    
    // Load materials
    const materialsList = document.getElementById('materials-list');
    materialsList.innerHTML = '';
    
    if (quoteData.materials && quoteData.materials.length > 0) {
        quoteData.materials.forEach(material => {
            addQuoteMaterial();
            const materialItems = materialsList.querySelectorAll('.crud-item');
            const lastItem = materialItems[materialItems.length - 1];
            
            const select = lastItem.querySelector('.material-select');
            const quantityInput = lastItem.querySelector('.material-quantity');
            
            if (select) {
                updateMaterialSelects();
                // Try to find matching material
                const matchingFilament = appData.filaments.find(f => 
                    (f.id === material.materialId || f.name === material.materialId) ||
                    f.name === material.materialName
                );
                if (matchingFilament) {
                    select.value = matchingFilament.id || matchingFilament.name;
                }
            }
            
            if (quantityInput) {
                quantityInput.value = material.quantity;
            }
        });
    }
    
    // Load extra costs
    const extraCostsList = document.getElementById('extra-costs-list');
    extraCostsList.innerHTML = '';
    
    if (quoteData.extraCosts && quoteData.extraCosts.length > 0) {
        quoteData.extraCosts.forEach(cost => {
            addExtraCost();
            const costItems = extraCostsList.querySelectorAll('.crud-item');
            const lastItem = costItems[costItems.length - 1];
            
            const nameInput = lastItem.querySelector('.extra-cost-name');
            const valueInput = lastItem.querySelector('.extra-cost-value');
            
            if (nameInput) nameInput.value = cost.name;
            if (valueInput) valueInput.value = cost.value;
        });
    }
    
    // Load labor tasks
    if (quoteData.laborTasks) {
        if (quoteData.laborTasks.pre) {
            appData.laborTasks.pre = quoteData.laborTasks.pre;
        }
        if (quoteData.laborTasks.post) {
            appData.laborTasks.post = quoteData.laborTasks.post;
        }
        renderLaborTasks();
    }
    
    // Load pricing mode
    if (quoteData.pricing) {
        const pricingMode = quoteData.pricing.mode || 'profit-percent';
        const modeRadio = document.querySelector(`input[name="pricing-mode"][value="${pricingMode}"]`);
        if (modeRadio) {
            modeRadio.checked = true;
            handlePricingModeChange({ target: modeRadio });
        }
        
        if (quoteData.pricing.profitPercent !== undefined) {
            document.getElementById('profit-percent').value = quoteData.pricing.profitPercent;
        }
        if (quoteData.pricing.pricePerHour !== undefined) {
            document.getElementById('price-per-hour').value = quoteData.pricing.pricePerHour;
        }
        if (quoteData.pricing.fixedPrice !== undefined) {
            document.getElementById('fixed-price').value = quoteData.pricing.fixedPrice;
        }
    }
    
    // Recalculate quote
    setTimeout(() => {
        calculateQuote();
    }, 100);
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
                <input type="number" class="labor-rate-input" min="0" step="0.5" value="${task.rate || 20}" placeholder="${getCurrencySymbol()}/h"
                    onchange="updateLaborTask('${type}', ${index}, 'rate', this.value)">
                <span class="time-separator">${getCurrencySymbol()}/h</span>
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
        <div class="input-with-suffix">
            <input type="number" class="material-quantity" placeholder="0" min="0" step="0.1">
            <span class="suffix">g</span>
        </div>
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
            <div class="item-card-section preset-section">
                <label class="section-title">Quick Fill from Preset</label>
                <select class="preset-dropdown printer-preset-select" onchange="applyPrinterPreset('${printer.id}', this.value)">
                    <option value="">-- Select a printer model --</option>
                    ${generatePrinterPresetOptions()}
                </select>
            </div>
            <div class="item-card-section">
                <label class="section-title">
                    Electricity
                    <span class="help-icon" data-tooltip="Power consumption and electricity rate affect cost per print hour.">?</span>
                </label>
                <div class="item-card-fields">
                    <div class="item-field">
                        <label>
                            Power (kW)
                            <span class="help-icon small" data-tooltip="Check your printer's specs or use a power meter. Typical: 0.1-0.4 kW">?</span>
                        </label>
                        <input type="number" value="${printer.kwPerHour || 0}" step="0.01" min="0"
                            onchange="updatePrinter('${printer.id}', 'kwPerHour', this.value)">
                    </div>
                    <div class="item-field">
                        <label>
                            ${getCurrencySymbol()}/kWh
                            <span class="help-icon small" data-tooltip="Your electricity rate. Check your power bill.">?</span>
                        </label>
                        <select class="region-preset-select" onchange="applyRegionPreset('${printer.id}', this.value)">
                            <option value="">Region...</option>
                            ${generateRegionPresetOptions()}
                        </select>
                        <input type="number" value="${printer.costPerKwh || 0}" step="0.01" min="0"
                            onchange="updatePrinter('${printer.id}', 'costPerKwh', this.value)" style="margin-top: 4px;">
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
                        <label>Cost (${getCurrencySymbol()})</label>
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
            <input type="number" class="maintenance-cost" value="${task.cost || ''}" placeholder="${getCurrencySymbol()}" min="0" step="0.01"
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
                <label>Price per kg (${getCurrencySymbol()})</label>
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
    const currency = CURRENCIES.find(c => c.code === appData.currency) || CURRENCIES[0];
    return currency.symbol + value.toFixed(2);
}

function getCurrencySymbol() {
    const currency = CURRENCIES.find(c => c.code === appData.currency) || CURRENCIES[0];
    return currency.symbol;
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
    // Update global currency selector
    const currencySelect = document.getElementById('global-currency-select');
    if (currencySelect) {
        currencySelect.innerHTML = generateCurrencyOptions();
        currencySelect.value = appData.currency || 'USD';
    }
    
    // Update all currency labels
    updateCurrencyLabels();
    
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
        currency: 'USD',
        printers: [
            {
                id: 'printer-1',
                name: 'Ender 3 V3',
                kwPerHour: 0.25,
                costPerKwh: 0.18,
                cost: 199,
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

