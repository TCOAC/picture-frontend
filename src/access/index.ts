import { useLoginUserStore } from '@/store/loginUser'
import router from '@/router'
import ACCESS_ENUM from '@/access/accessEnum'
import { checkAccess } from '@/access/checkAccess'

/**
 * 全局权限校验
 */
router.beforeEach(async (to, from, next) => {
  const loginUserStore = useLoginUserStore()
  let loginUser = loginUserStore.loginUser
  // 如果之前没登录过，自动登录（等后端返回后再往下走）
  if (!loginUser || !loginUser.userRole) {
    await loginUserStore.fetchLoginUser()
    loginUser = loginUserStore.loginUser
  }
  // 目标页面需要的权限（没配就当不需要登录）
  const needAccess = (to.meta?.access as string) ?? ACCESS_ENUM.NOT_LOGIN
  // 需要登录才能访问的页面才做校验
  if (needAccess !== ACCESS_ENUM.NOT_LOGIN) {
    // 没登录 → 踢去登录页
    if (!loginUser || !loginUser.userRole || loginUser.userRole === ACCESS_ENUM.NOT_LOGIN) {
      next(`/user/login?redirect=${to.fullPath}`)
      return
    }
    // 登录了但权限不够 → 踢去无权限页
    if (!checkAccess(loginUser, needAccess)) {
      next('/noAuth')
      return
    }
  }
  next()
})
