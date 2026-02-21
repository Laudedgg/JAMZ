import { chromium } from 'playwright';

async function testCompactView() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Testing COMPACT Discover Page View\n');
    console.log('=' .repeat(60));
    
    await page.goto('https://jamz.fun/discover?_=' + Date.now(), { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    await page.waitForTimeout(12000);
    
    const analysis = await page.evaluate(() => {
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      const nav = document.querySelector('.fixed.w-full.z-50');
      const header = document.querySelector('.fixed.top-\\[100px\\]');
      const player = document.querySelector('.fixed.top-\\[168px\\]');
      const trackList = document.querySelector('.fixed.top-\\[520px\\]');
      const youtube = document.querySelector('.max-h-\\[150px\\]');
      
      const navRect = nav?.getBoundingClientRect();
      const headerRect = header?.getBoundingClientRect();
      const playerRect = player?.getBoundingClientRect();
      const trackListRect = trackList?.getBoundingClientRect();
      const youtubeRect = youtube?.getBoundingClientRect();
      
      return {
        viewport,
        nav: { top: navRect?.top, bottom: navRect?.bottom, height: navRect?.height },
        header: { top: headerRect?.top, bottom: headerRect?.bottom, height: headerRect?.height },
        player: { 
          top: playerRect?.top, 
          bottom: playerRect?.bottom, 
          height: playerRect?.height,
          percentOfViewport: playerRect ? ((playerRect.height / viewport.height) * 100).toFixed(1) : 0
        },
        youtube: { height: youtubeRect?.height },
        trackList: { 
          top: trackListRect?.top, 
          height: trackListRect?.height,
          visibleHeight: trackListRect ? Math.min(trackListRect.bottom, viewport.height) - Math.max(trackListRect.top, 0) : 0,
          percentOfViewport: trackListRect ? ((Math.min(trackListRect.bottom, viewport.height) - Math.max(trackListRect.top, 0)) / viewport.height * 100).toFixed(1) : 0
        }
      };
    });
    
    console.log('\n📊 VIEWPORT:', analysis.viewport.width + 'x' + analysis.viewport.height);
    
    console.log('\n📍 ELEMENT POSITIONS:');
    console.log('  Nav:        ' + analysis.nav.top + '-' + analysis.nav.bottom + ' (' + analysis.nav.height + 'px)');
    console.log('  Header:     ' + analysis.header.top + '-' + analysis.header.bottom + ' (' + analysis.header.height + 'px)');
    console.log('  Player:     ' + analysis.player.top + '-' + analysis.player.bottom + ' (' + analysis.player.height + 'px) - ' + analysis.player.percentOfViewport + '% of viewport');
    console.log('  YouTube:    ' + analysis.youtube.height + 'px');
    console.log('  Track List: ' + analysis.trackList.top + '-844 (' + analysis.trackList.visibleHeight + 'px visible) - ' + analysis.trackList.percentOfViewport + '% of viewport');
    
    console.log('\n✅ WHAT USER SEES ON INITIAL LOAD:');
    console.log('  Player takes: ' + analysis.player.percentOfViewport + '% of screen');
    console.log('  Track list visible: ' + analysis.trackList.visibleHeight + 'px (' + analysis.trackList.percentOfViewport + '% of screen)');
    
    if (parseFloat(analysis.trackList.percentOfViewport) >= 35) {
      console.log('\n🎉 SUCCESS! Track list is clearly visible (>35% of screen)');
    } else if (parseFloat(analysis.trackList.percentOfViewport) >= 25) {
      console.log('\n✅ GOOD! Track list is visible (>25% of screen)');
    } else {
      console.log('\n⚠️  Track list still not visible enough (<25% of screen)');
    }
    
    await page.screenshot({ path: 'compact-view-initial.png' });
    console.log('\n📸 Screenshot saved: compact-view-initial.png');
    
    console.log('\n' + '='.repeat(60));
    console.log('⏸️  Browser staying open for manual inspection (30 sec)...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testCompactView();

