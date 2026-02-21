import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Define mobile viewports to test
const viewports = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPhone 12', width: 390, height: 844 },
  { name: 'iPhone 14 Pro', width: 393, height: 852 },
  { name: 'Pixel 5', width: 393, height: 851 },
  { name: 'Galaxy S21', width: 360, height: 800 },
  { name: 'Small Mobile', width: 320, height: 568 },
];

test.describe('Mobile Carousel Player - UI/UX Analysis', () => {
  viewports.forEach(viewport => {
    test(`Capture carousel on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
      });
      
      const page = await context.newPage();
      
      try {
        // Navigate to discover page
        await page.goto('http://localhost:3000/discover', { waitUntil: 'networkidle' });
        
        // Wait for carousel to load
        await page.waitForSelector('[class*="carousel"]', { timeout: 5000 }).catch(() => {
          console.log('Carousel selector not found, waiting for content...');
        });
        
        // Wait a bit for animations to settle
        await page.waitForTimeout(2000);
        
        // Create screenshots directory
        const screenshotsDir = path.join(process.cwd(), 'carousel-screenshots');
        if (!fs.existsSync(screenshotsDir)) {
          fs.mkdirSync(screenshotsDir, { recursive: true });
        }
        
        // Take full page screenshot
        const filename = path.join(screenshotsDir, `carousel-${viewport.name.replace(/\s+/g, '-')}-${viewport.width}x${viewport.height}.png`);
        await page.screenshot({ path: filename, fullPage: true });
        
        console.log(`✅ Screenshot saved: ${filename}`);
        
        // Get carousel dimensions and info
        const carouselInfo = await page.evaluate(() => {
          const carousel = document.querySelector('[class*="carousel"]') || document.querySelector('[class*="Carousel"]');
          if (!carousel) {
            return { error: 'Carousel not found' };
          }
          
          const rect = carousel.getBoundingClientRect();
          const tracks = document.querySelectorAll('[class*="track"]');
          
          return {
            carouselWidth: rect.width,
            carouselHeight: rect.height,
            carouselTop: rect.top,
            carouselLeft: rect.left,
            trackCount: tracks.length,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
          };
        }).catch(() => ({ error: 'Could not get carousel info' }));
        
        console.log(`📊 Carousel Info for ${viewport.name}:`, carouselInfo);
        
      } catch (error) {
        console.error(`❌ Error testing ${viewport.name}:`, error);
      } finally {
        await context.close();
      }
    });
  });
});

test('Analyze carousel layout and spacing', async ({ page }) => {
  // Test on iPhone 12
  await page.setViewportSize({ width: 390, height: 844 });
  
  await page.goto('http://localhost:3000/discover', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Get detailed layout information
  const layoutInfo = await page.evaluate(() => {
    const carousel = document.querySelector('[class*="carousel"]') || document.querySelector('[class*="Carousel"]');
    if (!carousel) return { error: 'Carousel not found' };
    
    const currentTrack = carousel.querySelector('[class*="current"]') || carousel.querySelector('img');
    const prevTrack = carousel.querySelector('[class*="prev"]');
    const nextTrack = carousel.querySelector('[class*="next"]');
    
    const getElementInfo = (el: Element | null, name: string) => {
      if (!el) return { name, found: false };
      const rect = el.getBoundingClientRect();
      const styles = window.getComputedStyle(el);
      return {
        name,
        found: true,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
        fontSize: styles.fontSize,
        padding: styles.padding,
        margin: styles.margin,
      };
    };
    
    return {
      carouselRect: carousel.getBoundingClientRect(),
      currentTrack: getElementInfo(currentTrack, 'Current Track'),
      prevTrack: getElementInfo(prevTrack, 'Previous Track'),
      nextTrack: getElementInfo(nextTrack, 'Next Track'),
      carouselComputedStyle: {
        display: window.getComputedStyle(carousel).display,
        gap: window.getComputedStyle(carousel).gap,
        padding: window.getComputedStyle(carousel).padding,
      },
    };
  });
  
  console.log('📐 Layout Analysis:', JSON.stringify(layoutInfo, null, 2));
  
  // Save analysis to file
  const analysisFile = path.join(process.cwd(), 'carousel-layout-analysis.json');
  fs.writeFileSync(analysisFile, JSON.stringify(layoutInfo, null, 2));
  console.log(`✅ Analysis saved to: ${analysisFile}`);
});

