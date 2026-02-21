import { chromium } from 'playwright';

async function testScrollingUX() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Testing Discover Page Scrolling UX...\n');
    
    await page.goto('https://jamz.fun/discover?_=' + Date.now(), { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    await page.waitForTimeout(12000);
    
    console.log('🔍 Initial State:');
    const initialState = await page.evaluate(() => {
      const player = document.querySelector('.fixed.top-\\[168px\\]');
      const trackListContainer = document.querySelector('.pt-\\[603px\\]');
      const trackListBox = trackListContainer?.querySelector('.bg-gradient-to-br');
      const tracks = trackListBox?.querySelectorAll('[class*="space-y"]');
      
      return {
        playerFixed: !!player,
        trackListTop: trackListBox?.getBoundingClientRect().top,
        trackCount: tracks?.length || 0,
        viewportHeight: window.innerHeight,
        scrollY: window.scrollY
      };
    });
    console.log('  Player is fixed:', initialState.playerFixed);
    console.log('  Track list top:', initialState.trackListTop);
    console.log('  Track count:', initialState.trackCount);
    console.log('  Viewport height:', initialState.viewportHeight);
    console.log('  Initial scroll:', initialState.scrollY);
    
    // Test 1: Scroll down slowly
    console.log('\n📜 Test 1: Scrolling down slowly...');
    for (let i = 1; i <= 5; i++) {
      await page.evaluate(() => window.scrollBy(0, 100));
      await page.waitForTimeout(500);
      
      const state = await page.evaluate(() => {
        const player = document.querySelector('.fixed.top-\\[168px\\]');
        const trackListBox = document.querySelector('.bg-gradient-to-br');
        
        return {
          scrollY: window.scrollY,
          playerTop: player?.getBoundingClientRect().top,
          trackListTop: trackListBox?.getBoundingClientRect().top,
          trackListVisible: trackListBox ? trackListBox.getBoundingClientRect().top < window.innerHeight : false
        };
      });
      
      console.log(`  Scroll ${i}: scrollY=${state.scrollY}, playerTop=${state.playerTop}, trackListTop=${state.trackListTop}`);
    }
    
    // Test 2: Try to scroll track list
    console.log('\n📜 Test 2: Trying to scroll within track list...');
    await page.evaluate(() => window.scrollTo(0, 700));
    await page.waitForTimeout(1000);
    
    const trackListScrollTest = await page.evaluate(() => {
      const trackListBox = document.querySelector('.bg-gradient-to-br');
      const trackListRect = trackListBox?.getBoundingClientRect();
      
      return {
        trackListTop: trackListRect?.top,
        trackListHeight: trackListRect?.height,
        trackListScrollable: trackListBox ? trackListBox.scrollHeight > trackListBox.clientHeight : false,
        trackListOverflow: trackListBox ? window.getComputedStyle(trackListBox).overflow : null,
        trackListOverflowY: trackListBox ? window.getComputedStyle(trackListBox).overflowY : null
      };
    });
    
    console.log('  Track list top:', trackListScrollTest.trackListTop);
    console.log('  Track list height:', trackListScrollTest.trackListHeight);
    console.log('  Track list scrollable:', trackListScrollTest.trackListScrollable);
    console.log('  Track list overflow:', trackListScrollTest.trackListOverflow);
    console.log('  Track list overflow-y:', trackListScrollTest.trackListOverflowY);
    
    // Test 3: Check if player blocks interaction
    console.log('\n🖱️ Test 3: Checking player blocking...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1000);
    
    const blockingTest = await page.evaluate(() => {
      const player = document.querySelector('.fixed.top-\\[168px\\]');
      const trackListBox = document.querySelector('.bg-gradient-to-br');
      
      const playerRect = player?.getBoundingClientRect();
      const trackListRect = trackListBox?.getBoundingClientRect();
      
      return {
        playerBottom: playerRect?.bottom,
        trackListTop: trackListRect?.top,
        gap: trackListRect && playerRect ? trackListRect.top - playerRect.bottom : null,
        playerCoversTrackList: trackListRect && playerRect ? playerRect.bottom > trackListRect.top : false
      };
    });
    
    console.log('  Player bottom:', blockingTest.playerBottom);
    console.log('  Track list top:', blockingTest.trackListTop);
    console.log('  Gap between:', blockingTest.gap);
    console.log('  Player covers track list:', blockingTest.playerCoversTrackList);
    
    // Take screenshots
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'ux-test-1-top.png' });
    console.log('\n📸 Screenshot 1: Top view');
    
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'ux-test-2-middle.png' });
    console.log('📸 Screenshot 2: Middle scroll');
    
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'ux-test-3-tracklist.png' });
    console.log('📸 Screenshot 3: Track list area');
    
    console.log('\n⏸️  Browser staying open for manual testing (2 minutes)...');
    console.log('   Try scrolling yourself to experience the UX!');
    await page.waitForTimeout(120000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testScrollingUX();

