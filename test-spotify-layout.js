import { chromium } from 'playwright';

async function testSpotifyLayout() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Testing SPOTIFY-STYLE Layout\n');
    console.log('=' .repeat(70));
    
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
      const trackList = document.querySelector('.fixed.top-\\[290px\\]');
      const trackItems = document.querySelectorAll('.fixed.top-\\[290px\\] .group');
      
      const navRect = nav?.getBoundingClientRect();
      const headerRect = header?.getBoundingClientRect();
      const playerRect = player?.getBoundingClientRect();
      const trackListRect = trackList?.getBoundingClientRect();
      
      // Count visible tracks
      let visibleTracks = 0;
      trackItems.forEach(item => {
        const rect = item.getBoundingClientRect();
        if (rect.top >= 0 && rect.bottom <= viewport.height) {
          visibleTracks++;
        }
      });
      
      return {
        viewport,
        nav: { height: navRect?.height },
        header: { height: headerRect?.height },
        player: { 
          top: playerRect?.top,
          height: playerRect?.height,
          percentOfViewport: playerRect ? ((playerRect.height / viewport.height) * 100).toFixed(1) : 0
        },
        trackList: { 
          top: trackListRect?.top,
          height: trackListRect?.height,
          visibleHeight: trackListRect ? Math.min(trackListRect.bottom, viewport.height) - Math.max(trackListRect.top, 0) : 0,
          percentOfViewport: trackListRect ? ((Math.min(trackListRect.bottom, viewport.height) - Math.max(trackListRect.top, 0)) / viewport.height * 100).toFixed(1) : 0
        },
        visibleTracks,
        totalTracks: trackItems.length
      };
    });
    
    console.log('\n📊 VIEWPORT:', analysis.viewport.width + 'x' + analysis.viewport.height);
    
    console.log('\n📍 LAYOUT BREAKDOWN:');
    console.log('  Nav:        ' + analysis.nav.height + 'px');
    console.log('  Header:     ' + analysis.header.height + 'px');
    console.log('  Player:     ' + analysis.player.height + 'px (' + analysis.player.percentOfViewport + '% of viewport)');
    console.log('  Track List: ' + analysis.trackList.visibleHeight + 'px (' + analysis.trackList.percentOfViewport + '% of viewport)');
    
    console.log('\n🎯 SUCCESS CRITERIA:');
    console.log('  ✓ Player < 30% of viewport:', analysis.player.percentOfViewport < 30 ? '✅ YES (' + analysis.player.percentOfViewport + '%)' : '❌ NO (' + analysis.player.percentOfViewport + '%)');
    console.log('  ✓ Track list > 60% of viewport:', analysis.trackList.percentOfViewport > 60 ? '✅ YES (' + analysis.trackList.percentOfViewport + '%)' : '❌ NO (' + analysis.trackList.percentOfViewport + '%)');
    console.log('  ✓ At least 3 tracks visible:', analysis.visibleTracks >= 3 ? '✅ YES (' + analysis.visibleTracks + ' tracks)' : '❌ NO (' + analysis.visibleTracks + ' tracks)');
    
    console.log('\n👁️ WHAT USER SEES:');
    console.log('  Visible tracks: ' + analysis.visibleTracks + ' / ' + analysis.totalTracks);
    console.log('  Player size: ' + analysis.player.percentOfViewport + '% of screen');
    console.log('  Track list size: ' + analysis.trackList.percentOfViewport + '% of screen');
    
    const allPassed = 
      parseFloat(analysis.player.percentOfViewport) < 30 &&
      parseFloat(analysis.trackList.percentOfViewport) > 60 &&
      analysis.visibleTracks >= 3;
    
    if (allPassed) {
      console.log('\n🎉 ALL SUCCESS CRITERIA MET!');
    } else {
      console.log('\n⚠️  Some criteria not met - needs adjustment');
    }
    
    await page.screenshot({ path: 'spotify-layout-initial.png' });
    console.log('\n📸 Screenshot saved: spotify-layout-initial.png');
    
    // Scroll to see more tracks
    const scrollableDiv = await page.locator('.fixed.top-\\[290px\\] .overflow-y-auto').first();
    await scrollableDiv.evaluate(el => el.scrollTop = 200);
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'spotify-layout-scrolled.png' });
    console.log('📸 Screenshot saved: spotify-layout-scrolled.png');
    
    console.log('\n' + '='.repeat(70));
    console.log('⏸️  Browser staying open for manual inspection (30 sec)...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testSpotifyLayout();

