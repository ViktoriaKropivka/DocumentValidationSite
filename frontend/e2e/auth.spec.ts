import { test, expect } from '@playwright/test';

test.describe('Аутентификация', () => {
    test('пользователь может зарегистрироваться', async ({ page }) => {
        await page.goto('/');
  
        await page.click('text=Войти / Регистрация');

        await page.click('text=Зарегистрироваться');

        await page.fill('input[placeholder="Введите ваше имя"]', 'E2E User');
        await page.fill('input[type="email"]', `e2e_${Date.now()}@test.com`);
        await page.fill('input[type="password"]', 'password123');

        await page.click('button[type="submit"]');

        await expect(page.locator('text=Выйти')).toBeVisible();
    });

    test('пользователь может войти с существующими данными', async ({ page }) => {
        await page.goto('/');
        await page.click('text=Войти / Регистрация');
            
        await page.fill('input[type="email"]', 'admin@test.com');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
            
        await expect(page.locator('text=Выйти')).toBeVisible();
    });

    test('показывает ошибку при неверных данных', async ({ page }) => {
        await page.goto('/');
        await page.click('text=Войти / Регистрация');
        
        await page.fill('input[type="email"]', 'nonexistent@test.com');
        await page.fill('input[type="password"]', 'wrong123');
        await page.click('button[type="submit"]');

        await expect(page.locator('.notification-error')).toBeVisible({ timeout: 10000 });
        
        await expect(page.locator('.auth-submit-btn')).toBeVisible();
    });
});