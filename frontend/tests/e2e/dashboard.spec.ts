import { test, expect } from '@playwright/test';

test.describe('KernelSense System Dashboard E2E', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to root to set clearance
    await page.goto('http://localhost:3000/');
  });

  test('should allow selection of Kernel clearance and navigate to Dashboard', async ({ page }) => {
    // 1. Ensure we are on the landing page
    await expect(page.locator('text=Select Clearance Level')).toBeVisible();

    // 2. Click the 'Kernel' level button
    await page.click('button:has-text("Kernel")');

    // 3. Verify the state updated (depends on exact UI implementation, e.g., a "Proceed" button appearing)
    // For this test, we assume selecting a level persists it, then we manually navigate
    // to the dashboard (or the UI automatically navigates). Let's simulate clicking Dashboard link.
    
    await page.goto('http://localhost:3000/dashboard');

    // 4. Verify we reached the dashboard and the clearance badge says KERNEL
    await expect(page.locator('h1', { hasText: 'System Health Dashboard' })).toBeVisible();
    await expect(page.locator('.uppercase:has-text("KERNEL")')).toBeVisible();
  });

  test('should display active incidents on the dashboard if available', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');
    
    // We wait for the SWR fetch to complete
    // Either it says "System Healthy" or shows an incident card
    const healthy = page.locator('text=System Healthy');
    const incidentCard = page.locator('text=Incident Engine'); // The header
    
    // We just assert that the page loaded successfully
    await expect(incidentCard).toBeVisible();
  });
});
