# Complete Tutorial: 3D Print Quote Generator

This comprehensive tutorial will guide you through every feature of the 3D Print Quote Generator application.

## Table of Contents

1. [Getting Started](#getting-started)
2. [First-Time Setup](#first-time-setup)
3. [Printer Management](#printer-management)
4. [Material Management](#material-management)
5. [Creating Quotes](#creating-quotes)
6. [Uploading .gcode.3mf Files](#uploading-gcode3mf-files)
7. [Saving and Loading Quotes](#saving-and-loading-quotes)
8. [Advanced Features](#advanced-features)
9. [Tips and Best Practices](#tips-and-best-practices)

---

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, Safari)
- A computer with internet connection (for initial setup)
- Python 3 (optional, for local server) or Node.js (optional)

### Running the Application

#### Option 1: Quick Start (Recommended)

**For macOS/Linux:**
```bash
./start.sh
```

**For Windows:**
```batch
start.bat
```

These scripts will automatically:
- Detect and use an available web server (Python, Node.js, PHP, or Ruby)
- Install Python 3 if needed (with your permission)
- Open the application in your default browser

#### Option 2: Manual Server

If you prefer to run the server manually:

**Python 3:**
```bash
python3 -m http.server 8000
```

**Node.js:**
```bash
npx http-server -p 8000
```

Then open `http://localhost:8000` in your browser.

---

## First-Time Setup

### 1. Database Connection

When you first open the application, you'll see a **Database Connection** modal. **A file connection is required** to use the application.

You have two options:

#### Create New Database
1. Click **"Create New Database"**
2. Choose a location to save your `3d-print-database.json` file
3. The file will be created and connected automatically
4. Your data will auto-save to this file

#### Open Existing File
1. Click **"Open Existing File"**
2. Select your existing `3d-print-database.json` file
3. Your previous data will be loaded

**Important:** The modal will persist until you successfully connect a file. This ensures your data is always saved.

### 2. Initial Data

If this is your first time, the app will load with default example data:
- One example printer (Ender 3 Pro)
- Three example materials (PLA, ABS, PETG)

You can edit or delete these and add your own.

---

## Printer Management

Navigate to the **Printers** page from the sidebar to manage your 3D printers.

### Adding a Printer

1. Click the **"Add Printer"** button
2. Fill in the printer details:

#### Basic Information
- **Name**: Give your printer a descriptive name (e.g., "Ender 3 Pro", "Prusa MK3S")

#### Electricity Settings
- **Power (kW)**: The power consumption of your printer in kilowatts
  - Example: 0.22 kW for a typical desktop 3D printer
  - Check your printer's specifications or use a power meter
- **Cost per kWh ($)**: Your electricity rate
  - Check your utility bill or use your local rate
  - Example: $0.12/kWh

#### Machine Cost
- **Cost ($)**: The purchase price of your printer
  - Include the full cost including any upgrades
- **Lifetime (hrs)**: Expected total operating hours before replacement
  - Example: 5000 hours for a well-maintained printer
  - This is used to calculate depreciation per print

#### Scheduled Maintenance

Click **"Add Maintenance Task"** to set up periodic maintenance:

- **Task Name**: Description (e.g., "Grease & Oil", "Belt Change", "Nozzle Replacement")
- **Cost ($)**: Cost of the maintenance task
- **Interval (hrs)**: How often this maintenance is needed (in hours)

**Example:**
- After 3000 hours: Grease & Oil - $20
- After 5000 hours: Belt Change - $50

The app will automatically calculate the maintenance cost per print based on these intervals.

### Editing a Printer

1. Click on any printer card
2. Modify the fields you want to change
3. Changes are saved automatically

### Deleting a Printer

1. Click the **×** button on the printer card
2. Confirm deletion

---

## Material Management

Navigate to the **Materials** page from the sidebar to manage your filaments and materials.

### Adding a Material

1. Click the **"Add Material"** button
2. Fill in:
   - **Name**: Material type (e.g., "PLA", "ABS", "PETG", "TPU")
   - **Price per kg ($)**: Cost of the material per kilogram
     - Include shipping costs if buying online
     - Example: $20-30/kg for PLA

### Editing a Material

1. Click on any material card
2. Modify the name or price
3. Changes are saved automatically

### Deleting a Material

1. Click the **×** button on the material card
2. Confirm deletion

---

## Creating Quotes

Navigate to the **Quote Calculator** page to create quotes for your 3D printing jobs.

### Step 1: Select Printer

Choose the printer you'll use for this job from the dropdown menu.

### Step 2: Enter Print Time

Enter the estimated print time:
- **Days**: For very long prints (optional)
- **Hours**: Main time component
- **Minutes**: Additional time

**Tip:** You can also upload a `.gcode.3mf` file to auto-fill this (see below).

### Step 3: Add Materials

1. Click **"Add Material"** to add a material row
2. Select the material from the dropdown
3. Enter the quantity in **grams** (the "g" suffix is shown automatically)

**For Multi-Color Prints:**
- Add multiple material rows, one for each color
- Enter the weight used for each color

**Example:**
- PLA (Orange): 50.96g
- PLA (Cyan): 10.88g
- PLA (Yellow): 7.64g

### Step 4: Add Labor Tasks

#### Pre-Processing Tasks
Click **"+ Add task"** under Pre-processing to add tasks like:
- **Slicing**: Time spent preparing the file
- **Modeling**: Time spent creating/modifying the 3D model
- **File Preparation**: Any other pre-print work

For each task:
- Enter a **name** (e.g., "Slicing", "Modeling")
- Enter **hours** and **minutes**
- Enter your **hourly rate** ($/h)

**Example:**
- Slicing: 5 minutes @ $10/hour
- Modeling: 1 hour @ $50/hour

#### Post-Processing Tasks
Click **"+ Add task"** under Post-processing to add tasks like:
- **Sanding**: Time spent sanding the print
- **Painting**: Time spent painting
- **Assembly**: Time spent assembling parts

### Step 5: Add Extra Costs

Click **"Add Extra Cost"** for any additional expenses:
- **Description**: What the cost is for (e.g., "Special packaging", "Rush order fee")
- **Amount**: The cost in dollars

### Step 6: Choose Pricing Mode

Select how you want to price the job:

#### Profit Margin (Recommended)
- Add a percentage markup to your total costs
- Example: 30% profit margin
- **Formula:** Final Price = Total Cost × (1 + Profit Margin%)

#### Hourly Rate
- Set a fixed price per print hour
- Example: $15/hour
- **Formula:** Final Price = Print Time (hours) × Hourly Rate

#### Fixed Price
- Manually set the final price
- Useful when you have a specific price in mind

### Viewing the Quote

The **Quote Summary** panel on the right shows:
- **Final Price**: The total price to charge
- **Profit**: Your profit margin percentage
- **Per Hour**: Price per hour rate

Click **"Cost Breakdown"** to see detailed calculations:
- **Material Cost**: Breakdown of each material used
- **Electricity**: Power consumption cost
- **Machine Cost**: Depreciation and maintenance costs
- **Labor Cost**: Pre and post-processing costs
- **Extra Costs**: Any additional expenses
- **Total Cost**: Sum of all costs

---

## Uploading .gcode.3mf Files

You can automatically fill in print time and material usage by uploading a `.gcode.3mf` file from your slicer.

### How to Get .gcode.3mf Files

**In your slicer (Bambu Studio, PrusaSlicer, etc.):**
1. Prepare your print and slice it
2. Look for the **print plate** area
3. Click the **arrow/dropdown** next to the print plate
4. Select **"Export Plate Slice File"** or **"Export .gcode.3mf"**
5. Save the file

**Important:** Only `.gcode.3mf` files work (not regular `.3mf` files). These contain the actual G-code with print time and material usage data.

### Uploading the File

1. In the **Print Time** section, click **"Upload .gcode.3mf File"**
2. Select your `.gcode.3mf` file
3. The app will automatically:
   - Extract print time and convert to days/hours/minutes
   - Extract material usage (weight in grams) for each color
   - Create material entries for each filament used
   - Fill in all the data

**Note:** You'll still need to:
- Select the appropriate material types for each entry
- Add any additional materials not in the file
- Add labor tasks and extra costs

---

## Saving and Loading Quotes

### Saving a Quote

1. Fill in all your quote details
2. Click the **"Save Quote"** button in the Quote Summary panel

**Two scenarios:**

#### If you uploaded a .gcode.3mf file:
- The quote data will be **embedded** in the `.gcode.3mf` file
- A new file will be downloaded: `filename-withQuote.gcode.3mf`
- This file contains both the G-code AND your quote data
- You can share this file with clients or keep it for records

#### If no .gcode.3mf file was uploaded:
- The quote will be saved as a **JSON file**
- Filename: `quote_YYYY-MM-DDTHH-MM-SS.json`
- You can load this later to restore the quote

### Loading a Saved Quote

1. Click the **"Load Quote"** button
2. Select either:
   - A `.gcode.3mf` file with embedded quote data
   - A `.json` quote file

The app will restore:
- Printer selection
- Print time
- All materials and quantities
- Labor tasks
- Extra costs
- Pricing mode and settings

**Tip:** When you upload a `.gcode.3mf` file that contains quote data, it will automatically load the quote instead of parsing the G-code.

---

## Advanced Features

### Scheduled Maintenance

For printers with periodic maintenance needs:

1. Go to **Printers** page
2. Select a printer
3. Scroll to **"Scheduled Maintenance"** section
4. Click **"Add Maintenance Task"**

**Example Setup:**
- **Task 1:** Grease & Oil
  - Cost: $20
  - Interval: 3000 hours
- **Task 2:** Belt Change
  - Cost: $50
  - Interval: 5000 hours
- **Task 3:** Nozzle Replacement
  - Cost: $15
  - Interval: 2000 hours

The app calculates: `Maintenance Cost = (Task Cost / Interval) × Print Time`

### Multiple Labor Tasks

You can add multiple pre and post-processing tasks with different rates:

**Pre-Processing Example:**
- Slicing: 10 min @ $10/hour
- Modeling: 2 hours @ $50/hour
- File Prep: 15 min @ $20/hour

**Post-Processing Example:**
- Sanding: 30 min @ $25/hour
- Painting: 1 hour @ $40/hour
- Assembly: 20 min @ $30/hour

Each task is calculated separately and summed together.

### Cost Breakdown Details

Click the **"Cost Breakdown"** section to see detailed math:

#### Material Cost
Shows each material with calculation:
```
PLA: 50.96g × $30/kg
= 50.96g ÷ 1000 × $30
= $1.53
```

#### Electricity Cost
Shows power consumption calculation:
```
Print Time: 8.98 hours
Power: 0.22 kW
Rate: $0.12/kWh
= 8.98 × 0.22 × $0.12
= $0.24
```

#### Machine Cost
Shows depreciation and maintenance:
```
Depreciation: $200 ÷ 5000 hrs × 8.98 hrs = $0.36
Maintenance Tasks:
  - Grease & Oil: $20 ÷ 3000 hrs × 8.98 hrs = $0.06
  - Belt Change: $50 ÷ 5000 hrs × 8.98 hrs = $0.09
Total Machine Cost: $0.51
```

#### Labor Cost
Shows each task:
```
Pre-processing:
  - Slicing: 0.17 hrs × $10/hr = $1.67
  - Modeling: 2.00 hrs × $50/hr = $100.00
Post-processing:
  - Sanding: 0.50 hrs × $25/hr = $12.50
Total Labor: $114.17
```

---

## Tips and Best Practices

### Accurate Cost Calculation

1. **Measure Actual Power Consumption**
   - Use a power meter to measure your printer's actual consumption
   - Different printers vary significantly
   - Consider heated bed usage

2. **Track Material Usage**
   - Weigh your spools before and after prints
   - Use the `.gcode.3mf` upload feature for accurate measurements
   - Account for waste and failed prints

3. **Set Realistic Lifetime Hours**
   - Consider your printer's expected lifespan
   - Factor in maintenance and repairs
   - Update as you learn more about your printer

4. **Document Maintenance Costs**
   - Keep receipts for parts and supplies
   - Track maintenance intervals
   - Update maintenance tasks as needed

### Pricing Strategy

1. **Start with Profit Margin Mode**
   - Begin with 20-30% margin
   - Adjust based on market and competition
   - Consider your skill level and overhead

2. **Use Hourly Rate for Complex Jobs**
   - When labor is the main cost driver
   - Set different rates for different skill levels
   - Example: $20/hr for basic work, $50/hr for design

3. **Factor in Overhead**
   - Use "Extra Costs" for business expenses
   - Consider rent, insurance, marketing
   - Add a small percentage to cover these

### File Management

1. **Keep Your Database File Safe**
   - Back up your `3d-print-database.json` file regularly
   - Store it in cloud storage (Dropbox, Google Drive)
   - Version control if using Git

2. **Organize Saved Quotes**
   - Use descriptive filenames when saving quotes
   - Keep a folder for client quotes
   - Archive old quotes for tax/record keeping

3. **Use .gcode.3mf Files**
   - Always export `.gcode.3mf` from your slicer
   - Embed quotes in the file for complete records
   - Share with clients for transparency

### Workflow Tips

1. **Create Templates**
   - Set up common printer configurations
   - Create material presets for your inventory
   - Save quote templates for common job types

2. **Use Labor Tasks Efficiently**
   - Create standard task lists
   - Set appropriate hourly rates
   - Track actual vs. estimated time

3. **Review Cost Breakdowns**
   - Check which costs are highest
   - Identify opportunities to reduce costs
   - Adjust pricing based on actual costs

---

## Troubleshooting

### File Connection Issues

**Problem:** Modal keeps appearing
- **Solution:** Make sure you successfully selected a file. The modal will only close when a file is connected.

**Problem:** Data not saving
- **Solution:** Check that you have write permissions to the database file location.

### .gcode.3mf Upload Issues

**Problem:** "G-code file not found" error
- **Solution:** Make sure you exported a `.gcode.3mf` file, not a regular `.3mf` file. Use "Export Plate Slice File" in your slicer.

**Problem:** File uploads but data is wrong
- **Solution:** Check that your slicer generated the file correctly. Some slicers may not include all metadata.

### Calculation Issues

**Problem:** Costs seem too high/low
- **Solution:** Review your printer settings (power consumption, electricity rate, lifetime hours). Check material prices are per kilogram, not per gram.

**Problem:** Maintenance costs not showing
- **Solution:** Make sure you added maintenance tasks to your printer and that the print time is long enough to trigger maintenance intervals.

---

## Support

- 🐛 **Report Issues:** [GitHub Issues](https://github.com/rogeriocamorim/3dPrinterCalculator/issues)
- 💰 **Support the Project:** [GitHub Sponsors](https://github.com/sponsors/rogeriocamorim) or [Ko-fi](https://ko-fi.com/rogeriocamorim)

---

**Happy Printing! 🖨️**

