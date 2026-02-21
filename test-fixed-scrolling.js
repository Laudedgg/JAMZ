import { chromium } from 'playwright';

async function testFixedScrolling() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Testing FIXED Track List Scrolling UX\n');
    console.log('=' .repeat(60));
    
    await page.goto('https://jamz.fun/discover?_=' + Date.now(), { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    await page.waitForTimeout(12000);
    
    console.log('\n🔍 Initial Layout Check:');
    const layout = await page.evaluate(() => {
      const nav = document.querySelector('.fixed.w-full.z-50');
      const header = document.querySelector('.fixed.top-\\[100px\\]');
      const player = document.querySelector('.fixed.top-\\[168px\\]');
      const trackListContainer = document.querySelector('.fixed.top-\\[603px\\]');
      
      const navRect = nav?.getBoundingClientRect();
      const headerRect = header?.getBoundingClientRect();
      const playerRect = player?.getBoundingClientRect();
      const trackListRect = trackListContainer?.getBoundingClientRect();
      
      return {
        nav: { exists: !!nav, top: navRect?.top, height: navRect?.height },
        header: { exists: !!header, top: headerRect?.top, height: headerRect?.height },
        player: { exists: !!player, top: playerRect?.top, height: playerRect?.height },
        trackList: { 
          exists: !!trackListContainer, 
          isFixed: trackListContainer?.classList.contains('fixed'),
          top: trackListRect?.top, 
          height: trackListRect?.height,
          overflow: trackListContainer ? window.getComputedStyle(trackListContainer).overflow : null,
          overflowY: trackListContainer ? window.getComputedStyle(trackListContainer).overflowY : null
        }
      };
    });
    
    console.log('  Nav:', layout.nav.exists ? `✅ top=${layout.nav.top}, height=${layout.nav.height}` : '❌');
    console.log('  Header:', layout.header.exists ? `✅ top=${layout.header.top}, height=${layout.header.height}` : '❌');
    console.log('  Player:', layout.player.exists ? `✅ top=${layout.player.top}, height=${layout.player.height}` : '❌');
    console.log('  Track List:', layout.trackList.exists ? `✅ FIXED=${layout.trackList.isFixed}, top=${layout.trackList.top}` : '❌');
    console.log('  Track List Overflow:', layout.trackList.overflowY);
    
    console.log('\n📜 Test 1: Page Scroll (should NOT affect track list position)');
    for (let i = 1; i <= 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 200));
      await page.waitForTimeout(500);
      
      const state = await page.evaluate(() => {
        const trackListContainer = document.querySelector('.fixed.top-\\[603px\\]');
        const rect = trackListContainer?.getBoundingClientRect();
        return {
          scrollY: window.scrollY,
          trackListTop: rect?.top
        };
      });
      
      console.log(`  Scroll ${i}: pageScrollY=${state.scrollY}, trackListTop=${state.trackListTop} ${state.trackListTop === 603 ? '✅' : '❌'}`);
    }
    
    console.log('\n📜 Test 2: Track List Internal Scrolling');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    
    // Try to scroll within track list
    const scrollTest = await page.evaluate(() => {
      const trackListContainer = document.querySelector('.fixed.top-\\[603px\\]');
      const scrollableDiv = trackListContainer?.querySelector('.overflow-y-auto');
      
      if (!scrollableDiv) return { error: 'No scrollable div found' };
      
      const initialScroll = scrollableDiv.scrollTop;
      scrollableDiv.scrollTop = 100;
      const afterScroll = scrollableDiv.scrollTop;
      
      return {
        hasScrollableDiv: !!scrollableDiv,
        scrollHeight: scrollableDiv.scrollHeight,
        clientHeight: scrollableDiv.clientHeight,
        canScroll: scrollableDiv.scrollHeight > scrollableDiv.clientHeight,
        initialScroll,
        afterScroll,
        scrollWorked: afterScroll > initialScroll
      };
    });
    
    console.log('  Has scrollable div:', scrollTest.hasScrollableDiv ? '✅' : '❌');
    console.log('  Scroll height:', scrollTest.scrollHeight);
    console.log('  Client height:', scrollTest.clientHeight);
    console.log('  Can scroll:', scrollTest.canScroll ? '✅' : '❌');
    console.log('  Scroll worked:', scrollTest.scrollWorked ? '✅' : '❌');
    
    console.log('\n📜 Test 3: All Elements Stay Fixed During Page Scroll');
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    
    const beforeScroll = await page.evaluate(() => {
      const header = document.querySelector('.fixed.top-\\[100px\\]');
      const player = document.querySelector('.fixed.top-\\[168px\\]');
      const trackList = document.querySelector('.fixed.top-\\[603px\\]');
      
      return {
        headerTop: header?.getBoundingClientRect().top,
        playerTop: player?.getBoundingClientRect().top,
        trackListTop: trackList?.getBoundingClientRect().top
      };
    });
    
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500);
    
    const afterScroll = await page.evaluate(() => {
      const header = document.querySelector('.fixed.top-\\[100px\\]');
      const player = document.querySelector('.fixed.top-\\[168px\\]');
      const trackList = document.querySelector('.fixed.top-\\[603px\\]');
      
      return {
        headerTop: header?.getBoundingClientRect().top,
        playerTop: player?.getBoundingClientRect().top,
        trackListTop: trackList?.getBoundingClientRect().top
      };
    });
    
    console.log('  Header: before=' + beforeScroll.headerTop + ', after=' + afterScroll.headerTop, 
                beforeScroll.headerTop === afterScroll.headerTop ? '✅' : '❌');
    console.log('  Player: before=' + beforeScroll.playerTop + ', after=' + afterScroll.playerTop,
                beforeScroll.playerTop === afterScroll.playerTop ? '✅' : '❌');
    console.log('  Track List: before=' + beforeScroll.trackListTop + ', after=' + afterScroll.trackListTop,
                beforeScroll.trackListTop === afterScroll.trackListTop ? '✅' : '❌');
    
    // Screenshots
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'fixed-scroll-1-initial.png' });
    console.log('\n📸 Screenshot 1: Initial view');
    
    await page.screenshot({ path: 'fixed-scroll-2-fullpage.png', fullPage: true });
    console.log('📸 Screenshot 2: Full page');
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 TESTS COMPLETE!');
    console.log('=' .repeat(60));
    console.log('\n⏸️  Browser staying open for manual testing (2 minutes)...');
    console.log('   Try scrolling the track list yourself!');
    await page.waitForTimeout(120000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testFixedScrolling();

