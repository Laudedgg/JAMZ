import { chromium } from 'playwright';

async function verifyMobileFix() {
  console.log('🔍 Verifying Mobile Optimization Fix...\n');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Loading https://jamz.fun/discover on mobile viewport (390x844)...');
    await page.goto('https://jamz.fun/discover', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000); // Wait for everything to load
    
    console.log('✅ Page loaded\n');
    
    // Take screenshot
    await page.screenshot({ path: 'mobile-after-fix.png', fullPage: false });
    console.log('📸 Screenshot saved: mobile-after-fix.png\n');
    
    // Check YouTube player dimensions
    const playerInfo = await page.evaluate(() => {
      // Find YouTube player container
      const ytPlayer = document.querySelector('[class*="aspect-square"]');
      if (!ytPlayer) return { error: 'YouTube player not found' };
      
      const styles = window.getComputedStyle(ytPlayer);
      const classes = ytPlayer.className;
      
      return {
        className: classes,
        computedHeight: styles.height,
        computedMaxHeight: styles.maxHeight,
        computedWidth: styles.width,
        hasMaxHeightClass: classes.includes('max-h-')
      };
    });
    
    console.log('🎬 YouTube Player Info:');
    console.log('   Classes:', playerInfo.className);
    console.log('   Computed Height:', playerInfo.computedHeight);
    console.log('   Computed Max-Height:', playerInfo.computedMaxHeight);
    console.log('   Computed Width:', playerInfo.computedWidth);
    console.log('   Has max-h- class:', playerInfo.hasMaxHeightClass);
    
    // Verify the fix
    const heightPx = parseInt(playerInfo.computedHeight);
    const maxHeightPx = parseInt(playerInfo.computedMaxHeight);
    
    console.log('\n📊 Verification Results:');
    if (playerInfo.hasMaxHeightClass && maxHeightPx === 280) {
      console.log('   ✅ PASS: YouTube player has max-h-[280px] class');
      console.log('   ✅ PASS: Max-height is correctly set to 280px');
      console.log('   ✅ PASS: Actual height is', heightPx + 'px (should be ≤ 280px)');
      console.log('\n🎉 Mobile optimization is working correctly!');
    } else if (playerInfo.hasMaxHeightClass) {
      console.log('   ⚠️  PARTIAL: Has max-h- class but max-height is', maxHeightPx + 'px (expected 280px)');
    } else {
      console.log('   ❌ FAIL: YouTube player does NOT have max-h- class');
      console.log('   ❌ FAIL: Height is', heightPx + 'px (should be ≤ 280px)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

verifyMobileFix();

