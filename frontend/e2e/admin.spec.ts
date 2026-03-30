import { test, expect } from '@playwright/test';

test.describe('Админ-панель', () => {
    test('админ может управлять пользователями', async ({ page }) => {
        await page.goto('/');
        await page.click('text=Войти / Регистрация');
        await page.fill('input[type="email"]', 'admin@test.com');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        
        await page.click('text=Управление');
        await expect(page).toHaveURL(/.*admin\/users/);
        
        await expect(page.locator('.users-table')).toBeVisible();
        
        const userRow = page.locator('tr:has(td:has-text("user@test.com"))');
        await userRow.locator('select').selectOption('moderator');
        
        await expect(userRow.locator('.role-badge')).toContainText('Модератор');
    });

  test('обычный пользователь не видит админку', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Войти / Регистрация');
    await page.fill('input[type="email"]', 'user@test.com');
    await page.fill('input[type="password"]', 'user123');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Управление')).not.toBeVisible();
    
    await page.goto('/admin/users');
    await expect(page).toHaveURL('/');
  });
});