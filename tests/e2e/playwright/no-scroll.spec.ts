import { test, expect } from '@playwright/test';

const ROUTES = [
  '/dashboard',
  '/dashboard/productions',
  '/dashboard/templates',
  '/dashboard/team',
  '/dashboard/settings',
  '/dashboard/agents',
  '/dashboard/analytics',
  '/dashboard/queue',
];

test.describe('no-scroll desktop layout (1440x900)', () => {
  for (const route of ROUTES) {
    test(`fits viewport: ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'networkidle' });
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return {
          sw: doc.scrollWidth,
          sh: doc.scrollHeight,
          ww: window.innerWidth,
          wh: window.innerHeight,
        };
      });
      expect(
        overflow.sh,
        `${route} vertical scroll: ${overflow.sh} > ${overflow.wh} (h-scroll=${overflow.sw} > ${overflow.ww})`,
      ).toBeLessThanOrEqual(overflow.wh);
      expect(overflow.sw).toBeLessThanOrEqual(overflow.ww);
    });
  }
});