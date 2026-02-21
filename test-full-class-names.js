import { chromium } from 'playwright';

async function testFullClassNames() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Testing Full Class Names\n');
    console.log('='.repeat(70));
    
    await page.goto('https://jamz.fun/discover?_=' + Date.now(), { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(15000);
    
    const hierarchy = await page.evaluate(() => {
      const iframe = document.querySelector('iframe[src*="youtube.com"]');
      if (!iframe) return { error: 'No YouTube iframe found' };
      
      const ancestors = [];
      let current = iframe.parentElement;
      let depth = 0;
      
      while (current && depth < 10) {
        ancestors.push({
          depth,
          tagName: current.tagName,
          className: current.className, // Full class name
          id: current.id,
          isVisible: window.getComputedStyle(current).display !== 'none',
          display: window.getComputedStyle(current).display,
          width: current.offsetWidth,
          height: current.offsetHeight
        });
        current = current.parentElement;
        depth++;
      }
      
      return { ancestors };
    });
    
    if (hierarchy.error) {
      console.log('❌', hierarchy.error);
    } else {
      console.log('\n📊 FULL ANCESTOR TREE:\n');
      
      hierarchy.ancestors.forEach(ancestor => {
        console.log(`Level ${ancestor.depth}: <${ancestor.tagName}>`);
        if (ancestor.id) console.log(`  ID: ${ancestor.id}`);
        console.log(`  Class: "${ancestor.className}"`);
        console.log(`  Visible: ${ancestor.isVisible ? '✅ YES' : '❌ NO'}`);
        console.log(`  Display: ${ancestor.display}`);
        console.log(`  Size: ${ancestor.width}x${ancestor.height}`);
        console.log('');
      });
    }
    
    await page.screenshot({ path: 'full-class-names.png', fullPage: false });
    console.log('📸 Screenshot saved: full-class-names.png');
    
    console.log('\n' + '='.repeat(70));
    console.log('⏸️  Browser staying open for manual inspection (30 sec)...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testFullClassNames();

