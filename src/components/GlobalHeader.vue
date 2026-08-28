<script setup lang="ts">
import { h, ref } from 'vue'
import { HomeOutlined } from '@ant-design/icons-vue'
import type { MenuProps } from 'ant-design-vue'
import { useRouter } from 'vue-router'

import { useLoginUserStore } from '@/store/loginUser'

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

// 菜单项列表：每个菜单长什么样、点了跳去哪
const items = ref<MenuProps['items']>([
  {
    key: '/',
    icon: () => h(HomeOutlined),
    label: '主页',
    title: '主页',
  },
  {
    key: '/about',
    label: '关于',
    title: '关于',
  },
  {
    key: 'others',
    label: h(
      'a',
      { href: 'https://space.bilibili.com/244780847?spm_id_from=333.1387.0.0', target: '_blank' },
      'YX的B站首页',
    ),
    title: 'YX的B站首页',
  },
])
</script>

<template>
  <a-row :wrap="false">
    <!-- 左：logo + 标题（固定 200px 宽） -->
    <a-col flex="200px">
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
          {{ loginUserStore.loginUser.userName ?? '无名' }}
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
  margin-left: 32px;
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
