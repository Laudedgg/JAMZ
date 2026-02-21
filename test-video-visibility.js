import { chromium } from 'playwright';

async function testVideoVisibility() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Testing YouTube Video Visibility\n');
    console.log('=' .repeat(70));
    
    await page.goto('https://jamz.fun/discover?_=' + Date.now(), { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(12000);
    
    const analysis = await page.evaluate(() => {
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      const nav = document.querySelector('.fixed.w-full.z-50');
      const header = document.querySelector('.fixed.top-\\[100px\\]');
      const player = document.querySelector('.fixed.top-\\[168px\\]');
      const trackList = document.querySelector('.fixed.top-\\[450px\\]');
      const trackItems = document.querySelectorAll('.fixed.top-\\[450px\\] .group');
      
      // Find YouTube iframe
      const youtubeIframe = document.querySelector('iframe[src*="youtube.com"]');
      
      const navRect = nav?.getBoundingClientRect();
      const headerRect = header?.getBoundingClientRect();
      const playerRect = player?.getBoundingClientRect();
      const trackListRect = trackList?.getBoundingClientRect();
      const iframeRect = youtubeIframe?.getBoundingClientRect();
      
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
        youtubeIframe: {
          found: !!youtubeIframe,
          width: iframeRect?.width,
          height: iframeRect?.height,
          visible: iframeRect ? (iframeRect.width > 0 && iframeRect.height > 0) : false,
          src: youtubeIframe?.src || 'Not found'
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
    
    console.log('\n🎥 YOUTUBE VIDEO STATUS:');
    console.log('  Found:', analysis.youtubeIframe.found ? '✅ YES' : '❌ NO');
    console.log('  Visible:', analysis.youtubeIframe.visible ? '✅ YES' : '❌ NO');
    console.log('  Size:', analysis.youtubeIframe.width + 'x' + analysis.youtubeIframe.height);
    console.log('  Aspect Ratio:', analysis.youtubeIframe.width && analysis.youtubeIframe.height ? 
      (analysis.youtubeIframe.width / analysis.youtubeIframe.height).toFixed(2) + ':1 (16:9 = 1.78:1)' : 'N/A');
    
    console.log('\n🎯 SUCCESS CRITERIA:');
    console.log('  ✓ YouTube video visible:', analysis.youtubeIframe.visible ? '✅ YES' : '❌ NO');
    console.log('  ✓ Video size > 200px wide:', analysis.youtubeIframe.width > 200 ? '✅ YES (' + analysis.youtubeIframe.width + 'px)' : '❌ NO (' + analysis.youtubeIframe.width + 'px)');
    console.log('  ✓ At least 3 tracks visible:', analysis.visibleTracks >= 3 ? '✅ YES (' + analysis.visibleTracks + ' tracks)' : '❌ NO (' + analysis.visibleTracks + ' tracks)');
    
    console.log('\n👁️ WHAT USER SEES:');
    console.log('  YouTube player: ' + analysis.youtubeIframe.width + 'x' + analysis.youtubeIframe.height + ' (' + analysis.player.percentOfViewport + '% of screen)');
    console.log('  Visible tracks: ' + analysis.visibleTracks + ' / ' + analysis.totalTracks);
    console.log('  Track list size: ' + analysis.trackList.percentOfViewport + '% of screen');
    
    await page.screenshot({ path: 'video-visibility-initial.png', fullPage: false });
    console.log('\n📸 Screenshot saved: video-visibility-initial.png');
    
    // Scroll track list
    const scrollableDiv = await page.locator('.fixed.top-\\[450px\\] .overflow-y-auto').first();
    await scrollableDiv.evaluate(el => el.scrollTop = 200);
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'video-visibility-scrolled.png', fullPage: false });
    console.log('📸 Screenshot saved: video-visibility-scrolled.png');
    
    console.log('\n' + '='.repeat(70));
    console.log('⏸️  Browser staying open for manual inspection (30 sec)...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testVideoVisibility();

