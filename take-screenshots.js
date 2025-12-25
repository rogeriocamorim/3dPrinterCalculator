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
        // 0. Landing Page
        console.log('📸 Taking screenshot: Landing Page...');
        await page.goto(APP_URL, { waitUntil: 'networkidle0' });
        
        // Clear any existing flags to show landing page
        await page.evaluate(() => {
            localStorage.removeItem('3dPrintQuoteHasUsedApp');
            localStorage.removeItem('3dPrintQuoteConnected');
        });
        await page.reload({ waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 500));
        
        await page.screenshot({ 
            path: path.join(SCREENSHOTS_DIR, 'landing-page.png'),
            fullPage: false 
        });
        console.log('   ✓ landing-page.png');

        // 0b. Onboarding Wizard - Step 1
        console.log('📸 Taking screenshot: Wizard Step 1...');
        await page.evaluate(() => {
            // Click Get Started to show wizard
            const getStartedBtn = document.getElementById('get-started-btn');
            if (getStartedBtn) getStartedBtn.click();
        });
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({ 
            path: path.join(SCREENSHOTS_DIR, 'wizard-step1.png'),
            fullPage: false 
        });
        console.log('   ✓ wizard-step1.png');

        // 0c. Onboarding Wizard - Step 2
        console.log('📸 Taking screenshot: Wizard Step 2...');
        await page.evaluate(() => {
            // Show step 2 manually
            document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('active'));
            document.getElementById('wizard-step-2').classList.add('active');
            document.querySelectorAll('.progress-step').forEach(el => el.classList.remove('active', 'completed'));
            document.querySelector('.progress-step[data-step="1"]').classList.add('completed');
            document.querySelector('.progress-step[data-step="2"]').classList.add('active');
            document.querySelectorAll('.progress-line')[0].classList.add('completed');
        });
        await new Promise(r => setTimeout(r, 300));
        await page.screenshot({ 
            path: path.join(SCREENSHOTS_DIR, 'wizard-step2.png'),
            fullPage: false 
        });
        console.log('   ✓ wizard-step2.png');

        // 0d. Onboarding Wizard - Step 3
        console.log('📸 Taking screenshot: Wizard Step 3...');
        await page.evaluate(() => {
            // Show step 3 manually
            document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('active'));
            document.getElementById('wizard-step-3').classList.add('active');
            document.querySelectorAll('.progress-step').forEach(el => el.classList.remove('active', 'completed'));
            document.querySelector('.progress-step[data-step="1"]').classList.add('completed');
            document.querySelector('.progress-step[data-step="2"]').classList.add('completed');
            document.querySelector('.progress-step[data-step="3"]').classList.add('active');
            document.querySelectorAll('.progress-line').forEach(l => l.classList.add('completed'));
        });
        await new Promise(r => setTimeout(r, 300));
        await page.screenshot({ 
            path: path.join(SCREENSHOTS_DIR, 'wizard-step3.png'),
            fullPage: false 
        });
        console.log('   ✓ wizard-step3.png');

        // 1. Quote Calculator - Click "Get Started" to enter app
        console.log('📸 Taking screenshot: Quote Calculator...');
        
        // Set flags to skip landing and modal
        await page.evaluate(() => {
            localStorage.setItem('3dPrintQuoteHasUsedApp', 'true');
            localStorage.setItem('3dPrintQuoteConnected', 'true');
        });
        await page.reload({ waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 500));
        
        // Close any modal that appears
        await page.evaluate(() => {
            const modal = document.getElementById('db-modal');
            if (modal) modal.remove();
        });
        
        // Fill in some sample data
        await page.evaluate(() => {
            // Set print time
            const hoursInput = document.getElementById('print-time-hours');
            const minutesInput = document.getElementById('print-time-minutes');
            if (hoursInput) hoursInput.value = 4;
            if (minutesInput) minutesInput.value = 30;
            
            // Trigger calculation
            if (hoursInput) hoursInput.dispatchEvent(new Event('input', { bubbles: true }));
            
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
        await page.evaluate(() => {
            const printersBtn = document.querySelector('[data-page="printers"]');
            if (printersBtn) printersBtn.click();
        });
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({ 
            path: path.join(SCREENSHOTS_DIR, 'printers.png'),
            fullPage: false 
        });
        console.log('   ✓ printers.png');

        // 3. Materials page
        console.log('📸 Taking screenshot: Materials...');
        await page.evaluate(() => {
            const materialsBtn = document.querySelector('[data-page="materials"]');
            if (materialsBtn) materialsBtn.click();
        });
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({ 
            path: path.join(SCREENSHOTS_DIR, 'materials.png'),
            fullPage: false 
        });
        console.log('   ✓ materials.png');

        // 4. Database modal
        console.log('📸 Taking screenshot: Database Modal...');
        await page.evaluate(() => {
            const quoteBtn = document.querySelector('[data-page="quote"]');
            if (quoteBtn) quoteBtn.click();
        });
        await new Promise(r => setTimeout(r, 300));
        
        // Create modal manually
        await page.evaluate(() => {
            const existingModal = document.getElementById('db-modal');
            if (existingModal) existingModal.remove();
            
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.id = 'db-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3>📁 Local Storage File</h3>
                    <p class="modal-description">This app uses a <strong>local JSON file (.json)</strong> to save your printer and material settings on your computer. This is not a cloud database — your data stays private and local.</p>
                    <p class="modal-benefit">💡 Once connected, you won't need to re-enter your printer specs and material prices every time!</p>
                    <p class="modal-note">⚠️ This is <strong>not</strong> a .3mf or .gcode.3mf file. Saved quotes (.gcode.3mf) can be loaded later using the "Load Quote" button.</p>
                    <div class="modal-buttons">
                        <button class="btn-primary" id="create-new-db-btn">Create New File</button>
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
            const tutorialBtn = document.querySelector('[data-page="tutorial"]');
            if (tutorialBtn) tutorialBtn.click();
        });
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
