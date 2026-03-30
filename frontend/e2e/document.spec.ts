import { test, expect } from '@playwright/test';

test.describe('Работа с документами', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.click('text=Войти / Регистрация');
    await page.fill('input[type="email"]', 'user@test.com');
    await page.fill('input[type="password"]', 'user123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Выйти')).toBeVisible();
  });

  test('пользователь может загрузить текстовый файл', async ({ page }) => {
    const filePath = 'e2e/test.txt';
    
    await page.setInputFiles('input[type="file"]', filePath);
    await expect(page.locator('.file-success')).toBeVisible();

    await page.fill('textarea[placeholder="Опишите правило..."]', 'проверь длину');
    await page.click('button:has-text("Сгенерировать правила проверки")');

    await expect(page.locator('.rule-item')).toBeVisible({ timeout: 10000 });

    await page.click('button:has-text("Проверить документ")');

    await expect(page.locator('.validation-item')).toBeVisible({ timeout: 10000 });
  });

  test('пользователь может просмотреть историю', async ({ page }) => {
    await page.click('text=Профиль');
    await expect(page).toHaveURL(/.*history/);
    await expect(page.locator('text=История проверок')).toBeVisible();
  });
});