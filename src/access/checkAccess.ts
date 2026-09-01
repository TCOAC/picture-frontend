import ACCESS_ENUM from '@/access/accessEnum'

/**
 * 检查权限（判断当前登录用户是否具有某个权限）
 * @param loginUser 当前登录用户
 * @param needAccess 需要有的权限
 * @return 是否有权限
 */
export const checkAccess = (loginUser: any, needAccess = ACCESS_ENUM.NOT_LOGIN) => {
  // 当前登录用户具有的权限（未登录就是 NOT_LOGIN）
  const loginUserAccess = loginUser?.userRole ?? ACCESS_ENUM.NOT_LOGIN
  // 不需要登录，没登录也有权限
  if (needAccess === ACCESS_ENUM.NOT_LOGIN) {
    return true
  }
  // 需要用户登录
  if (needAccess === ACCESS_ENUM.USER) {
    // 如果没登录，无权限
    if (loginUserAccess === ACCESS_ENUM.NOT_LOGIN) {
      return false
    }
  }
  // 需要管理员权限
  if (needAccess === ACCESS_ENUM.ADMIN) {
    // 不为管理员，无权限
    if (loginUserAccess !== ACCESS_ENUM.ADMIN) {
      return false
    }
  }
  return true
}
