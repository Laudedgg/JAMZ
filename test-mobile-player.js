import { chromium } from 'playwright';

async function testMobilePlayer() {
  const browser = await chromium.launch({ headless: false }); // Non-headless to see what's happening
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Loading Discover page...');
    await page.goto('https://jamz.fun/discover', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(10000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'mobile-1-initial.png' });
    console.log('📸 Initial screenshot saved');
    
    // Check if YouTube player container exists and get its dimensions
    const playerDimensions = await page.evaluate(() => {
      // Find the YouTube player container
      const ytContainers = Array.from(document.querySelectorAll('[class*="aspect-"]'));
      if (ytContainers.length === 0) return { error: 'No aspect containers found' };
      
      const container = ytContainers[0];
      const styles = window.getComputedStyle(container);
      
      return {
        className: container.className,
        height: styles.height,
        maxHeight: styles.maxHeight,
        width: styles.width,
        hasMaxHeightClass: container.className.includes('max-h-'),
        allClasses: container.className.split(' ')
      };
    });
    
    console.log('\n🎬 YouTube Player Container:');
    console.log(JSON.stringify(playerDimensions, null, 2));
    
    // Wait for user to inspect
    console.log('\n✅ Check the browser window to see the mobile view');
    console.log('⏸️  Press Ctrl+C when done...');
    await page.waitForTimeout(120000); // Wait 2 minutes
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testMobilePlayer();

