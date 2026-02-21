import { chromium } from 'playwright';

async function testCurrentView() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Testing Current Discover Page View\n');
    
    await page.goto('https://jamz.fun/discover?_=' + Date.now(), { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    await page.waitForTimeout(12000);
    
    console.log('🔍 What user sees on initial load:');
    const viewportAnalysis = await page.evaluate(() => {
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      const nav = document.querySelector('.fixed.w-full.z-50');
      const header = document.querySelector('.fixed.top-\\[100px\\]');
      const player = document.querySelector('.fixed.top-\\[168px\\]');
      const trackList = document.querySelector('.fixed.top-\\[603px\\]');
      
      const navRect = nav?.getBoundingClientRect();
      const headerRect = header?.getBoundingClientRect();
      const playerRect = player?.getBoundingClientRect();
      const trackListRect = trackList?.getBoundingClientRect();
      
      return {
        viewport,
        elements: {
          nav: {
            visible: navRect ? navRect.top < viewport.height : false,
            top: navRect?.top,
            bottom: navRect?.bottom,
            height: navRect?.height
          },
          header: {
            visible: headerRect ? headerRect.top < viewport.height : false,
            top: headerRect?.top,
            bottom: headerRect?.bottom,
            height: headerRect?.height
          },
          player: {
            visible: playerRect ? playerRect.top < viewport.height && playerRect.bottom > 0 : false,
            top: playerRect?.top,
            bottom: playerRect?.bottom,
            height: playerRect?.height,
            visibleHeight: playerRect ? Math.min(playerRect.bottom, viewport.height) - Math.max(playerRect.top, 0) : 0
          },
          trackList: {
            visible: trackListRect ? trackListRect.top < viewport.height : false,
            top: trackListRect?.top,
            bottom: trackListRect?.bottom,
            height: trackListRect?.height,
            visibleHeight: trackListRect ? Math.min(trackListRect.bottom, viewport.height) - Math.max(trackListRect.top, 0) : 0
          }
        }
      };
    });
    
    console.log('\n📊 Viewport:', viewportAnalysis.viewport.width + 'x' + viewportAnalysis.viewport.height);
    console.log('\n📍 Element Positions:');
    console.log('  Nav:', viewportAnalysis.elements.nav.top + '-' + viewportAnalysis.elements.nav.bottom, 
                '(' + viewportAnalysis.elements.nav.height + 'px)');
    console.log('  Header:', viewportAnalysis.elements.header.top + '-' + viewportAnalysis.elements.header.bottom,
                '(' + viewportAnalysis.elements.header.height + 'px)');
    console.log('  Player:', viewportAnalysis.elements.player.top + '-' + viewportAnalysis.elements.player.bottom,
                '(' + viewportAnalysis.elements.player.height + 'px)');
    console.log('  Track List:', viewportAnalysis.elements.trackList.top + '-' + viewportAnalysis.elements.trackList.bottom,
                '(' + viewportAnalysis.elements.trackList.height + 'px)');
    
    console.log('\n👁️ What User Sees on Initial Load:');
    console.log('  Nav visible:', viewportAnalysis.elements.nav.visible ? '✅' : '❌');
    console.log('  Header visible:', viewportAnalysis.elements.header.visible ? '✅' : '❌');
    console.log('  Player visible:', viewportAnalysis.elements.player.visible ? '✅' : '❌',
                '(' + viewportAnalysis.elements.player.visibleHeight + 'px visible)');
    console.log('  Track List visible:', viewportAnalysis.elements.trackList.visible ? '✅' : '❌',
                '(' + viewportAnalysis.elements.trackList.visibleHeight + 'px visible)');
    
    console.log('\n❌ PROBLEM:');
    if (viewportAnalysis.elements.trackList.visibleHeight < 100) {
      console.log('  Track list is NOT visible or barely visible on initial load!');
      console.log('  Only ' + viewportAnalysis.elements.trackList.visibleHeight + 'px of track list visible');
      console.log('  Player takes up too much space: ' + viewportAnalysis.elements.player.height + 'px');
    }
    
    console.log('\n💡 SOLUTION NEEDED:');
    console.log('  Player should be MUCH smaller so track list is visible');
    console.log('  User should see BOTH player AND track list on initial load');
    
    await page.screenshot({ path: 'current-view-problem.png' });
    console.log('\n📸 Screenshot saved: current-view-problem.png');
    
    console.log('\n⏸️  Browser staying open (30 sec)...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testCurrentView();

