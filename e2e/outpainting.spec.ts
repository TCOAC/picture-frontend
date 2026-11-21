import { test, expect } from '@playwright/test'

test('owner can request AI outpainting from picture detail', async ({ page }) => {
  let outpaintRequest: { id?: string; scale?: number; prompt?: string } | undefined
  const picture = {
    id: '1', userId: '7', name: '风景', url: '/api/media/test.png',
    tags: [], picWidth: 4, picHeight: 3, picSize: '100', picFormat: 'png', reviewStatus: 1,
  }
  await page.route('**/api/**', async (route) => {
    const url = route.request().url()
    if (url.includes('/user/get/login')) {
      await route.fulfill({ json: { code: 0, data: { id: '7', userRole: 'user', userName: '作者' } } })
    } else if (url.includes('/picture/ai/outpaint')) {
      outpaintRequest = route.request().postDataJSON()
      await route.fulfill({ json: { code: 0, data: { ...picture, picWidth: 8, picHeight: 6 } } })
    } else if (url.includes('/picture/get/vo')) {
      await route.fulfill({ json: { code: 0, data: picture } })
    } else {
      await route.fulfill({ json: { code: 0, data: null } })
    }
  })

  await page.goto('/picture/1')
  await page.getByRole('button', { name: 'AI 扩图' }).click()
  await page.getByPlaceholder('例如：向画面四周延伸同样的风景').fill('延伸山脉')
  await page.getByRole('dialog').getByRole('button', { name: '开始扩图' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(outpaintRequest).toEqual({ id: '1', scale: 1.5, prompt: '延伸山脉' })
})
