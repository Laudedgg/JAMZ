import { chromium } from 'playwright';

async function testLayoutCount() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Testing Layout Count\n');
    console.log('='.repeat(70));
    
    await page.goto('https://jamz.fun/discover?_=' + Date.now(), { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(15000);
    
    const layoutInfo = await page.evaluate(() => {
      // Count NowPlayingCard instances
      const mobileLayouts = document.querySelectorAll('.md\\:hidden.flex.flex-col.gap-2.p-3');
      const desktopLayouts = document.querySelectorAll('.hidden.md\\:block');
      const desktopGrids = document.querySelectorAll('.hidden.md\\:grid.md\\:grid-cols-3');
      
      return {
        mobileLayouts: mobileLayouts.length,
        desktopLayouts: desktopLayouts.length,
        desktopGrids: desktopGrids.length,
        mobileLayoutsVisible: Array.from(mobileLayouts).map(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none';
        }),
        desktopLayoutsVisible: Array.from(desktopLayouts).map(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none';
        }),
        desktopGridsVisible: Array.from(desktopGrids).map(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none';
        })
      };
    });
    
    console.log('\n📊 LAYOUT COUNT:');
    console.log(`  Mobile layouts (md:hidden flex flex-col gap-2 p-3): ${layoutInfo.mobileLayouts}`);
    console.log(`  Desktop layouts (hidden md:block): ${layoutInfo.desktopLayouts}`);
    console.log(`  Desktop grids (hidden md:grid md:grid-cols-3): ${layoutInfo.desktopGrids}`);
    
    console.log('\n👁️  VISIBILITY:');
    console.log(`  Mobile layouts visible: ${layoutInfo.mobileLayoutsVisible.filter(v => v).length}/${layoutInfo.mobileLayouts}`);
    console.log(`  Desktop layouts visible: ${layoutInfo.desktopLayoutsVisible.filter(v => v).length}/${layoutInfo.desktopLayouts}`);
    console.log(`  Desktop grids visible: ${layoutInfo.desktopGridsVisible.filter(v => v).length}/${layoutInfo.desktopGrids}`);
    
    await page.screenshot({ path: 'layout-count.png', fullPage: false });
    console.log('\n📸 Screenshot saved: layout-count.png');
    
    console.log('\n' + '='.repeat(70));
    console.log('⏸️  Browser staying open for manual inspection (30 sec)...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testLayoutCount();

