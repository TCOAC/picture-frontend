import { test, expect } from '@playwright/test'

test('public gallery opens and exposes its search and upload entry points', async ({ page }) => {
  await page.route('**/api/**', async (route) => {
    if (route.request().url().includes('/user/get/login')) {
      await route.fulfill({ json: { code: 40100, message: '未登录' } })
    } else {
      await route.fulfill({ json: { code: 0, data: { records: [], total: '0', current: '1' } } })
    }
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('让好图片，找到它的位置。')
  await expect(page.getByRole('heading', { name: '精选图库' })).toBeVisible()
  await expect(page.getByRole('textbox', { name: '搜索名称或简介，发现更多灵感' })).toBeVisible()
  await expect(page.getByText('请先登录')).toHaveCount(0)
})

test('login and registration routes remain available', async ({ page }) => {
  await page.goto('/user/login')
  await expect(page.getByRole('heading', { name: '云图库 - 用户登录' })).toBeVisible()
  await page.getByRole('link', { name: '去注册' }).click()
  await expect(page.getByRole('heading', { name: /注册/ })).toBeVisible()
})
