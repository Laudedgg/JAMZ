import { chromium } from 'playwright';

async function verifyMobileDeployment() {
  console.log('🔍 Starting mobile deployment verification...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 12 dimensions
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Navigating to https://jamz.fun/discover with mobile viewport (390x844)...');
    await page.goto('https://jamz.fun/discover', { waitUntil: 'networkidle' });
    
    // Wait for the Now Playing Card to load
    console.log('⏳ Waiting for Now Playing Card to load...');
    await page.waitForSelector('[class*="bg-gradient-to-br from-gray-900"]', { timeout: 10000 });
    
    // Take screenshot
    console.log('📸 Taking mobile screenshot...');
    await page.screenshot({ path: 'mobile-discover-verification.png', fullPage: false });
    console.log('✅ Screenshot saved: mobile-discover-verification.png\n');
    
    // Inspect the album artwork container
    console.log('🔍 Inspecting Album Artwork Container:');
    const artworkStyles = await page.evaluate(() => {
      const artwork = document.querySelector('[class*="aspect-square"]');
      if (!artwork) return null;
      const computed = window.getComputedStyle(artwork);
      return {
        maxHeight: computed.maxHeight,
        height: computed.height,
        width: computed.width,
        className: artwork.className
      };
    });
    console.log('   Max Height:', artworkStyles?.maxHeight || 'N/A');
    console.log('   Actual Height:', artworkStyles?.height || 'N/A');
    console.log('   Width:', artworkStyles?.width || 'N/A');
    console.log('   Classes:', artworkStyles?.className || 'N/A');
    console.log('   ✅ Expected: max-height: 280px on mobile\n');
    
    // Inspect the Now Playing Card padding
    console.log('🔍 Inspecting Now Playing Card Padding:');
    const cardPadding = await page.evaluate(() => {
      const card = document.querySelector('[class*="bg-gradient-to-br from-gray-900"]');
      if (!card) return null;
      const contentDiv = card.querySelector('[class*="p-"]');
      if (!contentDiv) return null;
      const computed = window.getComputedStyle(contentDiv);
      return {
        padding: computed.padding,
        paddingTop: computed.paddingTop,
        paddingRight: computed.paddingRight,
        paddingBottom: computed.paddingBottom,
        paddingLeft: computed.paddingLeft,
        className: contentDiv.className
      };
    });
    console.log('   Padding:', cardPadding?.padding || 'N/A');
    console.log('   Classes:', cardPadding?.className || 'N/A');
    console.log('   ✅ Expected: 16px (p-4) on mobile, not 24px (p-6)\n');
    
    // Inspect the play/pause button
    console.log('🔍 Inspecting Play/Pause Button:');
    const playButtonStyles = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const playButton = buttons.find(btn => {
        const svg = btn.querySelector('svg');
        return svg && (svg.innerHTML.includes('M6 4') || svg.innerHTML.includes('polygon'));
      });
      if (!playButton) return null;
      const computed = window.getComputedStyle(playButton);
      return {
        width: computed.width,
        height: computed.height,
        className: playButton.className
      };
    });
    console.log('   Width:', playButtonStyles?.width || 'N/A');
    console.log('   Height:', playButtonStyles?.height || 'N/A');
    console.log('   Classes:', playButtonStyles?.className || 'N/A');
    console.log('   ✅ Expected: 48px (w-12 h-12) on mobile, not 56px (w-14 h-14)\n');
    
    // Inspect spacing between elements
    console.log('🔍 Inspecting Element Spacing:');
    const spacingStyles = await page.evaluate(() => {
      const spaceYDiv = document.querySelector('[class*="space-y-"]');
      if (!spaceYDiv) return null;
      const computed = window.getComputedStyle(spaceYDiv);
      const children = Array.from(spaceYDiv.children);
      const gaps = children.slice(1).map((child, idx) => {
        const childComputed = window.getComputedStyle(child);
        return childComputed.marginTop;
      });
      return {
        className: spaceYDiv.className,
        gaps: gaps
      };
    });
    console.log('   Classes:', spacingStyles?.className || 'N/A');
    console.log('   Gaps:', spacingStyles?.gaps || 'N/A');
    console.log('   ✅ Expected: 12px (space-y-3) on mobile, not 16px (space-y-4)\n');
    
    // Check CSS bundle hash
    console.log('🔍 Checking CSS Bundle:');
    const cssInfo = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      return links.map(link => ({
        href: link.href,
        loaded: link.sheet !== null
      }));
    });
    console.log('   CSS Files:', cssInfo.length);
    cssInfo.forEach((css, idx) => {
      console.log(`   [${idx + 1}] ${css.href.split('/').pop()} - Loaded: ${css.loaded}`);
    });
    
    // Check if responsive classes are in the CSS
    console.log('\n🔍 Checking for Responsive Tailwind Classes in CSS:');
    const hasResponsiveClasses = await page.evaluate(() => {
      const sheets = Array.from(document.styleSheets);
      let foundMdClasses = false;
      
      for (const sheet of sheets) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          for (const rule of rules) {
            if (rule.cssText && rule.cssText.includes('@media') && rule.cssText.includes('768px')) {
              foundMdClasses = true;
              break;
            }
          }
        } catch (e) {
          // CORS or other access issues
        }
      }
      
      return foundMdClasses;
    });
    console.log('   Found @media (min-width: 768px) rules:', hasResponsiveClasses ? '✅ YES' : '❌ NO');
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICATION SUMMARY:');
    console.log('='.repeat(60));
    
    const issues = [];
    
    if (artworkStyles?.maxHeight !== '280px') {
      issues.push(`❌ Artwork max-height is ${artworkStyles?.maxHeight}, expected 280px`);
    } else {
      console.log('✅ Artwork max-height: 280px (CORRECT)');
    }
    
    if (cardPadding?.paddingTop !== '16px') {
      issues.push(`❌ Card padding is ${cardPadding?.paddingTop}, expected 16px`);
    } else {
      console.log('✅ Card padding: 16px (CORRECT)');
    }
    
    if (playButtonStyles?.width !== '48px') {
      issues.push(`❌ Play button width is ${playButtonStyles?.width}, expected 48px`);
    } else {
      console.log('✅ Play button: 48px (CORRECT)');
    }
    
    if (!hasResponsiveClasses) {
      issues.push('❌ Responsive @media rules not found in CSS');
    } else {
      console.log('✅ Responsive CSS rules found (CORRECT)');
    }
    
    if (issues.length > 0) {
      console.log('\n⚠️  ISSUES FOUND:');
      issues.forEach(issue => console.log(issue));
      console.log('\n💡 Possible causes:');
      console.log('   - CSS bundle not rebuilt properly');
      console.log('   - Browser caching old CSS');
      console.log('   - Deployment script didn\'t copy new build');
      console.log('   - Tailwind classes not compiled correctly');
    } else {
      console.log('\n🎉 All mobile optimizations verified successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  } finally {
    await browser.close();
  }
}

verifyMobileDeployment();

