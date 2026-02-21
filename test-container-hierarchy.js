import { chromium } from 'playwright';

async function testContainerHierarchy() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Testing Container Hierarchy\n');
    console.log('='.repeat(70));
    
    await page.goto('https://jamz.fun/discover?_=' + Date.now(), { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(15000);
    
    const hierarchy = await page.evaluate(() => {
      const iframe = document.querySelector('iframe[src*="youtube.com"]');
      if (!iframe) return { error: 'No YouTube iframe found' };
      
      const getElementInfo = (el, label) => {
        if (!el) return { label, exists: false };
        return {
          label,
          exists: true,
          tagName: el.tagName,
          className: el.className,
          width: el.offsetWidth,
          height: el.offsetHeight,
          clientWidth: el.clientWidth,
          clientHeight: el.clientHeight,
          scrollWidth: el.scrollWidth,
          scrollHeight: el.scrollHeight,
          computedStyle: {
            width: window.getComputedStyle(el).width,
            height: window.getComputedStyle(el).height,
            display: window.getComputedStyle(el).display,
            position: window.getComputedStyle(el).position
          }
        };
      };
      
      const parent1 = iframe.parentElement;
      const parent2 = parent1?.parentElement;
      const parent3 = parent2?.parentElement;
      const parent4 = parent3?.parentElement;
      const parent5 = parent4?.parentElement;
      
      return {
        iframe: getElementInfo(iframe, 'YouTube iframe'),
        parent1: getElementInfo(parent1, 'Parent 1 (containerRef)'),
        parent2: getElementInfo(parent2, 'Parent 2 (motion.div)'),
        parent3: getElementInfo(parent3, 'Parent 3 (NowPlayingCard container)'),
        parent4: getElementInfo(parent4, 'Parent 4'),
        parent5: getElementInfo(parent5, 'Parent 5')
      };
    });
    
    if (hierarchy.error) {
      console.log('❌', hierarchy.error);
    } else {
      console.log('\n📊 CONTAINER HIERARCHY (from iframe up to root):\n');
      
      const printElement = (info) => {
        console.log(`${info.label}:`);
        console.log(`  Tag: ${info.tagName}`);
        console.log(`  Class: ${info.className}`);
        console.log(`  Dimensions: ${info.width}x${info.height}`);
        console.log(`  Client: ${info.clientWidth}x${info.clientHeight}`);
        console.log(`  Scroll: ${info.scrollWidth}x${info.scrollHeight}`);
        console.log(`  Computed width: ${info.computedStyle.width}`);
        console.log(`  Computed height: ${info.computedStyle.height}`);
        console.log(`  Display: ${info.computedStyle.display}`);
        console.log(`  Position: ${info.computedStyle.position}`);
        console.log('');
      };
      
      printElement(hierarchy.iframe);
      printElement(hierarchy.parent1);
      printElement(hierarchy.parent2);
      printElement(hierarchy.parent3);
      if (hierarchy.parent4.exists) printElement(hierarchy.parent4);
      if (hierarchy.parent5.exists) printElement(hierarchy.parent5);
    }
    
    await page.screenshot({ path: 'container-hierarchy.png', fullPage: false });
    console.log('📸 Screenshot saved: container-hierarchy.png');
    
    console.log('\n' + '='.repeat(70));
    console.log('⏸️  Browser staying open for manual inspection (30 sec)...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testContainerHierarchy();

