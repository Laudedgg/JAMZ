import { chromium } from 'playwright';

async function checkActualPage() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  
  const page = await context.newPage();
  
  try {
    await context.clearCookies();
    await page.goto('https://jamz.fun/discover?_=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(10000); // Wait longer
    
    // Get the full HTML of the main content area
    const pageInfo = await page.evaluate(() => {
      // Find all divs with gradient backgrounds (likely the player cards)
      const gradientDivs = Array.from(document.querySelectorAll('[class*="gradient"]'));
      
      return {
        totalGradientDivs: gradientDivs.length,
        firstFewClasses: gradientDivs.slice(0, 3).map(div => ({
          className: div.className,
          innerHTML: div.innerHTML.substring(0, 300)
        })),
        // Check for the specific Now Playing Card structure
        hasNowPlayingCard: !!document.querySelector('[class*="bg-gradient-to-br from-gray-900/80"]'),
        // Check for aspect-square
        hasAspectSquare: !!document.querySelector('[class*="aspect-square"]'),
        // Check for max-h-[280px]
        hasMaxHeight280: !!document.querySelector('[class*="max-h-"]'),
        // Get all max-h classes
        allMaxHeightClasses: Array.from(document.querySelectorAll('[class*="max-h-"]')).map(el => el.className)
      };
    });
    
    console.log('📊 Page Structure:');
    console.log(JSON.stringify(pageInfo, null, 2));
    
    // Take screenshot
    await page.screenshot({ path: 'actual-page-check.png', fullPage: true });
    console.log('\n📸 Full page screenshot saved: actual-page-check.png');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

checkActualPage();

