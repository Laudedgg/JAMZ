import { chromium } from 'playwright';

async function testMobileDesktopVisibility() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Testing Mobile/Desktop Visibility\n');
    console.log('='.repeat(70));
    
    await page.goto('https://jamz.fun/discover?_=' + Date.now(), { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(15000);
    
    const visibility = await page.evaluate(() => {
      // Find all containers with md:hidden or hidden md:block
      const mobileContainers = Array.from(document.querySelectorAll('[class*="md:hidden"]'));
      const desktopContainers = Array.from(document.querySelectorAll('[class*="hidden md:block"]'));
      
      return {
        mobileContainers: mobileContainers.map(el => ({
          className: el.className,
          tagName: el.tagName,
          isVisible: window.getComputedStyle(el).display !== 'none',
          display: window.getComputedStyle(el).display,
          hasYouTubePlayer: el.querySelector('[class*="YouTubeTrackPlayer"]') !== null || el.innerHTML.includes('youtube')
        })),
        desktopContainers: desktopContainers.map(el => ({
          className: el.className,
          tagName: el.tagName,
          isVisible: window.getComputedStyle(el).display !== 'none',
          display: window.getComputedStyle(el).display,
          hasYouTubePlayer: el.querySelector('[class*="YouTubeTrackPlayer"]') !== null || el.innerHTML.includes('youtube')
        }))
      };
    });
    
    console.log('\n📱 MOBILE CONTAINERS (md:hidden - should be VISIBLE on mobile):');
    visibility.mobileContainers.forEach((container, index) => {
      console.log(`\n  Container #${index + 1}:`);
      console.log(`    Tag: ${container.tagName}`);
      console.log(`    Class: ${container.className.substring(0, 100)}...`);
      console.log(`    Visible: ${container.isVisible ? '✅ YES' : '❌ NO'}`);
      console.log(`    Display: ${container.display}`);
      console.log(`    Has YouTube: ${container.hasYouTubePlayer ? '✅ YES' : '❌ NO'}`);
    });
    
    console.log('\n💻 DESKTOP CONTAINERS (hidden md:block - should be HIDDEN on mobile):');
    visibility.desktopContainers.forEach((container, index) => {
      console.log(`\n  Container #${index + 1}:`);
      console.log(`    Tag: ${container.tagName}`);
      console.log(`    Class: ${container.className.substring(0, 100)}...`);
      console.log(`    Visible: ${container.isVisible ? '❌ SHOULD BE HIDDEN' : '✅ CORRECTLY HIDDEN'}`);
      console.log(`    Display: ${container.display}`);
      console.log(`    Has YouTube: ${container.hasYouTubePlayer ? '✅ YES' : '❌ NO'}`);
    });
    
    await page.screenshot({ path: 'mobile-desktop-visibility.png', fullPage: false });
    console.log('\n📸 Screenshot saved: mobile-desktop-visibility.png');
    
    console.log('\n' + '='.repeat(70));
    console.log('⏸️  Browser staying open for manual inspection (30 sec)...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testMobileDesktopVisibility();

