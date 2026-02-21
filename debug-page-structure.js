import { chromium } from 'playwright';

async function debugPageStructure() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  
  const page = await context.newPage();
  
  try {
    // Clear cache and reload
    await context.clearCookies();
    await page.goto('https://jamz.fun/discover?_=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(8000);
    
    // Get all elements with aspect- classes
    const aspectElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('[class*="aspect-"]'));
      return elements.map(el => ({
        tag: el.tagName,
        className: el.className,
        height: window.getComputedStyle(el).height,
        maxHeight: window.getComputedStyle(el).maxHeight,
        width: window.getComputedStyle(el).width
      }));
    });
    
    console.log('🔍 Elements with aspect- classes:');
    aspectElements.forEach((el, i) => {
      console.log(`\n${i + 1}. ${el.tag}`);
      console.log(`   Classes: ${el.className}`);
      console.log(`   Height: ${el.height}`);
      console.log(`   Max-Height: ${el.maxHeight}`);
      console.log(`   Width: ${el.width}`);
    });
    
    // Check if max-h-[280px] class exists anywhere
    const hasMaxHeight = await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('*'));
      return allElements.some(el => el.className.includes('max-h-[280px]'));
    });
    
    console.log('\n📊 Does any element have max-h-[280px] class?', hasMaxHeight);
    
    // Take screenshot
    await page.screenshot({ path: 'debug-page.png' });
    console.log('\n📸 Screenshot saved: debug-page.png');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

debugPageStructure();

