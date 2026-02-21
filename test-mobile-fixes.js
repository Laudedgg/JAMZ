import { chromium } from 'playwright';

async function testMobileFixes() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Testing mobile Discover page fixes...\n');
    await page.goto('https://jamz.fun/discover?_=' + Date.now(), { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    
    await page.waitForTimeout(12000);
    
    // Test 1: Check header visibility and positioning
    console.log('✅ Test 1: Header Visibility');
    const headerTest = await page.evaluate(() => {
      const websiteNav = document.querySelector('.fixed.w-full.z-50');
      const discoverHeader = document.querySelector('.fixed.top-\\[100px\\]');
      
      const navRect = websiteNav?.getBoundingClientRect();
      const headerRect = discoverHeader?.getBoundingClientRect();
      
      return {
        websiteNavExists: !!websiteNav,
        websiteNavHeight: navRect?.height,
        discoverHeaderExists: !!discoverHeader,
        discoverHeaderTop: headerRect?.top,
        discoverHeaderVisible: !!discoverHeader && headerRect.top >= 0,
        noOverlap: navRect && headerRect ? headerRect.top >= navRect.bottom : false
      };
    });
    console.log('   Website Nav exists:', headerTest.websiteNavExists);
    console.log('   Discover Header exists:', headerTest.discoverHeaderExists);
    console.log('   Discover Header top:', headerTest.discoverHeaderTop);
    console.log('   Header visible:', headerTest.discoverHeaderVisible);
    console.log('   No overlap:', headerTest.noOverlap);
    
    // Test 2: Check YouTube player size
    console.log('\n✅ Test 2: YouTube Player Size');
    const playerTest = await page.evaluate(() => {
      const player = document.querySelector('.fixed.top-\\[168px\\]');
      const youtubeContainer = document.querySelector('.max-h-\\[200px\\]');
      
      const playerRect = player?.getBoundingClientRect();
      const youtubeRect = youtubeContainer?.getBoundingClientRect();
      
      return {
        playerExists: !!player,
        playerTop: playerRect?.top,
        playerHeight: playerRect?.height,
        youtubeExists: !!youtubeContainer,
        youtubeHeight: youtubeRect?.height,
        youtubeMaxHeight: window.getComputedStyle(youtubeContainer).maxHeight
      };
    });
    console.log('   Player exists:', playerTest.playerExists);
    console.log('   Player top:', playerTest.playerTop);
    console.log('   Player height:', playerTest.playerHeight);
    console.log('   YouTube container height:', playerTest.youtubeHeight);
    console.log('   YouTube max-height:', playerTest.youtubeMaxHeight);
    
    // Test 3: Check track list accessibility
    console.log('\n✅ Test 3: Track List Accessibility');
    const trackListTest = await page.evaluate(() => {
      const trackListContainer = document.querySelector('.pt-\\[568px\\]');
      const trackListBox = trackListContainer?.querySelector('.bg-gradient-to-br');
      const firstTrack = trackListBox?.querySelector('[class*="space-y"]');
      
      const containerRect = trackListContainer?.getBoundingClientRect();
      const boxRect = trackListBox?.getBoundingClientRect();
      
      return {
        containerExists: !!trackListContainer,
        boxExists: !!trackListBox,
        hasBackground: !!trackListBox,
        hasBorder: trackListBox?.classList.contains('border'),
        firstTrackExists: !!firstTrack,
        containerTop: containerRect?.top,
        boxTop: boxRect?.top
      };
    });
    console.log('   Track list container exists:', trackListTest.containerExists);
    console.log('   Track list box exists:', trackListTest.boxExists);
    console.log('   Has background:', trackListTest.hasBackground);
    console.log('   Has border:', trackListTest.hasBorder);
    console.log('   First track exists:', trackListTest.firstTrackExists);
    
    // Test 4: Check vote button icons
    console.log('\n✅ Test 4: Vote Button Icons');
    const voteButtonTest = await page.evaluate(() => {
      const upvoteButton = document.querySelector('button[aria-label*="vote"]');
      const upvoteIcon = upvoteButton?.querySelector('svg');
      const allVoteButtons = document.querySelectorAll('button[aria-label*="vote"]');
      
      return {
        voteButtonsCount: allVoteButtons.length,
        upvoteButtonExists: !!upvoteButton,
        upvoteIconExists: !!upvoteIcon,
        upvoteIconClass: upvoteIcon?.getAttribute('class'),
        allButtonsHaveIcons: Array.from(allVoteButtons).every(btn => btn.querySelector('svg'))
      };
    });
    console.log('   Vote buttons count:', voteButtonTest.voteButtonsCount);
    console.log('   Upvote button exists:', voteButtonTest.upvoteButtonExists);
    console.log('   Upvote icon exists:', voteButtonTest.upvoteIconExists);
    console.log('   All buttons have icons:', voteButtonTest.allButtonsHaveIcons);
    
    // Take screenshots
    await page.screenshot({ path: 'mobile-fix-1-initial.png', fullPage: false });
    console.log('\n📸 Initial screenshot saved');
    
    // Scroll to see track list
    await page.evaluate(() => window.scrollBy(0, 400));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'mobile-fix-2-scrolled.png', fullPage: false });
    console.log('📸 Scrolled screenshot saved');
    
    // Full page screenshot
    await page.screenshot({ path: 'mobile-fix-3-fullpage.png', fullPage: true });
    console.log('📸 Full page screenshot saved');
    
    console.log('\n🎉 All tests complete!');
    console.log('⏸️  Browser will stay open for 2 minutes...');
    await page.waitForTimeout(120000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testMobileFixes();

