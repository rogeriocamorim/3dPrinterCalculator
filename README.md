# 3D Print Quote Generator

A modern, dark-themed web application for calculating accurate 3D printing job quotes. This tool helps 3D printing businesses and hobbyists calculate the true cost of their prints, including materials, electricity, machine depreciation, maintenance, and more.

![Version](https://img.shields.io/badge/version-2.0-00d4aa)
![License](https://img.shields.io/badge/license-MIT-blue)
![Platform](https://img.shields.io/badge/platform-Web-lightgrey)

## Screenshots

### Quote Calculator
![Quote Calculator](screenshots/quote-calculator.png)
*Real-time quote calculation with expandable cost breakdown*

### Printer Management
![Printers](screenshots/printers.png)
*Configure electricity, depreciation, and maintenance costs per printer*

### Material Management
![Materials](screenshots/materials.png)
*Manage your filament inventory with pricing*

### Database Connection
![Database](screenshots/database-modal.png)
*Connect to a JSON file for persistent storage*

## Features

### 📊 Real-Time Quote Calculator
- **Automatic calculations** - Quotes update instantly as you change any input
- **Multiple pricing modes**:
  - **Profit Margin (%)** - Add a percentage markup to your costs
  - **Hourly Rate** - Set a price per print hour
  - **Fixed Price** - Manually set the final price

### 🖨️ Printer Management (CRUD)
- Add, edit, and delete printers
- Configure per-printer settings:
  - **Electricity**: Power consumption (kW) and electricity rate ($/kWh)
  - **Machine Pay Back**: Calculate depreciation based on purchase price, expected lifetime, and daily usage
  - **Repair Costs**: Account for wear and tear with a per-hour repair cost
  - **Maintenance**: Set periodic maintenance costs (grease, oil, parts) and intervals

### 🧵 Material Management (CRUD)
- Manage your filament inventory
- Set price per kilogram for each material
- Select materials when creating quotes

### 💾 Database-Like File Storage
- **Connect to a JSON file** that acts as your database
- **Auto-save**: All changes are automatically saved to your connected file
- **Connection status indicator** shows if you're connected
- **Works offline**: Falls back to browser localStorage if no file is connected

### 📈 Expandable Cost Breakdown
- See the final price at a glance
- Click to expand and see detailed cost breakdown:
  - Material Cost (with formula)
  - Electricity Cost (with formula)
  - Machine Cost (depreciation + repair + maintenance with formula)
  - Extra Costs
- Each cost item shows the complete calculation

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge, Safari)
- A local web server (for full functionality)

### Running the App

#### Quick Start (Recommended)

**On macOS/Linux:**
```bash
./start.sh
```

**On Windows:**
```batch
start.bat
```

These scripts automatically detect and use whatever server is available on your system (Python, Node.js, PHP, or Ruby). If no server is found, they'll open the app directly in your browser.

#### Manual Options

**Using Python:**
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000 in your browser.

**Using Node.js:**
```bash
npx http-server -p 8000
```

**Direct File Open:**
Simply open `index.html` in your browser. Note: The File System Access API (for database file saving) requires a web server.

### First-Time Setup

1. **Connect a Database File**
   - On first load, you'll see a dialog asking to connect to a database
   - Click "Create New Database" to create a new JSON file
   - Or click "Open Existing File" to load existing data
   - You can also click "Continue Without File" to use browser storage only

2. **Add Your Printer(s)**
   - Navigate to the "Printers" page
   - Click "Add Printer"
   - Fill in your printer's details:
     - Name
     - Power consumption (kW) and electricity rate ($/kWh)
     - Purchase price and expected lifetime hours

3. **Add Your Materials**
   - Navigate to the "Materials" page
   - Click "Add Material"
   - Enter the material name and price per kg

4. **Create Quotes**
   - Navigate to the "Quote Calculator" page
   - Select your printer
   - Enter print time (days/hours/minutes)
   - Add materials used and quantities
   - Set your pricing mode and margin
   - Watch the quote calculate in real-time!

## Cost Calculation Formulas

### Material Cost
```
Material Cost = (Quantity in grams / 1000) × Price per kg
```

### Electricity Cost
```
Electricity Cost = Print Time (hours) × Power (kW) × Rate ($/kWh)
```

### Machine Cost (Depreciation)
```
Cost per Hour = Purchase Price / Expected Lifetime Hours
Machine Cost = Cost per Hour × Print Time
```

**Example:**
- Printer Cost: $3,700
- Expected Lifetime: 5,000 hours
- Cost/Hour: $3,700 ÷ 5,000 = **$0.74/hour**
- 9-hour print: $0.74 × 9 = **$6.66**

### Final Price
Depending on pricing mode:
- **Profit Margin**: `Total Cost × (1 + Profit% / 100)`
- **Hourly Rate**: `Print Time × Rate per Hour`
- **Fixed Price**: User-defined value

## File Structure

```
3d-print-quote-app/
├── index.html      # Main HTML structure
├── styles.css      # All styling (dark theme)
├── app.js          # Application logic
├── start.sh        # Start script for macOS/Linux
├── start.bat       # Start script for Windows
├── screenshots/    # App screenshots
└── README.md       # This file
```

## Data Storage

The app stores data in a JSON file with this structure:

```json
{
  "printers": [
    {
      "id": "printer-1",
      "name": "Ender 3 Pro",
      "kwPerHour": 0.22,
      "costPerKwh": 0.12,
      "cost": 200,
      "expectedLifetimeHours": 5000,
      "includeDepreciation": true
    }
  ],
  "filaments": [
    {
      "id": "filament-1",
      "name": "PLA",
      "pricePerKg": 20.00
    }
  ]
}
```

## Browser Compatibility

- **Full Support**: Chrome 86+, Edge 86+, Opera 72+ (File System Access API)
- **Partial Support**: Firefox, Safari (uses localStorage, no file auto-save)

## Tips for Accurate Quotes

1. **Measure your printer's power consumption** with a power meter for accurate electricity costs
2. **Track your actual maintenance** costs and intervals for realistic estimates
3. **Include all costs**: Don't forget failed prints, calibration time, and wear items
4. **Update material prices** regularly as they change
5. **Consider your time**: Use the processing time fields for setup and post-processing

## License

This project is open source and available for personal and commercial use.

## Contributing

Feel free to submit issues and enhancement requests!

---

Made with ❤️ for the 3D printing community
