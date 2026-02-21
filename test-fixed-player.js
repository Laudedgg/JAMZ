import { chromium } from 'playwright';

async function testFixedPlayer() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Loading Discover page...');
    await page.goto('https://jamz.fun/discover?_=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(10000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'mobile-fixed-player-1.png', fullPage: true });
    console.log('📸 Initial full page screenshot saved');
    
    // Check the layout structure
    const layoutInfo = await page.evaluate(() => {
      // Find the header
      const header = document.querySelector('.fixed.top-0');
      const headerStyles = header ? window.getComputedStyle(header) : null;
      
      // Find the player
      const player = document.querySelector('.fixed.top-\\[88px\\]');
      const playerStyles = player ? window.getComputedStyle(player) : null;
      
      // Find the track list container
      const trackList = document.querySelector('.pt-\\[528px\\]');
      const trackListStyles = trackList ? window.getComputedStyle(trackList) : null;
      
      return {
        header: {
          exists: !!header,
          position: headerStyles?.position,
          top: headerStyles?.top,
          zIndex: headerStyles?.zIndex,
          height: header?.offsetHeight
        },
        player: {
          exists: !!player,
          position: playerStyles?.position,
          top: playerStyles?.top,
          zIndex: playerStyles?.zIndex,
          height: player?.offsetHeight
        },
        trackList: {
          exists: !!trackList,
          paddingTop: trackListStyles?.paddingTop,
          scrollable: trackList ? trackList.scrollHeight > trackList.clientHeight : false
        }
      };
    });
    
    console.log('\n📊 Layout Structure:');
    console.log(JSON.stringify(layoutInfo, null, 2));
    
    // Scroll down to test if player stays fixed
    console.log('\n📜 Scrolling down to test fixed player...');
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'mobile-fixed-player-2-scrolled.png', fullPage: false });
    console.log('📸 Scrolled screenshot saved');
    
    // Check if player is still visible after scroll
    const playerVisibleAfterScroll = await page.evaluate(() => {
      const player = document.querySelector('.fixed.top-\\[88px\\]');
      if (!player) return false;
      
      const rect = player.getBoundingClientRect();
      return rect.top >= 0 && rect.top < window.innerHeight;
    });
    
    console.log(`\n✅ Player visible after scroll: ${playerVisibleAfterScroll}`);
    
    // Scroll more to see track list
    console.log('\n📜 Scrolling more to see track list...');
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'mobile-fixed-player-3-tracklist.png', fullPage: false });
    console.log('📸 Track list screenshot saved');
    
    console.log('\n✅ Test complete! Check the screenshots.');
    console.log('⏸️  Browser will stay open for 2 minutes for manual inspection...');
    await page.waitForTimeout(120000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testFixedPlayer();

