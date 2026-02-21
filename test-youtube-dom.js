import { chromium } from 'playwright';

async function testYouTubeDOM() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  // Listen to console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (text.includes('YouTube') || text.includes('player') || text.includes('iframe')) {
      console.log(`[BROWSER ${type.toUpperCase()}]:`, text);
    }
  });
  
  try {
    console.log('📱 Testing YouTube DOM Structure\n');
    console.log('=' .repeat(70));
    
    await page.goto('https://jamz.fun/discover?_=' + Date.now(), { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(15000);
    
    const domAnalysis = await page.evaluate(() => {
      // Find all YouTube-related elements
      const youtubeIframes = Array.from(document.querySelectorAll('iframe[src*="youtube.com"]'));
      const playerContainers = Array.from(document.querySelectorAll('[class*="YouTubeTrackPlayer"]'));
      const allIframes = Array.from(document.querySelectorAll('iframe'));
      
      return {
        youtubeIframes: youtubeIframes.map(iframe => ({
          src: iframe.src,
          width: iframe.offsetWidth,
          height: iframe.offsetHeight,
          clientWidth: iframe.clientWidth,
          clientHeight: iframe.clientHeight,
          style: {
            width: iframe.style.width,
            height: iframe.style.height,
            display: iframe.style.display,
            position: iframe.style.position
          },
          parent: {
            className: iframe.parentElement?.className,
            width: iframe.parentElement?.offsetWidth,
            height: iframe.parentElement?.offsetHeight,
            style: {
              width: iframe.parentElement?.style.width,
              height: iframe.parentElement?.style.height
            }
          }
        })),
        allIframes: allIframes.length,
        playerContainers: playerContainers.length,
        hasYTAPI: typeof window.YT !== 'undefined',
        hasYTPlayer: typeof window.YT?.Player !== 'undefined'
      };
    });
    
    console.log('\n🎥 YOUTUBE API STATUS:');
    console.log('  YT API loaded:', domAnalysis.hasYTAPI ? '✅ YES' : '❌ NO');
    console.log('  YT.Player available:', domAnalysis.hasYTPlayer ? '✅ YES' : '❌ NO');
    
    console.log('\n📊 DOM STRUCTURE:');
    console.log('  Total iframes:', domAnalysis.allIframes);
    console.log('  YouTube iframes:', domAnalysis.youtubeIframes.length);
    console.log('  Player containers:', domAnalysis.playerContainers);
    
    if (domAnalysis.youtubeIframes.length > 0) {
      console.log('\n🔍 YOUTUBE IFRAME DETAILS:');
      domAnalysis.youtubeIframes.forEach((iframe, index) => {
        console.log(`\n  Iframe #${index + 1}:`);
        console.log('    Dimensions:', iframe.width + 'x' + iframe.height);
        console.log('    Client Dimensions:', iframe.clientWidth + 'x' + iframe.clientHeight);
        console.log('    Style width:', iframe.style.width || 'not set');
        console.log('    Style height:', iframe.style.height || 'not set');
        console.log('    Display:', iframe.style.display || 'default');
        console.log('    Position:', iframe.style.position || 'default');
        console.log('    Parent class:', iframe.parent.className);
        console.log('    Parent dimensions:', iframe.parent.width + 'x' + iframe.parent.height);
        console.log('    Parent style width:', iframe.parent.style.width || 'not set');
        console.log('    Parent style height:', iframe.parent.style.height || 'not set');
        console.log('    Src:', iframe.src.substring(0, 80) + '...');
      });
    } else {
      console.log('\n❌ NO YOUTUBE IFRAMES FOUND!');
    }
    
    await page.screenshot({ path: 'youtube-dom-test.png', fullPage: false });
    console.log('\n📸 Screenshot saved: youtube-dom-test.png');
    
    console.log('\n' + '='.repeat(70));
    console.log('⏸️  Browser staying open for manual inspection (30 sec)...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testYouTubeDOM();

