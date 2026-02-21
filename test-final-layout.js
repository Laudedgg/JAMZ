import { chromium } from 'playwright';

async function testFinalLayout() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Loading Discover page with cache bypass...');
    await page.goto('https://jamz.fun/discover?_=' + Date.now(), { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(12000);
    
    // Get detailed layout measurements
    const measurements = await page.evaluate(() => {
      const header = document.querySelector('.fixed.top-0');
      const player = document.querySelector('.fixed.top-\\[88px\\]');
      const trackList = document.querySelector('.pt-\\[628px\\]');
      
      const headerRect = header?.getBoundingClientRect();
      const playerRect = player?.getBoundingClientRect();
      
      return {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          scrollY: window.scrollY
        },
        header: {
          exists: !!header,
          top: headerRect?.top,
          height: headerRect?.height,
          bottom: headerRect?.bottom
        },
        player: {
          exists: !!player,
          top: playerRect?.top,
          height: playerRect?.height,
          bottom: playerRect?.bottom
        },
        trackList: {
          exists: !!trackList,
          paddingTop: window.getComputedStyle(trackList).paddingTop
        },
        gaps: {
          headerToPlayer: playerRect && headerRect ? playerRect.top - headerRect.bottom : null,
          playerToTrackList: playerRect ? 628 - (playerRect.top + playerRect.height) : null
        }
      };
    });
    
    console.log('\n📊 Layout Measurements:');
    console.log(JSON.stringify(measurements, null, 2));
    
    // Take initial screenshot
    await page.screenshot({ path: 'final-layout-1-initial.png', fullPage: false });
    console.log('\n📸 Initial viewport screenshot saved');
    
    // Scroll to see track list
    console.log('\n📜 Scrolling to reveal track list...');
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'final-layout-2-scrolled.png', fullPage: false });
    console.log('📸 Scrolled screenshot saved');
    
    // Check if player is still fixed
    const playerStillFixed = await page.evaluate(() => {
      const player = document.querySelector('.fixed.top-\\[88px\\]');
      const rect = player?.getBoundingClientRect();
      return {
        exists: !!player,
        top: rect?.top,
        isAtExpectedPosition: rect?.top === 88
      };
    });
    
    console.log('\n✅ Player after scroll:', playerStillFixed);
    
    // Scroll more to see more tracks
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'final-layout-3-more-tracks.png', fullPage: false });
    console.log('📸 More tracks screenshot saved');
    
    // Take full page screenshot
    await page.screenshot({ path: 'final-layout-4-fullpage.png', fullPage: true });
    console.log('📸 Full page screenshot saved');
    
    console.log('\n✅ Test complete!');
    console.log('⏸️  Browser will stay open for manual inspection (2 min)...');
    await page.waitForTimeout(120000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testFinalLayout();

