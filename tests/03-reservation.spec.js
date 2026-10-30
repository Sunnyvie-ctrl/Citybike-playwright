const { test, expect } = require('@playwright/test');

// MISSION 3 — Add two realistic tests:
// (a) invalid email gives visible error without a POST to /api/reservations
// (b) a successful reservation; intercept/mock POST /api/reservations and assert
//     the JSON request payload and success message.

test('invalid email blocks reservation', async ({ page }) => {
  let requestSent = false;

  page.on('request', (req) => {
    if (req.url().includes('/api/reservations') && req.method() === 'POST') {
      requestSent = true;
    }
  });

  await page.goto('/');

  await expect(page.getByTestId('station-card')).toHaveCount(4);

  await page.getByRole('button', { name: 'Reserve at Central Square' }).click();

  await page.locator('#email').fill('not-an-email');
  await page.locator('#confirm').click();

  await expect(page.locator('#email-error')).toBeVisible();
  expect(requestSent).toBe(false);
});

test('reservation sends correct payload and confirms booking', async ({ page }) => {
  let capturedPayload = null;

  await page.route('**/api/reservations', async (route) => {
    if (route.request().method() === 'POST') {
      capturedPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ reservationId: 'CB-DEMO-777' })
      });
    } else {
      await route.continue();
    }
  });

  await page.goto('/');

  await expect(page.getByTestId('station-card')).toHaveCount(4);

  await page.getByRole('button', { name: 'Reserve at Central Square' }).click();
  await page.locator('#email').fill('student@example.com');
  await page.locator('#confirm').click();

  expect(capturedPayload).toEqual({
    stationId: 'central',
    email: 'student@example.com'
  });

  await expect(page.locator('#result')).toContainText('CB-DEMO-777');
});