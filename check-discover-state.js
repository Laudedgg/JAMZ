import { chromium } from 'playwright';

async function checkDiscoverState() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  
  const page = await context.newPage();
  
  try {
    await context.clearCookies();
    await page.goto('https://jamz.fun/discover?_=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Wait for tracks to load
    console.log('⏳ Waiting for tracks to load...');
    await page.waitForTimeout(15000); // Wait even longer
    
    // Check page state
    const state = await page.evaluate(() => {
      return {
        url: window.location.href,
        hasTrackList: !!document.querySelector('[class*="space-y-2"]'),
        trackCount: document.querySelectorAll('[class*="track"]').length,
        hasPlayButton: !!document.querySelector('button[aria-label*="Play"]') || !!document.querySelector('button[aria-label*="Pause"]'),
        bodyText: document.body.innerText.substring(0, 500),
        // Look for the Now Playing Card specifically
        nowPlayingElements: Array.from(document.querySelectorAll('*')).filter(el => 
          el.textContent && el.textContent.includes('Now Playing')
        ).length,
        // Check if there's a YouTube iframe
        hasYouTubeIframe: !!document.querySelector('iframe[src*="youtube"]'),
        // Check for loading states
        hasLoadingSpinner: !!document.querySelector('[class*="animate-spin"]'),
        // Get all button aria-labels
        buttonLabels: Array.from(document.querySelectorAll('button[aria-label]')).map(btn => btn.getAttribute('aria-label'))
      };
    });
    
    console.log('📊 Discover Page State:');
    console.log(JSON.stringify(state, null, 2));
    
    // Take screenshot
    await page.screenshot({ path: 'discover-state.png', fullPage: false });
    console.log('\n📸 Screenshot saved: discover-state.png');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

checkDiscoverState();

