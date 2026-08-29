import { test, expect } from '@playwright/test';

const STATIC_ROUTES = [
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
  for (const route of STATIC_ROUTES) {
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
        `${route} vertical scroll: ${overflow.sh} > ${overflow.wh}`,
      ).toBeLessThanOrEqual(overflow.wh);
      expect(overflow.sw).toBeLessThanOrEqual(overflow.ww);
    });
  }
});

test.describe('production page no-scroll', () => {
  test('uses the first production', async ({ page, request }) => {
    const res = await request.get('/api/productions');
    const data = (await res.json()) as { productions: { id: string }[] };
    const id = data.productions[0]?.id;
    test.skip(!id, 'no productions to test against');
    for (const tab of ['overview', 'story', 'characters', 'scenes', 'shots', 'continuity', 'runs', 'settings']) {
      await page.goto(`/dashboard/productions/${id}/${tab === 'overview' ? '' : tab}`, {
        waitUntil: 'networkidle',
      });
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return { sh: doc.scrollHeight, wh: window.innerHeight, sw: doc.scrollWidth, ww: window.innerWidth };
      });
      expect(
        overflow.sh,
        `/${tab} vertical scroll: ${overflow.sh} > ${overflow.wh}`,
      ).toBeLessThanOrEqual(overflow.wh);
      expect(overflow.sw).toBeLessThanOrEqual(overflow.ww);
    }
  });
});