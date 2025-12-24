#!/usr/bin/env node

/**
 * Screenshot generator for 3D Print Quote Generator
 * Uses Puppeteer to capture app screenshots for README
 * 
 * Usage: node take-screenshots.js
 * Requires: npm install puppeteer (will be installed automatically)
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
const APP_URL = 'http://localhost:8000';

async function takeScreenshots() {
    // Ensure screenshots directory exists
    if (!fs.existsSync(SCREENSHOTS_DIR)) {
        fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
    }

    console.log('🚀 Launching browser...');
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    try {
        // 1. Quote Calculator (main page)
        console.log('📸 Taking screenshot: Quote Calculator...');
        await page.goto(APP_URL, { waitUntil: 'networkidle0' });
        
        // Close the database modal if it appears
        await page.evaluate(() => {
            const modal = document.getElementById('db-modal');
            if (modal) modal.remove();
            // Mark as connected to prevent modal
            localStorage.setItem('3dPrintQuoteConnected', 'localStorage');
        });
        await page.reload({ waitUntil: 'networkidle0' });
        
        // Fill in some sample data
        await page.evaluate(() => {
            // Set print time
            document.getElementById('print-time-hours').value = 4;
            document.getElementById('print-time-minutes').value = 30;
            
            // Trigger calculation
            document.getElementById('print-time-hours').dispatchEvent(new Event('input', { bubbles: true }));
            
            // Expand cost breakdown
            const toggle = document.getElementById('cost-breakdown-toggle');
            if (toggle && !toggle.classList.contains('expanded')) {
                toggle.click();
            }
        });
        
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({ 
            path: path.join(SCREENSHOTS_DIR, 'quote-calculator.png'),
            fullPage: false 
        });
        console.log('   ✓ quote-calculator.png');

        // 2. Printers page
        console.log('📸 Taking screenshot: Printers...');
        await page.click('[data-page="printers"]');
        await new Promise(r => setTimeout(r, 300));
        await page.screenshot({ 
            path: path.join(SCREENSHOTS_DIR, 'printers.png'),
            fullPage: false 
        });
        console.log('   ✓ printers.png');

        // 3. Materials page
        console.log('📸 Taking screenshot: Materials...');
        await page.click('[data-page="materials"]');
        await new Promise(r => setTimeout(r, 300));
        await page.screenshot({ 
            path: path.join(SCREENSHOTS_DIR, 'materials.png'),
            fullPage: false 
        });
        console.log('   ✓ materials.png');

        // 4. Database modal
        console.log('📸 Taking screenshot: Database Modal...');
        await page.click('[data-page="quote"]');
        await new Promise(r => setTimeout(r, 200));
        
        // Clear connected flag and show modal
        await page.evaluate(() => {
            localStorage.removeItem('3dPrintQuoteConnected');
            // Create modal manually (updated to match current UI)
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
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        });
        
        await new Promise(r => setTimeout(r, 300));
        await page.screenshot({ 
            path: path.join(SCREENSHOTS_DIR, 'database-modal.png'),
            fullPage: false 
        });
        console.log('   ✓ database-modal.png');

        // 5. Tutorial page
        console.log('📸 Taking screenshot: Tutorial...');
        await page.evaluate(() => {
            const modal = document.getElementById('db-modal');
            if (modal) modal.remove();
        });
        await page.click('[data-page="tutorial"]');
        await new Promise(r => setTimeout(r, 500));
        // Scroll to top
        await page.evaluate(() => window.scrollTo(0, 0));
        await new Promise(r => setTimeout(r, 300));
        await page.screenshot({ 
            path: path.join(SCREENSHOTS_DIR, 'tutorial.png'),
            fullPage: false 
        });
        console.log('   ✓ tutorial.png');

        console.log('\n✅ All screenshots saved to ./screenshots/');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await browser.close();
    }
}

takeScreenshots();

