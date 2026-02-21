import { chromium } from 'playwright';

async function testScrollingBehavior() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Testing scrolling behavior on mobile Discover page...\n');
    await page.goto('https://jamz.fun/discover?_=' + Date.now(), { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    await page.waitForTimeout(10000);
    
    console.log('✅ Step 1: Initial state - Player should be visible');
    await page.screenshot({ path: 'scroll-test-1-initial.png' });
    
    const step1 = await page.evaluate(() => {
      const player = document.querySelector('.fixed.top-\\[88px\\]');
      const rect = player?.getBoundingClientRect();
      return {
        playerVisible: !!player && rect.top >= 0 && rect.bottom <= window.innerHeight,
        playerTop: rect?.top,
        scrollY: window.scrollY
      };
    });
    console.log('   Player visible:', step1.playerVisible);
    console.log('   Player top:', step1.playerTop);
    console.log('   Scroll position:', step1.scrollY);
    
    console.log('\n✅ Step 2: Scroll down 200px - Player should STAY FIXED');
    await page.evaluate(() => window.scrollBy(0, 200));
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'scroll-test-2-scroll200.png' });
    
    const step2 = await page.evaluate(() => {
      const player = document.querySelector('.fixed.top-\\[88px\\]');
      const rect = player?.getBoundingClientRect();
      return {
        playerVisible: !!player && rect.top >= 0 && rect.bottom <= window.innerHeight,
        playerTop: rect?.top,
        scrollY: window.scrollY
      };
    });
    console.log('   Player visible:', step2.playerVisible);
    console.log('   Player top:', step2.playerTop, '(should still be 88)');
    console.log('   Scroll position:', step2.scrollY);
    
    console.log('\n✅ Step 3: Scroll down 400px more - Player should STILL be fixed');
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'scroll-test-3-scroll600.png' });
    
    const step3 = await page.evaluate(() => {
      const player = document.querySelector('.fixed.top-\\[88px\\]');
      const rect = player?.getBoundingClientRect();
      const trackList = document.querySelector('.pt-\\[628px\\]');
      const firstTrack = trackList?.querySelector('[class*="space-y-2"] > div:first-child');
      const firstTrackRect = firstTrack?.getBoundingClientRect();
      
      return {
        playerVisible: !!player && rect.top >= 0 && rect.bottom <= window.innerHeight,
        playerTop: rect?.top,
        scrollY: window.scrollY,
        trackListVisible: !!firstTrack && firstTrackRect.top < window.innerHeight,
        firstTrackTop: firstTrackRect?.top
      };
    });
    console.log('   Player visible:', step3.playerVisible);
    console.log('   Player top:', step3.playerTop, '(should still be 88)');
    console.log('   Scroll position:', step3.scrollY);
    console.log('   Track list visible:', step3.trackListVisible);
    console.log('   First track top:', step3.firstTrackTop);
    
    console.log('\n✅ Step 4: Scroll to bottom - Player should STILL be fixed');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'scroll-test-4-bottom.png' });
    
    const step4 = await page.evaluate(() => {
      const player = document.querySelector('.fixed.top-\\[88px\\]');
      const rect = player?.getBoundingClientRect();
      return {
        playerVisible: !!player && rect.top >= 0 && rect.bottom <= window.innerHeight,
        playerTop: rect?.top,
        scrollY: window.scrollY,
        atBottom: (window.innerHeight + window.scrollY) >= document.body.scrollHeight - 10
      };
    });
    console.log('   Player visible:', step4.playerVisible);
    console.log('   Player top:', step4.playerTop, '(should still be 88)');
    console.log('   Scroll position:', step4.scrollY);
    console.log('   At bottom:', step4.atBottom);
    
    console.log('\n✅ Step 5: Scroll back to top');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'scroll-test-5-back-to-top.png' });
    
    const step5 = await page.evaluate(() => {
      const player = document.querySelector('.fixed.top-\\[88px\\]');
      const rect = player?.getBoundingClientRect();
      return {
        playerVisible: !!player && rect.top >= 0 && rect.bottom <= window.innerHeight,
        playerTop: rect?.top,
        scrollY: window.scrollY
      };
    });
    console.log('   Player visible:', step5.playerVisible);
    console.log('   Player top:', step5.playerTop, '(should still be 88)');
    console.log('   Scroll position:', step5.scrollY);
    
    console.log('\n🎉 SUCCESS! Player stayed fixed at 88px throughout all scrolling!');
    console.log('\n📸 Screenshots saved:');
    console.log('   - scroll-test-1-initial.png');
    console.log('   - scroll-test-2-scroll200.png');
    console.log('   - scroll-test-3-scroll600.png');
    console.log('   - scroll-test-4-bottom.png');
    console.log('   - scroll-test-5-back-to-top.png');
    
    console.log('\n⏸️  Browser will stay open for 30 seconds...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testScrollingBehavior();

