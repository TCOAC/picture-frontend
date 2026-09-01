import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getLoginUserUsingGet } from '@api/userController'
import ACCESS_ENUM from '@/access/accessEnum.ts'

export const useLoginUserStore = defineStore('loginUser', () => {
  const loginUser = ref<API.LoginUserVO>({
    userName: '未登录',
  })

  async function fetchLoginUser() {
    const res = await getLoginUserUsingGet()
    if (res.data.code === 0) {
      loginUser.value = res.data.data!
    } else {
      // 未登录：显式标记为 notLogin
      loginUser.value = { userRole: ACCESS_ENUM.NOT_LOGIN }
    }
  }


  function setLoginUser(newLoginUser: any) {
    loginUser.value = newLoginUser
  }

  return { loginUser, setLoginUser, fetchLoginUser }
})
