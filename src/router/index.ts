import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import UserLoginPage from '@/pages/user/UserLoginPage.vue'
import UserRegisterPage from '@/pages/user/UserRegisterPage.vue'
import UserManagePage from '@/pages/admin/UserManagePage.vue'
import NoAuthPage from '@/pages/NoAuthPage.vue'
import ACCESS_ENUM from '@/access/accessEnum'
import GalleryPage from '@/pages/GalleryPage.vue'
import UploadPage from '@/pages/UploadPage.vue'
import PictureDetailPage from '@/pages/PictureDetailPage.vue'
import SharePage from '@/pages/SharePage.vue'
import SpacesPage from '@/pages/SpacesPage.vue'
import AnalysisPage from '@/pages/InsightsPage.vue'
import SimilarPage from '@/pages/SimilarPage.vue'
import SpaceManagePage from '@/pages/admin/SpaceManagePage.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: '主页',
      component: GalleryPage,
    },
    { path: '/upload', component: UploadPage, meta: { access: ACCESS_ENUM.USER } },
    { path: '/my', component: GalleryPage, meta: { access: ACCESS_ENUM.USER } },
    { path: '/picture/:id', component: PictureDetailPage },
    { path: '/share/:code', component: SharePage },
    { path: '/space', component: SpacesPage, meta: { access: ACCESS_ENUM.USER } },
    { path: '/space/:id', component: GalleryPage, meta: { access: ACCESS_ENUM.USER } },
    { path: '/analysis', component: AnalysisPage, meta: { access: ACCESS_ENUM.USER } },
    { path: '/admin/analysis', component: AnalysisPage, meta: { access: ACCESS_ENUM.ADMIN } },
    { path: '/similar/:id', component: SimilarPage },
    { path: '/admin/pictures', component: GalleryPage, meta: { access: ACCESS_ENUM.ADMIN } },
    { path: '/admin/pictureManage', redirect: '/admin/pictures', meta: { access: ACCESS_ENUM.ADMIN } },
    { path: '/admin/spaces', component: SpaceManagePage, meta: { access: ACCESS_ENUM.ADMIN } },
    {
      path: '/user/login',
      name: '用户登录',
      component: UserLoginPage,
    },
    {
      path: '/user/register',
      name: '用户注册',
      component: UserRegisterPage,
    },
    {
      path: '/admin/userManage',
      name: '用户管理',
      component: UserManagePage,
      meta: {
        access: ACCESS_ENUM.ADMIN,
      },
    },
    {
      path: '/noAuth',
      name: '无权限',
      component: NoAuthPage,
      meta: {
        hideInMenu: true,
      },
    },
  ],
})

export default router
