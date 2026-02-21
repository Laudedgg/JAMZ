import { chromium } from 'playwright';

async function testProps() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Testing Props\n');
    console.log('='.repeat(70));
    
    await page.goto('https://jamz.fun/discover?_=' + Date.now(), { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(15000);
    
    // Inject a script to log props
    const propsInfo = await page.evaluate(() => {
      // Find all YouTubeTrackPlayer components
      const youtubeContainers = document.querySelectorAll('[class*="YouTubeTrackPlayer"], [class*="youtube"]');
      
      // Check if there are any images (fallback) in the player containers
      const mobileContainer = document.querySelector('.md\\:hidden.flex.flex-col.gap-2.p-3 .w-full.h-\\[220px\\]');
      const desktopContainer = document.querySelector('.hidden.md\\:block .relative.aspect-square');
      
      return {
        youtubeContainers: youtubeContainers.length,
        mobileContainer: {
          exists: !!mobileContainer,
          hasImage: mobileContainer ? !!mobileContainer.querySelector('img') : false,
          hasIframe: mobileContainer ? !!mobileContainer.querySelector('iframe') : false,
          innerHTML: mobileContainer ? mobileContainer.innerHTML.substring(0, 200) : null
        },
        desktopContainer: {
          exists: !!desktopContainer,
          hasImage: desktopContainer ? !!desktopContainer.querySelector('img') : false,
          hasIframe: desktopContainer ? !!desktopContainer.querySelector('iframe') : false,
          innerHTML: desktopContainer ? desktopContainer.innerHTML.substring(0, 200) : null
        }
      };
    });
    
    console.log('\n📊 CONTAINER INFO:');
    console.log('\nMobile container:');
    console.log(`  Exists: ${propsInfo.mobileContainer.exists}`);
    console.log(`  Has image: ${propsInfo.mobileContainer.hasImage}`);
    console.log(`  Has iframe: ${propsInfo.mobileContainer.hasIframe}`);
    console.log(`  HTML: ${propsInfo.mobileContainer.innerHTML}`);
    
    console.log('\nDesktop container:');
    console.log(`  Exists: ${propsInfo.desktopContainer.exists}`);
    console.log(`  Has image: ${propsInfo.desktopContainer.hasImage}`);
    console.log(`  Has iframe: ${propsInfo.desktopContainer.hasIframe}`);
    console.log(`  HTML: ${propsInfo.desktopContainer.innerHTML}`);
    
    await page.screenshot({ path: 'props.png', fullPage: false });
    console.log('\n📸 Screenshot saved: props.png');
    
    console.log('\n' + '='.repeat(70));
    console.log('⏸️  Browser staying open for manual inspection (30 sec)...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testProps();

