import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Outcome MVP flows', () => {
  test('CSV import -> WhatsApp approval -> timeline updated', async ({ page }) => {
    await page.goto('/inbox');

    const filePath = path.resolve(__dirname, 'fixtures/indiamart.csv');
    await page.setInputFiles('input[type="file"]', filePath);

    await page.getByRole('button', { name: 'Import CSV' }).click();
    await expect(page.getByText('Imported 1 rows')).toBeVisible();

    await page.getByRole('link', { name: 'Open' }).first().click();
    await page.waitForURL(/\/lead\//);
    const leadUrl = page.url();

    page.once('dialog', (dialog) => dialog.accept('Hello! Thanks for your enquiry.'));
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: /Draft WhatsApp/i }).click();

    await page.goto('/approvals');
    await page.getByRole('button', { name: /Approve & Send/i }).first().click();
    await expect(page.getByText('Done.')).toBeVisible();

    await page.goto(leadUrl);
    await expect(page.getByText('Hello! Thanks for your enquiry.')).toBeVisible();
  });

  test('Manual intake -> follow-up task created', async ({ page }) => {
    await page.goto('/inbox');

    await page.locator('label:has-text("Source") select').selectOption('instagram');
    await page.locator('label:has-text("Name") input').fill('Maya');
    await page.locator('label:has-text("Phone") input').fill('9000000000');
    await page.locator('label:has-text("Email") input').fill('maya@example.com');
    await page.locator('textarea[placeholder*="Paste DM"]').fill('Interested in your catalog.');

    await page.getByRole('button', { name: 'Save Intake' }).click();
    await expect(page.getByText('Saved. Follow-up task created.')).toBeVisible();
    await expect(page.getByText('Follow-up tasks: 1')).toBeVisible();
  });

  test('Quote approval updates lead status', async ({ page }) => {
    await page.goto('/inbox');

    await page.locator('label:has-text("Name") input').fill('Raj');
    await page.locator('label:has-text("Phone") input').fill('9111111111');
    await page.locator('label:has-text("Email") input').fill('raj@example.com');
    await page.locator('textarea[placeholder*="Paste DM"]').fill('Need a quote for pumps.');

    await page.getByRole('button', { name: 'Save Intake' }).click();
    await expect(page.getByText('Saved. Follow-up task created.')).toBeVisible();

    await page.getByRole('link', { name: 'Open' }).first().click();
    await page.waitForURL(/\/lead\//);
    const leadUrl = page.url();

    const responses = ['Quote for Raj', 'Pump Model X', '2', '1500'];
    page.on('dialog', (dialog) => {
      if (dialog.type() === 'prompt') {
        const response = responses.shift();
        dialog.accept(response || '');
        return;
      }
      dialog.accept();
    });

    await page.getByRole('button', { name: /Draft Quote/i }).click();

    await page.goto('/approvals');
    await page.getByRole('button', { name: /Approve & Send/i }).first().click();
    await expect(page.getByText('Done.')).toBeVisible();

    await page.goto(leadUrl);
    await expect(page.getByText('quoted')).toBeVisible();
  });
});
