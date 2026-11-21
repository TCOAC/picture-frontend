import { test, expect } from '@playwright/test'

test('administrator issues a code and redeems it', async ({ page }) => {
  const code = 'VIP-0123456789ABCDEF0123456789ABCDEF'
  await page.route('**/api/**', async (route) => {
    const url = route.request().url()
    if (url.includes('/user/get/login')) {
      await route.fulfill({ json: { code: 0, data: { id: '1', userRole: 'admin', userName: '管理员' } } })
    } else if (url.includes('/user/vip/issue')) {
      await route.fulfill({ json: { code: 0, data: code } })
    } else if (url.includes('/user/exchange/vip')) {
      await route.fulfill({ json: { code: 0, data: { id: '1', userRole: 'admin', vipExpireTime: '2030-01-01T00:00:00' } } })
    } else {
      await route.fulfill({ json: { code: 0, data: null } })
    }
  })

  await page.goto('/membership')
  await expect(page.getByText('当前没有有效会员')).toBeVisible()
  await page.getByRole('button', { name: '生成兑换码' }).click()
  await expect(page.getByText(code)).toBeVisible()
  await page.getByPlaceholder('VIP- 开头的兑换码').fill(code)
  await page.getByRole('button', { name: '兑换会员' }).click()
  await expect(page.getByText(/有效期至/)).toBeVisible()
})
