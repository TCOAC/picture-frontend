<script setup lang="ts">
import { computed, h, ref } from 'vue'
import { HomeOutlined } from '@ant-design/icons-vue'
import type { MenuProps } from 'ant-design-vue'
import { useRouter } from 'vue-router'

import { useLoginUserStore } from '@/store/loginUser'

import { message } from 'ant-design-vue'
import { LogoutOutlined } from '@ant-design/icons-vue'
import { userLogoutUsingPost } from '@api/userController'
import { checkAccess } from '@/access/checkAccess.ts'
import ACCESS_ENUM from '@/access/accessEnum.ts'

const loginUserStore = useLoginUserStore()

const router = useRouter()

// 路由跳转事件
const doMenuClick = ({ key }: { key: string }) => {
  router.push({
    path: key,
  })
}

// 当前选中的菜单项的 key（数组）
const current = ref<string[]>([router.currentRoute.value.path])
// 路由跳转后，自动更新菜单选中项（高亮）
router.afterEach((to) => {
  current.value = [to.path]
})

// 用户注销
const doLogout = async () => {
  const res = await userLogoutUsingPost()
  if (res.data.code === 0) {
    loginUserStore.setLoginUser({ userName: '未登录' })
    message.success('退出登录成功')
    await router.push('/user/login')
  } else {
    message.error('退出登录失败，' + res.data.message)
  }
}

// 菜单列表
const originItems = [
  {
    key: '/',
    icon: () => h(HomeOutlined),
    label: '主页',
    title: '主页',
  },
  {
    key: '/admin/userManage',
    label: '用户管理',
    title: '用户管理',
  },
  {
    key: 'others',
    label: h('a', { href: 'https://github.com/TCOAC', target: '_blank' }, 'Github'),
    title: 'Github',
  },
]

// 过滤菜单项
// 把菜单项转成对应的路由（通过 key 匹配路由的 path）
const menuToRouteItem = (menu: any) => {
  return router.getRoutes().find((item) => item.path === menu.key)
}

// 过滤菜单项
const filterMenus = (menus = [] as MenuProps['items']) => {
  return (menus ?? []).filter((menu) => {
    const item = menuToRouteItem(menu)
    // 明确不展示在菜单里的路由，直接过滤
    if (item?.meta?.hideInMenu) {
      return false
    }
    // 根据权限过滤菜单：有权限返回 true，保留该菜单

    return checkAccess(
      loginUserStore.loginUser,
      (item?.meta?.access as string) ?? ACCESS_ENUM.NOT_LOGIN,
    )
  })
}

// 展示在菜单的路由数组
const items = computed(() => filterMenus(originItems))
</script>

<template>
  <a-row :wrap="false">
    <!-- 左：logo + 标题（固定 200px 宽） -->
    <a-col flex="160px">
      <RouterLink to="/">
        <div class="title-bar">
          <img class="logo" src="../assets/logo.png" alt="logo" />
          <div class="title">云图库</div>
        </div>
      </RouterLink>
    </a-col>

    <!-- 中：导航菜单（自动撑满剩余宽度） -->
    <a-col flex="auto" id="menus-col">
      <a-menu
        :key="items.length"
        v-model:selectedKeys="current"
        mode="horizontal"
        :items="items"
        @click="doMenuClick"
      />
    </a-col>

    <!-- 右：登录按钮（固定 120px 宽） -->
    <a-col flex="120px">
      <div class="user-login-status">
        <div v-if="loginUserStore.loginUser.id">
          <a-dropdown>
            <!-- 用户头像 -->
            <a-avatar :src="loginUserStore.loginUser.userAvatar">
              {{ loginUserStore.loginUser.userName ?? '无名' }}
            </a-avatar>
            <!-- 用户菜单 -->
            <template #overlay>
              <a-menu>
                <a-menu-item @click="doLogout">
                  <LogoutOutlined />
                  退出登录
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
        <div v-else>
          <a-button type="primary" href="/user/login">登录</a-button>
        </div>
      </div>
    </a-col>
  </a-row>
</template>

<style scoped>
/* 菜单：去掉底部横线，和页头一样高，和标题拉开间距 */
:deep(.ant-menu-horizontal) {
  border-bottom: none;
  line-height: 62px;
}

/* 菜单列左侧留点间距 */
#menus-col {
  margin-left: 16px;
}

/* 右侧登录区固定页头高度，按钮垂直居中 */
.user-login-status {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 64px;
}

.title-bar {
  display: flex;
  align-items: center;
}

.title {
  color: black;
  font-size: 18px;
  margin-left: 16px;
}

.logo {
  height: 48px;
}
</style>
