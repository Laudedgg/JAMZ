/**
 * Production Diagnostic Script
 * 
 * Run this in the browser console on https://jamz.fun/ (mobile view)
 * to diagnose why the hero section is not filling the viewport
 * 
 * Instructions:
 * 1. Open https://jamz.fun/ in Chrome
 * 2. Open Chrome DevTools (F12 or Cmd+Option+I)
 * 3. Switch to mobile view (Cmd+Shift+M)
 * 4. Select "iPhone SE" device
 * 5. Refresh the page
 * 6. Go to Console tab
 * 7. Copy and paste this entire script
 * 8. Press Enter
 */

(function() {
  console.log('\n' + '='.repeat(70));
  console.log('JAMZ.FUN PRODUCTION DIAGNOSTIC');
  console.log('='.repeat(70));
  
  // Get viewport info
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
    visualHeight: window.visualViewport?.height || window.innerHeight
  };
  
  console.log('\n📱 VIEWPORT:');
  console.log(`   window.innerWidth: ${viewport.width}px`);
  console.log(`   window.innerHeight: ${viewport.height}px`);
  console.log(`   visualViewport.height: ${viewport.visualHeight}px`);
  
  // Find hero section
  const hero = document.querySelector('.relative.h-screen.flex.items-center.justify-center.overflow-hidden');
  
  if (!hero) {
    console.log('\n❌ ERROR: Hero section not found!');
    console.log('   Looking for element with classes: .relative.h-screen.flex.items-center.justify-center.overflow-hidden');
    return;
  }
  
  console.log('\n✅ Hero section found');
  
  // Get hero measurements
  const rect = hero.getBoundingClientRect();
  const styles = window.getComputedStyle(hero);
  
  console.log('\n🎯 HERO SECTION MEASUREMENTS:');
  console.log(`   Top position: ${rect.top}px (expected: 0px)`);
  console.log(`   Height: ${rect.height}px (expected: ${viewport.height}px)`);
  console.log(`   Computed height: ${styles.height}`);
  console.log(`   Computed min-height: ${styles.minHeight}`);
  console.log(`   Fills viewport: ${Math.abs(rect.height - viewport.height) < 10 ? '✅ YES' : '❌ NO'}`);
  
  // Check parent container
  const main = hero.closest('main');
  if (main) {
    const mainStyles = window.getComputedStyle(main);
    const mainRect = main.getBoundingClientRect();
    console.log('\n📦 PARENT CONTAINER (main):');
    console.log(`   Padding-top: ${mainStyles.paddingTop}`);
    console.log(`   Top position: ${mainRect.top}px`);
  }
  
  // Check CSS rules
  console.log('\n🔍 CSS RULES CHECK:');
  
  // Check if media query matches
  const mediaQuery = window.matchMedia('(max-width: 768px)');
  console.log(`   Media query (max-width: 768px): ${mediaQuery.matches ? '✅ MATCHES' : '❌ NO MATCH'}`);
  
  // Try to find the CSS rule
  let foundRule = false;
  for (let sheet of document.styleSheets) {
    try {
      for (let rule of sheet.cssRules || sheet.rules) {
        if (rule.cssText && rule.cssText.includes('.h-screen') && rule.cssText.includes('100vh')) {
          console.log(`   Found .h-screen rule: ${rule.cssText.substring(0, 100)}...`);
          foundRule = true;
          break;
        }
      }
    } catch (e) {
      // CORS error, skip
    }
  }
  
  if (!foundRule) {
    console.log('   ⚠️  Could not find .h-screen CSS rule (might be in external stylesheet)');
  }
  
  // Check visible sections
  console.log('\n👀 VISIBLE SECTIONS:');
  const allSections = Array.from(document.querySelectorAll('section, .relative.h-screen'));
  let visibleCount = 0;
  
  allSections.forEach((section, index) => {
    const sectionRect = section.getBoundingClientRect();
    const isVisible = sectionRect.top < viewport.height && sectionRect.bottom > 0;
    const isHero = section.classList.contains('h-screen');
    
    if (isVisible) {
      visibleCount++;
      console.log(`   ${isHero ? '🎯 HERO' : '📄 Section'} ${index}: top=${sectionRect.top.toFixed(0)}px, height=${sectionRect.height.toFixed(0)}px`);
    }
  });
  
  console.log(`   Total visible sections: ${visibleCount} (expected: 1)`);
  
  // Diagnosis
  console.log('\n🔬 DIAGNOSIS:');
  
  const issues = [];
  
  if (Math.abs(rect.top) > 5) {
    issues.push(`❌ Hero section not at top (${rect.top}px instead of 0px)`);
    issues.push('   → Check if main container has padding-top');
  }
  
  if (Math.abs(rect.height - viewport.height) > 10) {
    issues.push(`❌ Hero section not filling viewport (${rect.height}px instead of ${viewport.height}px)`);
    issues.push('   → CSS .h-screen rule might not be applied');
    issues.push('   → Check if mobile CSS is loaded');
  }
  
  if (visibleCount > 1) {
    issues.push(`❌ Multiple sections visible (${visibleCount} instead of 1)`);
    issues.push('   → Hero section should fill entire viewport');
  }
  
  if (issues.length === 0) {
    console.log('   ✅ Everything looks good!');
  } else {
    issues.forEach(issue => console.log(`   ${issue}`));
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  
  if (Math.abs(rect.height - viewport.height) > 10) {
    console.log('   1. Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+R)');
    console.log('   2. Clear browser cache');
    console.log('   3. Check if latest build is deployed');
    console.log('   4. Purge CDN cache if using Cloudflare/etc');
  }
  
  if (!mediaQuery.matches) {
    console.log('   ⚠️  Media query not matching - viewport might be too wide');
    console.log('   → Make sure viewport width is ≤ 768px');
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('END OF DIAGNOSTIC');
  console.log('='.repeat(70) + '\n');
  
  // Return summary object
  return {
    viewport,
    hero: {
      top: rect.top,
      height: rect.height,
      computedHeight: styles.height,
      fillsViewport: Math.abs(rect.height - viewport.height) < 10
    },
    visibleSections: visibleCount,
    mediaQueryMatches: mediaQuery.matches,
    issues: issues.length
  };
})();

