import { chromium } from 'playwright';

async function testMobileState() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  // Listen to ALL console messages
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
  });
  
  try {
    console.log('📱 Testing Mobile State\n');
    console.log('='.repeat(70));
    
    await page.goto('https://jamz.fun/discover?_=' + Date.now(), { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(15000);
    
    const state = await page.evaluate(() => {
      // Check if there are mobile or desktop containers
      const mobileContainers = document.querySelectorAll('[class*="flex flex-col gap-2 p-3"]');
      const desktopContainers = document.querySelectorAll('[class*="hidden"]');
      
      // Find YouTube players
      const youtubeIframes = document.querySelectorAll('iframe[src*="youtube.com"]');
      
      return {
        windowWidth: window.innerWidth,
        mobileContainers: mobileContainers.length,
        desktopContainers: desktopContainers.length,
        youtubeIframes: youtubeIframes.length,
        youtubeIframeParents: Array.from(youtubeIframes).map(iframe => {
          let parent = iframe.parentElement;
          const parents = [];
          for (let i = 0; i < 5 && parent; i++) {
            parents.push({
              className: parent.className,
              isVisible: window.getComputedStyle(parent).display !== 'none'
            });
            parent = parent.parentElement;
          }
          return parents;
        })
      };
    });
    
    console.log('\n📊 STATE:');
    console.log('  Window width:', state.windowWidth);
    console.log('  Mobile containers:', state.mobileContainers);
    console.log('  Desktop containers:', state.desktopContainers);
    console.log('  YouTube iframes:', state.youtubeIframes);
    
    if (state.youtubeIframeParents.length > 0) {
      console.log('\n📍 YOUTUBE IFRAME PARENTS:');
      state.youtubeIframeParents.forEach((parents, index) => {
        console.log(`\n  Iframe #${index + 1}:`);
        parents.forEach((parent, i) => {
          console.log(`    Level ${i}: ${parent.className.substring(0, 60)}... (visible: ${parent.isVisible})`);
        });
      });
    }
    
    await page.screenshot({ path: 'mobile-state.png', fullPage: false });
    console.log('\n📸 Screenshot saved: mobile-state.png');
    
    console.log('\n' + '='.repeat(70));
    console.log('⏸️  Browser staying open for manual inspection (30 sec)...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testMobileState();

