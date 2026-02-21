import { chromium } from 'playwright';

async function testYouTubeLocation() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Testing YouTube Player Location\n');
    console.log('='.repeat(70));
    
    await page.goto('https://jamz.fun/discover?_=' + Date.now(), { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(15000);
    
    const location = await page.evaluate(() => {
      const iframe = document.querySelector('iframe[src*="youtube.com"]');
      if (!iframe) return { error: 'No YouTube iframe found' };
      
      // Walk up the DOM tree and collect all ancestors
      const ancestors = [];
      let current = iframe.parentElement;
      let depth = 0;
      
      while (current && depth < 15) {
        const isVisible = window.getComputedStyle(current).display !== 'none';
        ancestors.push({
          depth,
          tagName: current.tagName,
          className: current.className,
          id: current.id,
          isVisible,
          display: window.getComputedStyle(current).display,
          width: current.offsetWidth,
          height: current.offsetHeight
        });
        current = current.parentElement;
        depth++;
      }
      
      return { ancestors };
    });
    
    if (location.error) {
      console.log('❌', location.error);
    } else {
      console.log('\n📊 YOUTUBE IFRAME ANCESTOR TREE:\n');
      console.log('(from iframe parent up to root)\n');
      
      location.ancestors.forEach(ancestor => {
        const indent = '  '.repeat(ancestor.depth);
        console.log(`${indent}Level ${ancestor.depth}: <${ancestor.tagName}>`);
        if (ancestor.id) console.log(`${indent}  ID: ${ancestor.id}`);
        if (ancestor.className) console.log(`${indent}  Class: ${ancestor.className.substring(0, 80)}${ancestor.className.length > 80 ? '...' : ''}`);
        console.log(`${indent}  Visible: ${ancestor.isVisible ? '✅ YES' : '❌ NO (display: ' + ancestor.display + ')'}`);
        console.log(`${indent}  Size: ${ancestor.width}x${ancestor.height}`);
        console.log('');
      });
    }
    
    await page.screenshot({ path: 'youtube-location.png', fullPage: false });
    console.log('📸 Screenshot saved: youtube-location.png');
    
    console.log('\n' + '='.repeat(70));
    console.log('⏸️  Browser staying open for manual inspection (30 sec)...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testYouTubeLocation();

