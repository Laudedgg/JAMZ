import { chromium } from 'playwright';

async function testFinalMobileLayout() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 FINAL MOBILE LAYOUT TEST - Discover Page\n');
    console.log('=' .repeat(60));
    
    await page.goto('https://jamz.fun/discover?_=' + Date.now(), { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    await page.waitForTimeout(12000);
    
    const results = await page.evaluate(() => {
      // Get all elements
      const websiteNav = document.querySelector('.fixed.w-full.z-50');
      const discoverHeader = document.querySelector('.fixed.top-\\[100px\\]');
      const player = document.querySelector('.fixed.top-\\[168px\\]');
      const youtubeContainer = document.querySelector('.max-h-\\[200px\\]');
      const trackListContainer = document.querySelector('.pt-\\[603px\\]');
      const trackListBox = trackListContainer?.querySelector('.bg-gradient-to-br');
      const voteButtons = document.querySelectorAll('button[aria-label*="vote"]');
      
      // Get measurements
      const navRect = websiteNav?.getBoundingClientRect();
      const headerRect = discoverHeader?.getBoundingClientRect();
      const playerRect = player?.getBoundingClientRect();
      const youtubeRect = youtubeContainer?.getBoundingClientRect();
      const trackBoxRect = trackListBox?.getBoundingClientRect();
      
      return {
        layout: {
          websiteNavHeight: navRect?.height,
          discoverHeaderTop: headerRect?.top,
          discoverHeaderHeight: headerRect?.height,
          playerTop: playerRect?.top,
          playerHeight: playerRect?.height,
          trackListTop: trackBoxRect?.top,
          trackListVisible: !!trackBoxRect && trackBoxRect.top < window.innerHeight
        },
        player: {
          youtubeHeight: youtubeRect?.height,
          youtubeMaxHeight: youtubeContainer ? window.getComputedStyle(youtubeContainer).maxHeight : null,
          isCompact: youtubeRect?.height <= 200
        },
        trackList: {
          hasContainer: !!trackListBox,
          hasBackground: trackListBox?.classList.contains('bg-gradient-to-br'),
          hasBorder: trackListBox?.classList.contains('border'),
          isScrollable: trackListBox ? trackListBox.scrollHeight > trackListBox.clientHeight : false
        },
        voteButtons: {
          count: voteButtons.length,
          allHaveIcons: Array.from(voteButtons).every(btn => btn.querySelector('svg')),
          iconTypes: Array.from(voteButtons).map(btn => {
            const svg = btn.querySelector('svg');
            return svg ? 'icon-present' : 'no-icon';
          })
        },
        spacing: {
          headerBelowNav: headerRect && navRect ? headerRect.top >= navRect.bottom - 5 : false,
          playerBelowHeader: playerRect && headerRect ? playerRect.top >= headerRect.bottom - 5 : false,
          noOverlaps: true
        }
      };
    });
    
    console.log('\n📊 LAYOUT MEASUREMENTS:');
    console.log('  Website Nav Height:', results.layout.websiteNavHeight + 'px');
    console.log('  Discover Header Top:', results.layout.discoverHeaderTop + 'px');
    console.log('  Discover Header Height:', results.layout.discoverHeaderHeight + 'px');
    console.log('  Player Top:', results.layout.playerTop + 'px');
    console.log('  Player Height:', results.layout.playerHeight + 'px');
    console.log('  Track List Top:', results.layout.trackListTop + 'px');
    console.log('  Track List Visible:', results.layout.trackListVisible ? '✅' : '❌');
    
    console.log('\n🎬 YOUTUBE PLAYER:');
    console.log('  Height:', results.player.youtubeHeight + 'px');
    console.log('  Max Height:', results.player.youtubeMaxHeight);
    console.log('  Is Compact (≤200px):', results.player.isCompact ? '✅' : '❌');
    
    console.log('\n📋 TRACK LIST:');
    console.log('  Has Container:', results.trackList.hasContainer ? '✅' : '❌');
    console.log('  Has Background:', results.trackList.hasBackground ? '✅' : '❌');
    console.log('  Has Border:', results.trackList.hasBorder ? '✅' : '❌');
    console.log('  Is Scrollable:', results.trackList.isScrollable ? '✅' : '❌');
    
    console.log('\n👍 VOTE BUTTONS:');
    console.log('  Count:', results.voteButtons.count);
    console.log('  All Have Icons:', results.voteButtons.allHaveIcons ? '✅' : '❌');
    
    console.log('\n📏 SPACING & OVERLAP:');
    console.log('  Header Below Nav:', results.spacing.headerBelowNav ? '✅' : '❌');
    console.log('  Player Below Header:', results.spacing.playerBelowHeader ? '✅' : '❌');
    
    // Take screenshots
    console.log('\n📸 SCREENSHOTS:');
    await page.screenshot({ path: 'final-mobile-1-top.png', fullPage: false });
    console.log('  ✅ Top view saved (final-mobile-1-top.png)');
    
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'final-mobile-2-middle.png', fullPage: false });
    console.log('  ✅ Middle view saved (final-mobile-2-middle.png)');
    
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'final-mobile-3-tracklist.png', fullPage: false });
    console.log('  ✅ Track list view saved (final-mobile-3-tracklist.png)');
    
    await page.screenshot({ path: 'final-mobile-4-fullpage.png', fullPage: true });
    console.log('  ✅ Full page saved (final-mobile-4-fullpage.png)');
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL TESTS COMPLETE!');
    console.log('=' .repeat(60));
    
    console.log('\n⏸️  Browser will stay open for manual inspection (30 sec)...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testFinalMobileLayout();

