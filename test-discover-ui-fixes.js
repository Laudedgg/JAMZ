import { chromium } from 'playwright';

async function testDiscoverUIFixes() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    hasTouch: true,
    isMobile: true
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Testing Discover Page UI Fixes\n');
    console.log('='.repeat(70));
    
    // Clear cache
    await context.clearCookies();
    
    await page.goto('http://localhost:3000/discover', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(5000);
    
    // Test 1: Check Container Alignment
    console.log('\n📐 Test 1: Container Edge Alignment');
    const alignment = await page.evaluate(() => {
      // Find the YouTube player container by looking for elements with specific height
      const allDivs = Array.from(document.querySelectorAll('div'));
      const youtubeContainer = allDivs.find(div => {
        const style = window.getComputedStyle(div);
        return style.height === '220px' && div.className.includes('rounded');
      });

      // Find the track list container (look for the one with rounded-t-2xl)
      const trackListContainer = allDivs.find(div =>
        div.className.includes('rounded-t-2xl') && div.className.includes('bg-gradient')
      );

      if (!youtubeContainer || !trackListContainer) {
        return {
          found: false,
          debug: {
            hasYoutube: !!youtubeContainer,
            hasTrackList: !!trackListContainer,
            totalDivs: allDivs.length
          }
        };
      }

      const youtubeRect = youtubeContainer.getBoundingClientRect();
      const trackListRect = trackListContainer.getBoundingClientRect();

      const leftAligned = Math.abs(youtubeRect.left - trackListRect.left) < 2;
      const rightAligned = Math.abs(youtubeRect.right - trackListRect.right) < 2;

      return {
        found: true,
        youtube: { left: Math.round(youtubeRect.left), right: Math.round(youtubeRect.right), width: Math.round(youtubeRect.width) },
        trackList: { left: Math.round(trackListRect.left), right: Math.round(trackListRect.right), width: Math.round(trackListRect.width) },
        leftAligned,
        rightAligned,
        aligned: leftAligned && rightAligned
      };
    });
    
    if (alignment.found) {
      console.log('  YouTube Player:', alignment.youtube);
      console.log('  Track List:', alignment.trackList);
      console.log(`  Left edges aligned: ${alignment.leftAligned ? '✓' : '✗'}`);
      console.log(`  Right edges aligned: ${alignment.rightAligned ? '✓' : '✗'}`);
      console.log(`  ✅ ${alignment.aligned ? 'PASS' : 'FAIL'}`);
    } else {
      console.log('  ✗ Containers not found');
      if (alignment.debug) {
        console.log('  Debug:', alignment.debug);
      }
    }
    
    // Test 2: Check for Duplicate Controls
    console.log('\n🎮 Test 2: No Duplicate Player Controls in NowPlayingCard');
    const duplicateControls = await page.evaluate(() => {
      // Find the YouTube player container by height
      const allDivs = Array.from(document.querySelectorAll('div'));
      const youtubeContainer = allDivs.find(div => {
        const style = window.getComputedStyle(div);
        return style.height === '220px' && div.className.includes('rounded');
      });

      if (!youtubeContainer) return { found: false, reason: 'No YouTube container' };

      // Get the parent container (should be the NowPlayingCard area)
      let nowPlayingCard = youtubeContainer.parentElement;
      while (nowPlayingCard && !nowPlayingCard.className.includes('fixed')) {
        nowPlayingCard = nowPlayingCard.parentElement;
      }

      if (!nowPlayingCard) return { found: false, reason: 'No parent container' };

      // Look for play/pause buttons within the NowPlayingCard
      const allButtons = nowPlayingCard.querySelectorAll('button');
      const playButtons = Array.from(allButtons).filter(btn =>
        btn.getAttribute('aria-label')?.toLowerCase().includes('play') ||
        btn.getAttribute('aria-label')?.toLowerCase().includes('pause')
      );
      const prevButtons = Array.from(allButtons).filter(btn =>
        btn.getAttribute('aria-label')?.toLowerCase().includes('previous')
      );
      const nextButtons = Array.from(allButtons).filter(btn =>
        btn.getAttribute('aria-label')?.toLowerCase().includes('next')
      );

      // Check for track info (title/artist) in NowPlayingCard - should NOT be there
      const trackTitles = nowPlayingCard.querySelectorAll('h2, h3');
      const hasTrackInfo = Array.from(trackTitles).some(el => el.textContent.trim().length > 0);

      return {
        found: true,
        playButtonCount: playButtons.length,
        prevButtonCount: prevButtons.length,
        nextButtonCount: nextButtons.length,
        totalButtons: allButtons.length,
        hasTrackInfo,
        noDuplicates: playButtons.length === 0 && prevButtons.length === 0 && nextButtons.length === 0 && !hasTrackInfo
      };
    });
    
    if (duplicateControls.found) {
      console.log(`  Total buttons in NowPlayingCard: ${duplicateControls.totalButtons}`);
      console.log(`  Play/Pause buttons in NowPlayingCard: ${duplicateControls.playButtonCount}`);
      console.log(`  Previous buttons in NowPlayingCard: ${duplicateControls.prevButtonCount}`);
      console.log(`  Next buttons in NowPlayingCard: ${duplicateControls.nextButtonCount}`);
      console.log(`  Track info in NowPlayingCard: ${duplicateControls.hasTrackInfo ? 'Yes' : 'No'}`);
      console.log(`  ✅ ${duplicateControls.noDuplicates ? 'PASS - No duplicates' : 'FAIL - Duplicates found'}`);
    } else {
      console.log(`  ✗ NowPlayingCard not found: ${duplicateControls.reason || 'Unknown'}`);
    }
    
    // Test 3: Verify Bottom Player Still Works
    console.log('\n🎵 Test 3: Bottom Mobile Player Controls Present');
    const bottomPlayer = await page.evaluate(() => {
      const bottomNav = document.querySelector('.fixed.bottom-0');
      if (!bottomNav) return { found: false };
      
      const playButton = bottomNav.querySelector('button[aria-label*="Play"], button[aria-label*="Pause"]');
      const prevButton = bottomNav.querySelector('button[aria-label*="Previous"]');
      const nextButton = bottomNav.querySelector('button[aria-label*="Next"]');
      
      return {
        found: true,
        hasPlayButton: !!playButton,
        hasPrevButton: !!prevButton,
        hasNextButton: !!nextButton,
        allPresent: !!playButton && !!prevButton && !!nextButton
      };
    });
    
    if (bottomPlayer.found) {
      console.log(`  Play/Pause button: ${bottomPlayer.hasPlayButton ? '✓' : '✗'}`);
      console.log(`  Previous button: ${bottomPlayer.hasPrevButton ? '✓' : '✗'}`);
      console.log(`  Next button: ${bottomPlayer.hasNextButton ? '✓' : '✗'}`);
      console.log(`  ✅ ${bottomPlayer.allPresent ? 'PASS' : 'FAIL'}`);
    } else {
      console.log('  ✗ Bottom player not found');
    }
    
    await page.screenshot({ path: 'discover-ui-fixes.png', fullPage: false });
    console.log('\n📸 Screenshot saved: discover-ui-fixes.png');
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ All tests completed!');
    console.log('⏸️  Browser staying open for manual inspection (30 sec)...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testDiscoverUIFixes();

