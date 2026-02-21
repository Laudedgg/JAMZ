import { chromium } from 'playwright';

async function testDiscoverMobileFixes() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
    hasTouch: true,
    isMobile: true
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Testing Discover Page Mobile Fixes\n');
    console.log('='.repeat(70));
    
    // Clear cache and cookies before loading
    await context.clearCookies();

    await page.goto('https://jamz.fun/discover?cachebust=' + Date.now(), {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(8000);
    
    // Test 1: Count Login Buttons (only visible ones)
    console.log('\n🔍 Test 1: Login Button Count (Visible Only)');
    const loginButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const loginBtns = buttons.filter(btn => {
        const text = btn.textContent || '';
        const isLoginButton = text.includes('Login') || text.includes('Connect') || text.includes('Disconnect');
        if (!isLoginButton) return false;

        // Check if button is visible
        const rect = btn.getBoundingClientRect();
        const style = window.getComputedStyle(btn);
        const isVisible = rect.width > 0 &&
                         rect.height > 0 &&
                         style.display !== 'none' &&
                         style.visibility !== 'hidden' &&
                         style.opacity !== '0';

        return isVisible;
      });
      return {
        count: loginBtns.length,
        texts: loginBtns.map(btn => btn.textContent?.trim()),
        details: loginBtns.map(btn => ({
          text: btn.textContent?.trim(),
          visible: btn.offsetHeight > 0,
          parent: btn.parentElement?.className
        }))
      };
    });
    
    console.log(`  Visible login buttons found: ${loginButtons.count}`);
    console.log(`  Button texts: ${loginButtons.texts.join(', ')}`);
    console.log(`  Button details:`, loginButtons.details);
    console.log(`  ✅ Expected: 1, Got: ${loginButtons.count} - ${loginButtons.count === 1 ? 'PASS' : 'FAIL'}`);
    
    // Test 2: Check Element Positioning
    console.log('\n📐 Test 2: Element Positioning');
    const positions = await page.evaluate(() => {
      const websiteNav = document.querySelector('.fixed.w-full.z-50');
      const discoverHeader = document.querySelector('.fixed.top-\\[80px\\]');
      const nowPlayingCard = document.querySelector('.fixed.top-\\[136px\\]');
      const trackListContainer = document.querySelector('.fixed.top-\\[446px\\]');
      
      return {
        websiteNav: websiteNav ? {
          top: websiteNav.getBoundingClientRect().top,
          height: websiteNav.getBoundingClientRect().height,
          visible: websiteNav.offsetHeight > 0
        } : null,
        discoverHeader: discoverHeader ? {
          top: discoverHeader.getBoundingClientRect().top,
          height: discoverHeader.getBoundingClientRect().height,
          visible: discoverHeader.offsetHeight > 0
        } : null,
        nowPlayingCard: nowPlayingCard ? {
          top: nowPlayingCard.getBoundingClientRect().top,
          height: nowPlayingCard.getBoundingClientRect().height,
          visible: nowPlayingCard.offsetHeight > 0
        } : null,
        trackListContainer: trackListContainer ? {
          top: trackListContainer.getBoundingClientRect().top,
          height: trackListContainer.getBoundingClientRect().height,
          visible: trackListContainer.offsetHeight > 0
        } : null
      };
    });
    
    console.log('  WebsiteNav:', positions.websiteNav);
    console.log('  DiscoverHeader:', positions.discoverHeader);
    console.log('  NowPlayingCard:', positions.nowPlayingCard);
    console.log('  TrackListContainer:', positions.trackListContainer);
    
    // Test 3: Check Track List Header Visibility
    console.log('\n📋 Test 3: Track List Header Visibility');
    const trackListHeader = await page.evaluate(() => {
      const header = document.querySelector('.discover-tracklist-header');
      if (!header) {
        // Fallback: look for "Queue" text
        const allElements = Array.from(document.querySelectorAll('*'));
        const queueElement = allElements.find(el => 
          el.textContent?.includes('Queue') && el.textContent?.includes('tracks')
        );
        
        if (queueElement) {
          const rect = queueElement.getBoundingClientRect();
          return {
            found: true,
            text: queueElement.textContent?.trim(),
            visible: rect.top >= 0 && rect.bottom <= window.innerHeight,
            position: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
          };
        }
        return { found: false };
      }
      
      const rect = header.getBoundingClientRect();
      return {
        found: true,
        text: header.textContent?.trim(),
        visible: rect.top >= 0 && rect.bottom <= window.innerHeight,
        position: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
      };
    });
    
    console.log('  Header found:', trackListHeader.found);
    console.log('  Header text:', trackListHeader.text);
    console.log('  Header visible:', trackListHeader.visible);
    console.log('  Header position:', trackListHeader.position);
    console.log(`  ✅ ${trackListHeader.found && trackListHeader.visible ? 'PASS' : 'FAIL'}`);
    
    // Test 4: Check for Proper Stacking (elements should be vertically stacked)
    console.log('\n🔄 Test 4: Check for Proper Vertical Stacking');
    const stacking = await page.evaluate(() => {
      const elements = [
        { name: 'WebsiteNav', selector: '.fixed.w-full.z-50', expectedTop: 0 },
        { name: 'DiscoverHeader', selector: '.fixed.top-\\[80px\\]', expectedTop: 80 },
        { name: 'NowPlayingCard', selector: '.fixed.top-\\[136px\\]', expectedTop: 136 },
        { name: 'TrackListContainer', selector: '.fixed.top-\\[446px\\]', expectedTop: 446 }
      ];

      const results = elements.map(el => {
        const elem = document.querySelector(el.selector);
        if (!elem) return null;

        const rect = elem.getBoundingClientRect();
        const topMatches = Math.abs(rect.top - el.expectedTop) < 5; // Allow 5px tolerance

        return {
          name: el.name,
          expectedTop: el.expectedTop,
          actualTop: Math.round(rect.top),
          height: Math.round(rect.height),
          bottom: Math.round(rect.bottom),
          correct: topMatches
        };
      }).filter(Boolean);

      // Check if elements are properly stacked (each element's bottom should be at or before next element's top)
      let properlyStacked = true;
      for (let i = 0; i < results.length - 1; i++) {
        const current = results[i];
        const next = results[i + 1];
        // Allow some overlap for fixed stacked layout (up to 10px)
        if (current.bottom > next.actualTop + 10) {
          properlyStacked = false;
          break;
        }
      }

      return {
        elements: results,
        allCorrectPositions: results.every(r => r.correct),
        properlyStacked
      };
    });

    console.log('  Element positions:');
    stacking.elements.forEach(el => {
      console.log(`    ${el.name}: top=${el.actualTop} (expected ${el.expectedTop}), height=${el.height}, bottom=${el.bottom} ${el.correct ? '✓' : '✗'}`);
    });
    console.log(`  All positions correct: ${stacking.allCorrectPositions ? 'Yes' : 'No'}`);
    console.log(`  Properly stacked: ${stacking.properlyStacked ? 'Yes' : 'No'}`);
    console.log(`  ✅ ${stacking.allCorrectPositions ? 'PASS' : 'FAIL'}`);
    
    await page.screenshot({ path: 'discover-mobile-fixes.png', fullPage: false });
    console.log('\n📸 Screenshot saved: discover-mobile-fixes.png');
    
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

testDiscoverMobileFixes();

