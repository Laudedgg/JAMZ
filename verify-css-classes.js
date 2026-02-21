import { chromium } from 'playwright';

async function verifyCSSClasses() {
  console.log('🔍 Verifying CSS Classes on Mobile...\n');
  
  const browser = await chromium.launch({ headless: false }); // Non-headless to see what's happening
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  try {
    await page.goto('https://jamz.fun/discover', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Wait for everything to load
    
    // Find the Now Playing Card
    const cardInfo = await page.evaluate(() => {
      // Find the main gradient card
      const card = document.querySelector('[class*="bg-gradient-to-br from-gray-900"]');
      if (!card) return { error: 'Card not found' };
      
      // Find the artwork
      const artwork = card.querySelector('[class*="aspect-square"]');
      
      // Find the content div with padding
      const contentDiv = Array.from(card.querySelectorAll('div')).find(div => 
        div.className.includes('p-')
      );
      
      // Find play button
      const playButton = Array.from(document.querySelectorAll('button')).find(btn => {
        const classes = btn.className;
        return classes.includes('w-12') || classes.includes('w-14');
      });
      
      return {
        card: {
          className: card.className,
          outerHTML: card.outerHTML.substring(0, 500)
        },
        artwork: artwork ? {
          className: artwork.className,
          computedMaxHeight: window.getComputedStyle(artwork).maxHeight,
          computedHeight: window.getComputedStyle(artwork).height
        } : null,
        contentDiv: contentDiv ? {
          className: contentDiv.className,
          computedPadding: window.getComputedStyle(contentDiv).padding
        } : null,
        playButton: playButton ? {
          className: playButton.className,
          computedWidth: window.getComputedStyle(playButton).width,
          computedHeight: window.getComputedStyle(playButton).height
        } : null
      };
    });
    
    console.log('📦 Now Playing Card Classes:');
    console.log(JSON.stringify(cardInfo, null, 2));
    
    // Check if the CSS file contains the responsive classes
    const cssContent = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      const indexCss = links.find(link => link.href.includes('index-'));
      return indexCss ? indexCss.href : null;
    });
    
    console.log('\n📄 CSS File:', cssContent);
    
    // Check if max-h-[280px] class exists in the artwork
    const hasMaxHeight = await page.evaluate(() => {
      const artwork = document.querySelector('[class*="aspect-square"]');
      return artwork ? artwork.className.includes('max-h-') : false;
    });
    
    console.log('\n🔍 Artwork has max-h- class:', hasMaxHeight);
    
    // Check all classes on the artwork
    const artworkClasses = await page.evaluate(() => {
      const artwork = document.querySelector('[class*="aspect-square"]');
      return artwork ? artwork.className.split(' ') : [];
    });
    
    console.log('\n🎨 All Artwork Classes:');
    artworkClasses.forEach(cls => console.log(`   - ${cls}`));
    
    // Wait for user to inspect
    console.log('\n⏸️  Browser window is open. Press Ctrl+C when done inspecting...');
    await page.waitForTimeout(60000); // Wait 60 seconds
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

verifyCSSClasses();

