import { chromium } from 'playwright';

async function testYouTubeCount() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Testing YouTube Player Count\n');
    console.log('='.repeat(70));
    
    await page.goto('https://jamz.fun/discover?_=' + Date.now(), { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(15000);
    
    const youtubeInfo = await page.evaluate(() => {
      const iframes = document.querySelectorAll('iframe[src*="youtube.com"]');
      
      return {
        count: iframes.length,
        iframes: Array.from(iframes).map((iframe, index) => {
          const rect = iframe.getBoundingClientRect();
          let parent = iframe.parentElement;
          const parents = [];
          
          for (let i = 0; i < 5 && parent; i++) {
            const computedStyle = window.getComputedStyle(parent);
            parents.push({
              tagName: parent.tagName,
              className: parent.className,
              display: computedStyle.display,
              width: parent.offsetWidth,
              height: parent.offsetHeight,
              isVisible: computedStyle.display !== 'none'
            });
            parent = parent.parentElement;
          }
          
          return {
            index,
            src: iframe.src,
            width: rect.width,
            height: rect.height,
            offsetWidth: iframe.offsetWidth,
            offsetHeight: iframe.offsetHeight,
            parents
          };
        })
      };
    });
    
    console.log('\n📊 YOUTUBE IFRAME COUNT:', youtubeInfo.count);
    
    youtubeInfo.iframes.forEach(iframe => {
      console.log(`\n🎥 IFRAME #${iframe.index + 1}:`);
      console.log(`  Size: ${iframe.width}x${iframe.height}`);
      console.log(`  Offset Size: ${iframe.offsetWidth}x${iframe.offsetHeight}`);
      console.log(`  Src: ${iframe.src.substring(0, 80)}...`);
      console.log(`\n  PARENT HIERARCHY:`);
      iframe.parents.forEach((parent, i) => {
        console.log(`    Level ${i}: <${parent.tagName}> class="${parent.className.substring(0, 40)}..."`);
        console.log(`      Display: ${parent.display}, Size: ${parent.width}x${parent.height}, Visible: ${parent.isVisible}`);
      });
    });
    
    await page.screenshot({ path: 'youtube-count.png', fullPage: false });
    console.log('\n📸 Screenshot saved: youtube-count.png');
    
    console.log('\n' + '='.repeat(70));
    console.log('⏸️  Browser staying open for manual inspection (30 sec)...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testYouTubeCount();

