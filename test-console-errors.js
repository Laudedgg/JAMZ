import { chromium } from 'playwright';

async function testConsoleErrors() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  // Listen to ALL console messages
  page.on('console', msg => {
    const type = msg.type().toUpperCase();
    const text = msg.text();
    console.log(`[${type}]:`, text);
  });
  
  // Listen to page errors
  page.on('pageerror', error => {
    console.log('[PAGE ERROR]:', error.message);
  });
  
  try {
    console.log('📱 Testing Console Errors\n');
    console.log('='.repeat(70));
    
    await page.goto('https://jamz.fun/discover?_=' + Date.now(), { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    console.log('\n⏳ Waiting for page to load...');
    await page.waitForTimeout(15000);
    
    await page.screenshot({ path: 'console-errors.png', fullPage: false });
    console.log('\n📸 Screenshot saved: console-errors.png');
    
    console.log('\n' + '='.repeat(70));
    console.log('⏸️  Browser staying open for manual inspection (30 sec)...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testConsoleErrors();

