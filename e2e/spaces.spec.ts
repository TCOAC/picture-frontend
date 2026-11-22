import { expect, test } from '@playwright/test'

test('team owner invites a member and changes access', async ({ page }) => {
  const space = {
    id: '100',
    userId: '1',
    spaceName: '设计团队',
    spaceType: 1,
    spaceLevel: 0,
    totalSize: '0',
    maxSize: '104857600',
    totalCount: '0',
    maxCount: '100',
    role: 'admin',
  }
  const invitations: Array<{ id: string; userAccount?: string; userId?: string; spaceRole: string }> = []
  let invited = false

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/user/get/login')) {
      await route.fulfill({ json: { code: 0, data: { id: '1', userRole: 'user', userName: '创建者' } } })
    } else if (url.pathname.endsWith('/space/mine')) {
      await route.fulfill({ json: { code: 0, data: [space] } })
    } else if (url.pathname.endsWith('/space/members')) {
      await route.fulfill({
        json: {
          code: 0,
          data: [
            { id: '10', userId: '1', spaceRole: 'admin', userName: '创建者' },
            ...(invited ? [{ id: '11', userId: '2', spaceRole: invitations.at(-1)?.spaceRole, userName: '设计师' }] : []),
          ],
        },
      })
    } else if (url.pathname.endsWith('/space/member')) {
      invitations.push(route.request().postDataJSON())
      invited = true
      await route.fulfill({ json: { code: 0, data: true } })
    } else {
      await route.fulfill({ json: { code: 0, data: null } })
    }
  })

  await page.goto('/space')
  await page.getByRole('button', { name: '团队成员' }).click()
  await expect(page.getByRole('dialog').getByRole('heading', { name: '创建者' })).toBeVisible()
  await page.getByRole('textbox', { name: '成员登录账号' }).fill('designer')
  await page.getByRole('button', { name: '添加成员' }).click()
  await expect(page.getByText('设计师')).toBeVisible()
  expect(invitations[0]).toMatchObject({ id: '100', userAccount: 'designer', spaceRole: 'editor' })

  await page.locator('.member-list .ant-select-selector').click()
  await page.getByText('查看', { exact: true }).click()
  expect(invitations[1]).toMatchObject({ id: '100', userId: '2', spaceRole: 'viewer' })
})
