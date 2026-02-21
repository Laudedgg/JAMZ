import { chromium } from 'playwright';

async function testContainerSizes() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Testing Container Sizes\n');
    console.log('='.repeat(70));
    
    await page.goto('https://jamz.fun/discover?_=' + Date.now(), { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(15000);
    
    const containerInfo = await page.evaluate(() => {
      const iframes = document.querySelectorAll('iframe[src*="youtube.com"]');
      if (iframes.length === 0) return { found: false };

      const allIframes = [];

      iframes.forEach((iframe, iframeIndex) => {
        const containers = [];
        let element = iframe;

        for (let i = 0; i < 10 && element; i++) {
          const rect = element.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(element);

          containers.push({
            level: i,
            tagName: element.tagName,
            className: element.className.substring(0, 60),
            width: rect.width,
            height: rect.height,
            offsetWidth: element.offsetWidth,
            offsetHeight: element.offsetHeight,
            clientWidth: element.clientWidth,
            clientHeight: element.clientHeight,
            display: computedStyle.display,
            position: computedStyle.position,
            top: computedStyle.top,
            left: computedStyle.left
          });

          element = element.parentElement;
        }

        allIframes.push({ iframeIndex, containers });
      });

      return { found: true, count: iframes.length, allIframes };
    });
    
    if (!containerInfo.found) {
      console.log('❌ No YouTube iframe found!');
    } else {
      console.log(`\n📊 Found ${containerInfo.count} YouTube iframe(s)\n`);

      containerInfo.allIframes.forEach(({ iframeIndex, containers }) => {
        console.log(`\n📦 IFRAME #${iframeIndex + 1} CONTAINER HIERARCHY (from iframe to root):\n`);
        containers.forEach(container => {
          console.log(`Level ${container.level}: <${container.tagName}>`);
          console.log(`  Class: "${container.className}..."`);
          console.log(`  BoundingRect: ${container.width}x${container.height}`);
          console.log(`  Offset: ${container.offsetWidth}x${container.offsetHeight}`);
          console.log(`  Client: ${container.clientWidth}x${container.clientHeight}`);
          console.log(`  Display: ${container.display}, Position: ${container.position}`);
          console.log(`  Top: ${container.top}, Left: ${container.left}`);
          console.log('');
        });
      });
    }
    
    await page.screenshot({ path: 'container-sizes.png', fullPage: false });
    console.log('📸 Screenshot saved: container-sizes.png');
    
    console.log('\n' + '='.repeat(70));
    console.log('⏸️  Browser staying open for manual inspection (30 sec)...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testContainerSizes();

